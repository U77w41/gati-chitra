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
import { startRenderLoop } from './render-loop';
import { SAMPLE_TEXT } from './sample';
import { setupShareHandler } from './share-handler';
import { setupKeyboardShortcuts } from './shortcuts';
import { commitText, createState, type AppState, type CommitSource } from './state';
import { loadDoc, loadSettings, safeStore, saveDoc } from './storage';
import { setupStudioApi } from './studio';
import { setupToolbar } from './toolbar';
import { decodeShare } from '../share/share';
import { mountChrome } from './chrome';

export async function initApp(): Promise<void> {
  const store = safeStore();
  mountChrome(document, store, import.meta.env.VITE_SOURCE_URL ?? '');
  document.getElementById('main')?.focus();

  let initialText = loadDoc(store) ?? SAMPLE_TEXT;
  const initialSettings = loadSettings(store);

  let initialShareError: string | null = null;
  const hash = window.location.hash;
  if (hash.startsWith('#v1')) {
    try {
      const sharedText = await decodeShare(hash);
      if (sharedText !== null) {
        initialText = sharedText;
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        initialShareError = MESSAGES.shareInvalid;
      }
    } catch {
      initialShareError = MESSAGES.shareInvalid;
    }
  }

  let state: AppState = createState(initialText, initialSettings);
  const measure = canvasMeasure();

  const sourceEl = document.querySelector<HTMLTextAreaElement>('#source')!;
  const diagnosticsEl = document.querySelector<HTMLUListElement>('#diagnostics')!;
  const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!;
  const messageEl = document.querySelector<HTMLDivElement>('#message')!;
  const ctx = canvasEl.getContext('2d')!;

  sourceEl.value = state.text;
  let hasFitted = false;
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  let parseTimer: ReturnType<typeof setTimeout> | null = null;
  let storageUnavailableShown = false;
  let pausedPhase = 0;
  const startTime = performance.now();

  const updateDiagnostics = setupDiagnostics(diagnosticsEl, sourceEl);

  function triggerFit(): void {
    if (state.scene) {
      state.view = fitView(state.scene.layout.bounds, {
        width: canvasEl.clientWidth,
        height: canvasEl.clientHeight,
      });
    }
  }

  function updateAriaLabel(): void {
    if (state.scene) {
      canvasEl.setAttribute('aria-label', `Flowchart with ${state.doc.nodes.length} nodes and ${state.doc.edges.length} arrows`);
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
    scheduleAutosave();
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
    sourceEl.value = state.text;
    updateAfterCommit();
  }

  function executeOp(op: TextOp): void {
    const res = applyOp(state.text, op);
    if ('error' in res) {
      messageEl.textContent = res.error;
    } else {
      messageEl.textContent = '';
      const coalesce = op.type === 'renameNode' && freshlyCreatedNodeId === op.id;
      freshlyCreatedNodeId = null;
      commit(res.text, 'op', { coalesce });
    }
  }

  const { dispatch, handleAddNodeAt } = createDispatcher({
    getState: () => state, measure, commit, executeOp, messageEl, inlineEditor, updateProps,
    setFreshlyCreatedNodeId: (id) => { freshlyCreatedNodeId = id; },
  });

  function doUndo(): void { commit('', 'undo'); }
  function doRedo(): void { commit('', 'redo'); }

  updateDiagnostics(state.doc);
  updateAriaLabel();
  updateButtons();
  updateProps();
  if (state.scene) { triggerFit(); hasFitted = true; }
  if (initialShareError) messageEl.textContent = initialShareError;

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

  const present = setupPresentMode({
    btnPresent: document.querySelector('#btn-present')!,
    canvasPanel: document.querySelector('#canvas-panel')!,
    presentStepEl: document.querySelector('#present-step')!,
    messageEl, getState: () => state, triggerFit,
  });

  const animControls = setupAnimControls(
    {
      animStyleEl: document.querySelector('#anim-style')!,
      animSpeedEl: document.querySelector('#anim-speed')!,
      animDensityEl: document.querySelector('#anim-density')!,
      animGlowEl: document.querySelector('#anim-glow')!,
      animPauseEl: document.querySelector('#anim-pause')!,
      themeEl: document.querySelector('#theme')!,
    },
    () => state, store,
    (paused) => {
      if (paused) pausedPhase = phaseAt((performance.now() - startTime) / 1000, state.settings.anim);
    },
  );

  setupKeyboardShortcuts({
    onUndo: doUndo, onRedo: doRedo, onFit: triggerFit,
    onZoomIn: () => { state.view = zoomAt(state.view, { x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 }, 1.25); },
    onZoomOut: () => { state.view = zoomAt(state.view, { x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 }, 0.8); },
    onPresent: () => present.start(),
    onTogglePause: () => animControls.togglePause(),
    onDelete: () => dispatch({ type: 'keyDown', key: 'Delete' }),
    onRename: () => dispatch({ type: 'keyDown', key: 'Enter' }),
    onEscape: () => { if (present.isPresenting()) present.exit(); else dispatch({ type: 'keyDown', key: 'Escape' }); },
    isPresenting: present.isPresenting,
  });

  setupCanvasEvents({
    canvasEl, getState: () => state, dispatch,
    updateView: (fn) => { state.view = fn(state.view); },
    isPresenting: present.isPresenting,
  });

  const ro = new ResizeObserver(() => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvasEl.clientWidth * dpr), h = Math.round(canvasEl.clientHeight * dpr);
    if (canvasEl.width !== w || canvasEl.height !== h) { canvasEl.width = w; canvasEl.height = h; }
  });
  ro.observe(canvasEl);

  startRenderLoop({
    canvasEl, ctx, getState: () => state, measure, startTime,
    getPausedPhase: () => pausedPhase,
    getFocus: present.getCurrentFocus,
  });

  setupExportPanel({
    dialogEl: document.querySelector('#export-panel')!,
    getState: () => state,
    btnExport: document.querySelector('#btn-export')!,
  });

  setupShareHandler({
    btnShare: document.querySelector('#btn-share')!,
    shareBox: document.querySelector('#share-box')!,
    shareUrlInput: document.querySelector('#share-url')!,
    shareBoxClose: document.querySelector('#share-box-close'),
    messageEl, getState: () => state,
  });

  setupGallery({
    dialogEl: document.querySelector('#gallery')!,
    btnTemplates: document.querySelector('#btn-templates')!,
    baseUrl: import.meta.env.BASE_URL,
    commit, triggerFit, messageEl,
  });

  setupStudioApi({
    getState: () => state, sourceEl,
    applyNewText: (t: string) => commit(t, 'open'),
    dispatch, getPresentStep: present.getPresentStep,
  });

  document
    .querySelectorAll<HTMLButtonElement>(
      '#toolbar button, #canvas-controls button, #props button, dialog button',
    )
    .forEach((b) => b.classList.add(b.id === 'btn-export' ? 'btn-primary' : 'btn-secondary'));
}
