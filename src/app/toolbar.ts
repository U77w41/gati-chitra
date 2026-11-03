import type { ShapeKind, TextOp } from '../core/types';
import { canRedo, canUndo } from '../editor/history';
import { downloadBlob } from './download';
import type { AppState, CommitSource } from './state';

export interface ToolbarEnv {
  getState: () => AppState;
  commit: (text: string, source: CommitSource) => void;
  executeOp: (op: TextOp) => void;
  triggerFit: () => void;
  doUndo: () => void;
  doRedo: () => void;
  onAddNode: (shape: ShapeKind) => void;
  sourceEl: HTMLTextAreaElement;
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
  const btnAddNode =
    document.querySelector<HTMLButtonElement>('#btn-add-node')!;
  const addShapeEl = document.querySelector<HTMLSelectElement>('#add-shape')!;
  const filePicker = document.querySelector<HTMLInputElement>('#file-picker')!;

  btnNew.addEventListener('click', () =>
    env.commit('flowchart TD\n', 'typing'),
  );
  btnOpen.addEventListener('click', () => filePicker.click());
  filePicker.addEventListener('change', () => {
    const file = filePicker.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string')
          env.commit(reader.result, 'open');
      };
      reader.readAsText(file);
    }
  });
  btnSave.addEventListener('click', () => {
    downloadBlob(env.sourceEl.value, 'diagram.mmd', 'text/vnd.mermaid');
  });
  btnFit.addEventListener('click', env.triggerFit);
  btnUndo.addEventListener('click', env.doUndo);
  btnRedo.addEventListener('click', env.doRedo);
  btnAutolayout.addEventListener('click', () =>
    env.executeOp({ type: 'clearPins' }),
  );

  btnAddNode.addEventListener('click', () => {
    env.onAddNode(addShapeEl.value as ShapeKind);
  });

  return function updateButtons(): void {
    const state = env.getState();
    btnUndo.disabled = !canUndo(state.history);
    btnRedo.disabled = !canRedo(state.history);
    btnAutolayout.disabled = Object.keys(state.doc.pins).length === 0;
  };
}
