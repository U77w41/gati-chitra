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
import { setupInlineEditor } from './inline-edit';
import { setupPresentMode } from './present';
import { setupProperties } from './properties';
import { requestRedraw, startRenderLoop } from './render-loop';
import { SAMPLE_TEXT } from './sample';
import { setupKeyboardShortcuts } from './shortcuts';
import { commitText, createState, type AppState, type CommitSource } from './state';
import { loadDoc, loadSettings, safeStore, saveSettings, setupAutosave, setupDocSync } from './storage';
import { setMessageElement, showMessage } from './message';
import { setupStudioApi } from './studio';
import { setupToolbar } from './toolbar';
import { checkInitialShare, setupHashChangeListener, setupShareHandler } from './share-handler';
import { mountChrome } from './chrome';
import { describeDiagram } from './describe';
import { stripFences } from '../mermaid/fences';
import { createCodeEditor } from './code-editor';
import { setupSplitter } from './splitter';
import { setupFileLaunch } from './file-launch';
import { registerServiceWorker, setupPreloadErrorHandler } from './sw-register';

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

  const sourceParent = document.querySelector<HTMLElement>('#source')!;
  const diagnosticsEl = document.querySelector<HTMLUListElement>('#diagnostics')!;
  const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!;
  const messageEl = document.querySelector<HTMLDivElement>('#message')!;
  setMessageElement(messageEl);
  const ctx = canvasEl.getContext('2d')!;

  let hasFitted = false;
  let parseTimer: ReturnType<typeof setTimeout> | null = null;
  let pausedPhase = 0;
  const startTime = performance.now();

  function doUndo(): void { commit('', 'undo'); }
  function doRedo(): void { commit('', 'redo'); }

  const editor = createCodeEditor(sourceParent, {
    initialText: state.text,
    label: 'Mermaid text',
    onChange: (text) => {
      if (parseTimer) clearTimeout(parseTimer);
      parseTimer = setTimeout(() => {
        parseTimer = null;
        commit(text, 'typing');
      }, TIMING.parseDebounceMs);
    },
    onUndo: doUndo,
    onRedo: doRedo,
    onPaste: (text) => stripFences(text),
  });

  const updateDiagnostics = setupDiagnostics(diagnosticsEl, (line) => editor.revealLine(line));

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
    getText: () => editor.getText() || state.text,
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
    getText: () => editor.getText(),
  });

  let freshlyCreatedNodeId: string | null = null;

  function refreshDiagnostics(): void {
    updateDiagnostics(state.doc);
    editor.setDiagnostics(state.doc.diagnostics);
  }

  function updateAfterCommit(): void {
    if (state.editor.selection) {
      const { kind, id } = state.editor.selection;
      const list = kind === 'node' ? state.doc.nodes : kind === 'edge' ? state.doc.edges : state.doc.groups;
      if (!list.some((item) => item.id === id)) state.editor.selection = null;
    }
    refreshDiagnostics();
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
      if (editor.getText() !== state.text) {
        state = commitText(state, editor.getText(), 'typing', measure);
      }
    }
    state = commitText(state, text, source, measure, opts);
    if (source === 'typing' || source === 'op') dirty = true;
    if (source === 'op' || source === 'undo' || source === 'redo') {
      editor.setText(state.text, 'patch');
    } else if (source === 'open' || source === 'share' || source === 'template') {
      editor.setText(state.text, 'replace');
    }
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


  refreshDiagnostics(); updateAriaLabel(); updateButtons(); updateProps();
  if (state.scene) { triggerFit(); hasFitted = true; }

  if (sharedToLoad !== null) {
    commit(sharedToLoad, 'share'); showMessage(MESSAGES.shareOpened);
  } else if (initialShareError) {
    showMessage(initialShareError);
  }

  setupHashChangeListener(
    (shared) => { commit(shared, 'share'); showMessage(MESSAGES.shareOpened); },
    (err) => showMessage(err),
  );

  function applySync(t: string): void { commit(t, 'open'); dirty = false; }
  setupDocSync({
    store, getText: () => state.text, isDirty: () => dirty, apply: applySync,
    ask: (t) => { showMessage(MESSAGES.changedInOtherTab, { label: 'Load it', run: () => applySync(t) }); },
  });

  setupSplitter({
    handle: document.querySelector('#splitter')!, workspace: document.querySelector('#workspace')!,
    get: () => state.settings.split,
    set: (v) => { state.settings.split = v; saveSettings(store, state.settings); },
  });

  import('./narrow').then(({ setupNarrowLayout }) => setupNarrowLayout({
    tabs: document.querySelector('#view-tabs')!, textPanel: document.querySelector('#text-panel')!,
    canvasPanel: document.querySelector('#canvas-panel')!, onShowDiagram: triggerFit,
  }));

  setupFileLaunch({ open: (t) => { commit(t, 'open'); dirty = false; } });
  setupPreloadErrorHandler({ onError: (err) => showMessage(MESSAGES.videoFailed(err)) });

  registerServiceWorker({
    container: 'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
    prod: import.meta.env.PROD, enabled: !location.search.includes('e2e=1') || location.search.includes('sw=1'),
    base: import.meta.env.BASE_URL, reload: () => location.reload(),
    showUpdate: (run) => showMessage(MESSAGES.updateReady, { label: 'Reload', run }),
    showOfflineReady: () => showMessage(MESSAGES.offlineReady),
  });

  let help: { open: () => void; close: () => void; isOpen: () => boolean } | undefined;
  import('./help').then(({ setupHelpDialog }) => {
    help = setupHelpDialog({ dialogEl: document.querySelector('#help-dialog')!, btnHelp: document.querySelector('#btn-help')! });
  });

  const present = setupPresentMode({
    btnPresent: document.querySelector('#btn-present')!, canvasPanel: document.querySelector('#canvas-panel')!,
    presentStepEl: document.querySelector('#present-step')!, messageEl, getState: () => state, triggerFit,
  });

  const animControls = setupAnimControls({
    animStyleEl: document.querySelector('#anim-style')!, animSpeedEl: document.querySelector('#anim-speed')!,
    animDensityEl: document.querySelector('#anim-density')!, animGlowEl: document.querySelector('#anim-glow')!,
    animPauseEl: document.querySelector('#anim-pause')!, themeEl: document.querySelector('#theme')!,
  }, () => state, store, (paused) => {
    if (paused) pausedPhase = phaseAt((performance.now() - startTime) / 1000, state.settings.anim);
  });

  setupKeyboardShortcuts({
    onUndo: doUndo, onRedo: doRedo, onFit: triggerFit,
    onZoomIn: () => { state.view = zoomAt(state.view, { x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 }, 1.25); requestRedraw(); },
    onZoomOut: () => { state.view = zoomAt(state.view, { x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 }, 0.8); requestRedraw(); },
    onPresent: () => present.start(), onTogglePause: () => animControls.togglePause(),
    onDelete: () => dispatch({ type: 'keyDown', key: 'Delete' }),
    onRename: () => dispatch({ type: 'keyDown', key: 'Enter' }),
    onEscape: () => { if (help?.isOpen()) help.close(); else if (present.isPresenting()) present.exit(); else dispatch({ type: 'keyDown', key: 'Escape' }); },
    onHelp: () => help?.open(),
    isPresenting: present.isPresenting,
  });

  setupCanvasEvents({
    canvasEl, getState: () => state, dispatch,
    updateView: (fn) => { state.view = fn(state.view); requestRedraw(); },
    isPresenting: present.isPresenting, executeOp,
    isInlineEditing: () => state.editor.editing !== null, requestRedraw,
  });

  startRenderLoop({
    canvasEl, ctx, getState: () => state, measure, startTime,
    getPausedPhase: () => pausedPhase, getFocus: present.getCurrentFocus,
    isPresenting: present.isPresenting,
    onResize: () => { if (!hasFitted && state.scene) triggerFit(); },
  });

  import('./export-panel').then(({ setupExportPanel }) => {
    setupExportPanel({ dialogEl: document.querySelector('#export-panel')!, getState: () => state, btnExport: document.querySelector('#btn-export')! });
  });

  setupShareHandler({
    btnShare: document.querySelector('#btn-share')!, shareBox: document.querySelector('#share-box')!,
    shareUrlInput: document.querySelector('#share-url')!, shareBoxClose: document.querySelector('#share-box-close'),
    messageEl, getState: () => state,
  });

  import('./gallery').then(({ setupGallery }) => {
    setupGallery({ dialogEl: document.querySelector('#gallery')!, btnTemplates: document.querySelector('#btn-templates')!, baseUrl: import.meta.env.BASE_URL, commit, triggerFit, messageEl });
  });
  import('./install-prompt').then(({ setupInstallPrompt }) => setupInstallPrompt(document.querySelector<HTMLButtonElement>('#btn-install')));

  setupStudioApi({
    getState: () => state, editor, dispatch,
    applyNewText: (t: string) => commit(t, 'typing'),
    getPresentStep: present.getPresentStep,
  });

  document.querySelectorAll<HTMLButtonElement>(
    '#toolbar button, #canvas-controls button, #props button, dialog button',
  ).forEach((b) => b.classList.add(b.id === 'btn-export' ? 'btn-primary' : 'btn-secondary'));
}
