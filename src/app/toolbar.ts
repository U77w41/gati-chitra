import { SHAPE_NAMES } from '../core/shapes';
import type { ShapeKind, TextOp } from '../core/types';
import { canRedo, canUndo } from '../editor/history';
import { stripFences } from '../mermaid/fences';
import { downloadText } from './download';
import { setupNodePalette } from './node-palette';
import { syncKindControls } from './kind-ui';
import type { AppState, CommitSource } from './state';

export interface ToolbarEnv {
  getState: () => AppState;
  commit: (text: string, source: CommitSource) => void;
  executeOp: (op: TextOp) => void;
  triggerFit: () => void;
  doUndo: () => void;
  doRedo: () => void;
  onAddNode: (shape: ShapeKind) => void;
  getText: () => string;
}

export function setupToolbar(env: ToolbarEnv): () => void {
  const btnNew = document.querySelector<HTMLButtonElement>('#btn-new')!;
  const btnOpen = document.querySelector<HTMLButtonElement>('#btn-open')!;
  const btnSave = document.querySelector<HTMLButtonElement>('#btn-save-mmd')!;
  const btnUndo = document.querySelector<HTMLButtonElement>('#btn-undo')!;
  const btnRedo = document.querySelector<HTMLButtonElement>('#btn-redo')!;
  const btnFit = document.querySelector<HTMLButtonElement>('#btn-fit')!;
  const btnAutolayout =
    document.querySelector<HTMLButtonElement>('#btn-autolayout')!;
  const addShapeEl = document.querySelector<HTMLSelectElement>('#add-shape')!;
  const filePicker = document.querySelector<HTMLInputElement>('#file-picker')!;

  addShapeEl.innerHTML = '';
  for (const [shape, name] of Object.entries(SHAPE_NAMES)) {
    const opt = document.createElement('option');
    opt.value = shape;
    opt.textContent = name;
    addShapeEl.appendChild(opt);
  }

  filePicker.accept = '.mmd,.txt,.md';
  btnNew.addEventListener('click', () =>
    env.commit('flowchart TD\n', 'open'),
  );
  btnOpen.addEventListener('click', () => filePicker.click());
  filePicker.addEventListener('change', () => {
    const file = filePicker.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          env.commit(stripFences(reader.result), 'open');
        }
        filePicker.value = '';
      };
      reader.readAsText(file);
    }
  });
  btnSave.addEventListener('click', () => {
    downloadText(env.getText(), 'diagram.mmd', 'text/vnd.mermaid');
  });
  btnFit.addEventListener('click', env.triggerFit);
  btnUndo.addEventListener('click', env.doUndo);
  btnRedo.addEventListener('click', env.doRedo);
  btnAutolayout.addEventListener('click', () =>
    env.executeOp({ type: 'clearPins' }),
  );

  setupNodePalette({
    palette: document.querySelector<HTMLElement>('#node-palette')!,
    hint: document.querySelector<HTMLElement>('#palette-hint'),
    select: addShapeEl,
    beforeAdd: showDiagramOnPhone,
    onAdd: () => env.onAddNode(addShapeEl.value as ShapeKind),
  });

  return function updateButtons(): void {
    const state = env.getState();
    btnUndo.disabled = !canUndo(state.history);
    btnRedo.disabled = !canRedo(state.history);
    btnAutolayout.disabled = Object.keys(state.doc.pins).length === 0;
    syncKindControls(state.doc);
  };
}

// On phones the palette sits on the Editor tab, but a new node is placed in the visible diagram and
// opens its label editor there, so switch to the Canvas tab and let it lay out first.
async function showDiagramOnPhone(): Promise<void> {
  const viewTabs = document.getElementById('view-tabs');
  if (!viewTabs || viewTabs.hidden) return;
  document.getElementById('tab-diagram')?.click();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}
