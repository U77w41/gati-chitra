import {
  MESSAGES,
  TIMING,
} from '../core/constants';
import type { TextOp } from '../core/types';
import { phaseAt } from '../anim/anim';
import { fitView, panBy } from '../editor/view';
import { canRedo, canUndo } from '../editor/history';
import {
  reduce,
  type EditorEffect,
  type EditorEnv,
  type EditorEvent,
} from '../editor/controller';
import { canvasMeasure } from '../layout/measure';
import { applyOp } from '../mermaid/ops';
import { setupAnimControls } from './anim-controls';
import { setupCanvasEvents } from './canvas-events';
import { downloadBlob } from './download';
import { startRenderLoop } from './render-loop';
import { SAMPLE_TEXT } from './sample';
import {
  commitText,
  createState,
  type AppState,
  type CommitSource,
} from './state';
import {
  loadDoc,
  loadSettings,
  safeStore,
  saveDoc,
} from './storage';
import { setupStudioApi } from './studio';

export function initApp(): void {
  const store = safeStore();
  const initialText = loadDoc(store) ?? SAMPLE_TEXT;
  const initialSettings = loadSettings(store);

  let state: AppState = createState(initialText, initialSettings);
  const measure = canvasMeasure();

  const sourceEl = document.querySelector<HTMLTextAreaElement>('#source')!;
  const diagnosticsEl = document.querySelector<HTMLUListElement>('#diagnostics')!;
  const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!;
  const messageEl = document.querySelector<HTMLDivElement>('#message')!;
  const ctx = canvasEl.getContext('2d')!;

  const btnNew = document.querySelector<HTMLButtonElement>('#btn-new')!;
  const btnOpen = document.querySelector<HTMLButtonElement>('#btn-open')!;
  const btnSave = document.querySelector<HTMLButtonElement>('#btn-save-mmd')!;
  const btnUndo = document.querySelector<HTMLButtonElement>('#btn-undo')!;
  const btnRedo = document.querySelector<HTMLButtonElement>('#btn-redo')!;
  const btnFit = document.querySelector<HTMLButtonElement>('#btn-fit')!;
  const btnAutolayout = document.querySelector<HTMLButtonElement>('#btn-autolayout')!;
  const filePicker = document.querySelector<HTMLInputElement>('#file-picker')!;

  sourceEl.value = state.text;
  let hasFitted = false;
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  let parseTimer: ReturnType<typeof setTimeout> | null = null;
  let storageUnavailableShown = false;
  let pausedPhase = 0;
  const startTime = performance.now();

  function triggerFit(): void {
    if (state.scene) {
      state.view = fitView(state.scene.layout.bounds, {
        width: canvasEl.clientWidth,
        height: canvasEl.clientHeight,
      });
    }
  }

  function updateButtons(): void {
    btnUndo.disabled = !canUndo(state.history);
    btnRedo.disabled = !canRedo(state.history);
    btnAutolayout.disabled = Object.keys(state.doc.pins).length === 0;
  }

  function updateDiagnostics(): void {
    diagnosticsEl.innerHTML = '';
    for (const diag of state.doc.diagnostics) {
      const li = document.createElement('li');
      li.className = diag.severity;
      li.textContent = `Line ${diag.line}: ${diag.message}`;
      li.addEventListener('click', () => {
        const lines = sourceEl.value.split('\n');
        let start = 0;
        for (let i = 0; i < diag.line - 1 && i < lines.length; i++) {
          start += lines[i].length + 1;
        }
        sourceEl.focus();
        sourceEl.setSelectionRange(start, start + (lines[diag.line - 1]?.length ?? 0));
      });
      diagnosticsEl.appendChild(li);
    }
  }

  function updateAriaLabel(): void {
    if (state.scene) {
      const n = state.doc.nodes.length;
      const m = state.doc.edges.length;
      canvasEl.setAttribute('aria-label', `Flowchart with ${n} nodes and ${m} arrows`);
    }
  }

  function scheduleAutosave(): void {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      if (!saveDoc(store, state.text) && !storageUnavailableShown) {
        messageEl.textContent = MESSAGES.storageUnavailable;
        storageUnavailableShown = true;
      }
    }, TIMING.autosaveDebounceMs);
  }

  function updateAfterCommit(): void {
    updateDiagnostics();
    updateAriaLabel();
    updateButtons();
    scheduleAutosave();
    if (!hasFitted && state.scene) {
      triggerFit();
      hasFitted = true;
    }
  }

  function commit(text: string, source: CommitSource): void {
    state = commitText(state, text, source, measure);
    sourceEl.value = state.text;
    updateAfterCommit();
  }

  function executeOp(op: TextOp): void {
    const res = applyOp(state.text, op);
    if ('error' in res) {
      messageEl.textContent = res.error;
    } else {
      messageEl.textContent = '';
      commit(res.text, 'op');
    }
  }

  function handleEffects(effects: EditorEffect[]): void {
    for (const eff of effects) {
      if (eff.type === 'applyOp') executeOp(eff.op);
      else if (eff.type === 'panBy') state.view = panBy(state.view, eff.dx, eff.dy);
      else if (eff.type === 'message') messageEl.textContent = eff.text;
    }
  }

  function dispatch(event: EditorEvent): void {
    const env: EditorEnv = {
      scene: state.scene ?? {
        doc: state.doc,
        layout: { nodes: {}, groups: {}, edges: {}, bounds: { x: 0, y: 0, width: 0, height: 0 } },
      },
      ok: state.doc.ok,
      measure,
    };
    const { state: nextEditor, effects } = reduce(state.editor, event, env);
    state.editor = nextEditor;
    handleEffects(effects);
  }

  const doUndo = () => canUndo(state.history) && commit('', 'undo');
  const doRedo = () => canRedo(state.history) && commit('', 'redo');

  updateDiagnostics();
  updateAriaLabel();
  updateButtons();
  if (state.scene) {
    triggerFit();
    hasFitted = true;
  }

  sourceEl.addEventListener('input', () => {
    if (parseTimer) clearTimeout(parseTimer);
    parseTimer = setTimeout(() => {
      commit(sourceEl.value, 'typing');
    }, TIMING.parseDebounceMs);
  });

  setupAnimControls(
    {
      animStyleEl: document.querySelector('#anim-style')!,
      animSpeedEl: document.querySelector('#anim-speed')!,
      animDensityEl: document.querySelector('#anim-density')!,
      animGlowEl: document.querySelector('#anim-glow')!,
      animPauseEl: document.querySelector('#anim-pause')!,
      themeEl: document.querySelector('#theme')!,
    },
    () => state,
    store,
    (paused) => {
      if (paused) {
        const elapsed = (performance.now() - startTime) / 1000;
        pausedPhase = phaseAt(elapsed, state.settings.anim);
      }
    },
  );

  btnNew.addEventListener('click', () => commit('flowchart TD\n', 'typing'));
  btnOpen.addEventListener('click', () => filePicker.click());
  filePicker.addEventListener('change', () => {
    const file = filePicker.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') commit(reader.result, 'open');
      };
      reader.readAsText(file);
    }
  });
  btnSave.addEventListener('click', () => {
    downloadBlob(sourceEl.value, 'diagram.mmd', 'text/vnd.mermaid');
  });
  btnFit.addEventListener('click', triggerFit);
  btnUndo.addEventListener('click', doUndo);
  btnRedo.addEventListener('click', doRedo);
  btnAutolayout.addEventListener('click', () => executeOp({ type: 'clearPins' }));

  window.addEventListener('keydown', (e) => {
    const isInput =
      (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
      (e.target as HTMLElement)?.tagName === 'INPUT';
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      triggerFit();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (!isInput) {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
        return;
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !e.shiftKey) {
      if (!isInput) {
        e.preventDefault();
        doRedo();
        return;
      }
    }
    if (!isInput || e.key === 'Escape') {
      dispatch({ type: 'keyDown', key: e.key });
    }
  });

  setupCanvasEvents({
    canvasEl,
    getState: () => state,
    dispatch,
    updateView: (fn) => {
      state.view = fn(state.view);
    },
  });

  const ro = new ResizeObserver(() => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvasEl.clientWidth * dpr);
    const h = Math.round(canvasEl.clientHeight * dpr);
    if (canvasEl.width !== w || canvasEl.height !== h) {
      canvasEl.width = w;
      canvasEl.height = h;
    }
  });
  ro.observe(canvasEl);

  startRenderLoop({
    canvasEl,
    ctx,
    getState: () => state,
    measure,
    startTime,
    getPausedPhase: () => pausedPhase,
  });

  setupStudioApi({
    getState: () => state,
    sourceEl,
    applyNewText: (t: string) => commit(t, 'open'),
  });
}
