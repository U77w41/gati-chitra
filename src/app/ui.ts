import { MESSAGES, TIMING } from '../core/constants';
import type { TextOp } from '../core/types';
import { phaseAt } from '../anim/anim';
import { fitView, screenToWorld, zoomAt } from '../editor/view';
import { canvasMeasure } from '../layout/measure';
import { applyOp } from '../mermaid/ops';
import { setupAnimControls } from './anim-controls';
import { setupCanvasEvents } from './canvas-events';
import { setupDiagnostics } from './diagnostics';
import { createDispatcher } from './dispatcher';
import { setupExportPanel } from './export-panel';
import { setupGallery } from './gallery';
import { setupInlineEditor } from './inline-edit';
import { setupPresentMode } from './present';
import { setupProperties } from './properties';
import { requestRedraw, startRenderLoop } from './render-loop';
import { SAMPLE_TEXT } from './sample';
import { setupKeyboardShortcuts } from './shortcuts';
import { commitText, createState, type AppState, type CommitSource } from './state';
import { loadDoc, loadSettings, safeStore, setupAutosave, setupDocSync } from './storage';
import { setMessageElement, showMessage } from './message';
import { setupStudioApi } from './studio';
import { setupToolbar } from './toolbar';
import { checkInitialShare, setupHashChangeListener, setupShareHandler } from './share-handler';
import { mountChrome } from './chrome';
import { describeDiagram } from './describe';
import { stripFences } from '../mermaid/fences';

export async function initApp(): Promise<void> {
  const store = safeStore();
  mountChrome(document, store, import.meta.env.VITE_SOURCE_URL ?? '', () => requestRedraw());
  document.getElementById('main')?.focus();

  const initialText = loadDoc(store) ?? SAMPLE_TEXT;
  const initialSettings = loadSettings(store);
  const { text: sharedToLoad, error: initialShareError } = await checkInitialShare();

  let state: AppState = createState(initialText, initialSettings);
  let dirty = false;
  const measure = canvasMeasure();

  const sourceEl = document.querySelector<HTMLTextAreaElement>('#source')!;
  const diagnosticsEl = document.querySelector<HTMLUListElement>('#diagnostics')!;
  const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!;
  const messageEl = document.querySelector<HTMLDivElement>('#message')!;
  setMessageElement(messageEl);
  const ctx = canvasEl.getContext('2d')!;

  sourceEl.value = state.text;
  let hasFitted = false;
  let parseTimer: ReturnType<typeof setTimeout> | null = null;
  let pausedPhase = 0;
  const startTime = performance.now();

  const updateDiagnostics = setupDiagnostics(diagnosticsEl, sourceEl);

  function triggerFit(): void {
    const w = canvasEl.clientWidth || canvasEl.width;
    const h = canvasEl.clientHeight || canvasEl.height;
    if (state.scene && w > 0 && h > 0) {
      state.view = fitView(state.scene.layout.bounds, { width: w, height: h });
      if (canvasEl.clientWidth > 0 && canvasEl.clientHeight > 0) {
        hasFitted = true;
      }
      requestRedraw();
    }
  }

  function updateAriaLabel(): void {
    if (state.scene) {
      const desc = describeDiagram(state.doc);
      canvasEl.setAttribute('aria-label', desc.name);
      const descEl = document.getElementById('canvas-desc');
      if (descEl) descEl.textContent = desc.description;
    }
  }

  const autosave = setupAutosave({
    store,
    getText: () => sourceEl.value || state.text,
    onUnavailable: () => showMessage(MESSAGES.storageUnavailable),
    debounceMs: TIMING.autosaveDebounceMs,
  });

  const inlineEditor = setupInlineEditor(
    document.querySelector<HTMLTextAreaElement>('#inline-edit')!,
    () => state,
    canvasEl,
  );

  const updateProps = setupProperties({
    panelEl: document.querySelector<HTMLElement>('#props')!,
    getState: () => state,
    executeOp,
  });

  const updateButtons = setupToolbar({
    getState: () => state, commit, executeOp, triggerFit, doUndo, doRedo,
    onAddNode: (shape) => handleAddNodeAt(
      screenToWorld(state.view, { x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 }),
      shape,
    ),
    sourceEl,
  });

  let freshlyCreatedNodeId: string | null = null;

  function updateAfterCommit(): void {
    if (state.editor.selection) {
      const { kind, id } = state.editor.selection;
      const list = kind === 'node' ? state.doc.nodes : kind === 'edge' ? state.doc.edges : state.doc.groups;
      if (!list.some((item) => item.id === id)) state.editor.selection = null;
    }
    updateDiagnostics(state.doc);
    updateAriaLabel();
    updateButtons();
    updateProps();
    autosave.schedule();
    requestRedraw();
    if (!hasFitted && state.scene) { triggerFit(); hasFitted = true; }
  }

  function commit(text: string, source: CommitSource, opts?: { coalesce?: boolean }): void {
    if (source !== 'typing' && parseTimer) {
      clearTimeout(parseTimer);
      parseTimer = null;
      if (sourceEl.value !== state.text) {
        state = commitText(state, sourceEl.value, 'typing', measure);
      }
    }
    state = commitText(state, text, source, measure, opts);
    if (source === 'typing' || source === 'op') dirty = true;
    sourceEl.value = state.text;
    updateAfterCommit();
  }

  function executeOp(op: TextOp): void {
    const res = applyOp(state.text, op);
    if ('error' in res) {
      showMessage(res.error);
    } else {
      showMessage('');
      const coalesce = op.type === 'renameNode' && freshlyCreatedNodeId === op.id;
      freshlyCreatedNodeId = null;
      commit(res.text, 'op', { coalesce });
    }
  }

  const { dispatch: rawDispatch, handleAddNodeAt } = createDispatcher({
    getState: () => state, measure, commit, executeOp, messageEl, inlineEditor, updateProps,
    setFreshlyCreatedNodeId: (id) => { freshlyCreatedNodeId = id; },
  });
  const dispatch: typeof rawDispatch = (event) => {
    rawDispatch(event);
    requestRedraw();
  };

  function doUndo(): void { commit('', 'undo'); }
  function doRedo(): void { commit('', 'redo'); }

  updateDiagnostics(state.doc);
  updateAriaLabel();
  updateButtons();
  updateProps();
  if (state.scene) { triggerFit(); hasFitted = true; }

  if (sharedToLoad !== null) {
    commit(sharedToLoad, 'share');
    showMessage(MESSAGES.shareOpened);
  } else if (initialShareError) {
    showMessage(initialShareError);
  }

  setupHashChangeListener(
    (shared) => {
      commit(shared, 'share');
      showMessage(MESSAGES.shareOpened);
    },
    (err) => showMessage(err),
  );

  function applySync(t: string): void {
    commit(t, 'open');
    dirty = false;
  }

  setupDocSync({
    store,
    getText: () => state.text,
    isDirty: () => dirty,
    apply: applySync,
    ask: (t) => {
      showMessage(MESSAGES.changedInOtherTab, {
        label: 'Load it',
        run: () => applySync(t),
      });
    },
  });

  sourceEl.addEventListener('input', () => {
    if (parseTimer) clearTimeout(parseTimer);
    parseTimer = setTimeout(() => commit(sourceEl.value, 'typing'), TIMING.parseDebounceMs);
  });
  sourceEl.addEventListener('change', () => {
    if (parseTimer) {
      clearTimeout(parseTimer);
      parseTimer = null;
    }
    if (sourceEl.value !== state.text) {
      commit(sourceEl.value, 'typing');
    }
  });
  sourceEl.addEventListener('paste', (e) => {
    const isFull = (sourceEl.selectionStart === 0 && sourceEl.selectionEnd === sourceEl.value.length) || sourceEl.value.trim() === '';
    if (isFull) {
      const clip = e.clipboardData?.getData('text');
      if (clip) {
        const stripped = stripFences(clip);
        if (stripped !== clip) {
          e.preventDefault();
          sourceEl.value = stripped;
          if (parseTimer) clearTimeout(parseTimer);
          commit(stripped, 'typing');
        }
      }
    }
  });

  const present = setupPresentMode({
    btnPresent: document.querySelector('#btn-present')!,
    canvasPanel: document.querySelector('#canvas-panel')!,
    presentStepEl: document.querySelector('#present-step')!,
    messageEl, getState: () => state, triggerFit,
  });

  const animControls = setupAnimControls({
    animStyleEl: document.querySelector('#anim-style')!,
    animSpeedEl: document.querySelector('#anim-speed')!,
    animDensityEl: document.querySelector('#anim-density')!,
    animGlowEl: document.querySelector('#anim-glow')!,
    animPauseEl: document.querySelector('#anim-pause')!,
    themeEl: document.querySelector('#theme')!,
  }, () => state, store, (paused) => {
    if (paused) pausedPhase = phaseAt((performance.now() - startTime) / 1000, state.settings.anim);
  });

  setupKeyboardShortcuts({
    onUndo: doUndo, onRedo: doRedo, onFit: triggerFit,
    onZoomIn: () => { state.view = zoomAt(state.view, { x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 }, 1.25); requestRedraw(); },
    onZoomOut: () => { state.view = zoomAt(state.view, { x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 }, 0.8); requestRedraw(); },
    onPresent: () => present.start(),
    onTogglePause: () => animControls.togglePause(),
    onDelete: () => dispatch({ type: 'keyDown', key: 'Delete' }),
    onRename: () => dispatch({ type: 'keyDown', key: 'Enter' }),
    onEscape: () => { if (present.isPresenting()) present.exit(); else dispatch({ type: 'keyDown', key: 'Escape' }); },
    isPresenting: present.isPresenting,
  });

  setupCanvasEvents({
    canvasEl, getState: () => state, dispatch,
    updateView: (fn) => { state.view = fn(state.view); requestRedraw(); },
    isPresenting: present.isPresenting,
  });

  startRenderLoop({
    canvasEl, ctx, getState: () => state, measure, startTime,
    getPausedPhase: () => pausedPhase,
    getFocus: present.getCurrentFocus,
    isPresenting: present.isPresenting,
    onResize: () => { if (!hasFitted && state.scene) triggerFit(); },
  });

  setupExportPanel({
    dialogEl: document.querySelector('#export-panel')!,
    getState: () => state, btnExport: document.querySelector('#btn-export')!,
  });

  setupShareHandler({
    btnShare: document.querySelector('#btn-share')!, shareBox: document.querySelector('#share-box')!,
    shareUrlInput: document.querySelector('#share-url')!, shareBoxClose: document.querySelector('#share-box-close'),
    messageEl, getState: () => state,
  });

  setupGallery({
    dialogEl: document.querySelector('#gallery')!, btnTemplates: document.querySelector('#btn-templates')!,
    baseUrl: import.meta.env.BASE_URL, commit, triggerFit, messageEl,
  });

  setupStudioApi({
    getState: () => state, sourceEl, dispatch,
    applyNewText: (t: string) => commit(t, 'open'),
    getPresentStep: present.getPresentStep,
  });

  document.querySelectorAll<HTMLButtonElement>(
    '#toolbar button, #canvas-controls button, #props button, dialog button',
  ).forEach((b) => b.classList.add(b.id === 'btn-export' ? 'btn-primary' : 'btn-secondary'));
}
