import type { Point, ShapeKind, TextOp } from '../core/types';
import { panBy } from '../editor/view';
import {
  reduce,
  type EditorEffect,
  type EditorEnv,
  type EditorEvent,
} from '../editor/controller';
import type { MeasureText } from '../layout/measure';
import type { AppState, CommitSource } from './state';
import { showMessage } from './message';
import { createConnectedNode, createNodeAt } from './node-creator';
import type { InlineEditManager } from './inline-edit';

export interface DispatcherEnv {
  getState: () => AppState;
  measure: MeasureText;
  commit: (text: string, source: CommitSource, opts?: { coalesce?: boolean }) => void;
  executeOp: (op: TextOp) => void;
  messageEl: HTMLElement;
  inlineEditor: InlineEditManager;
  updateProps: () => void;
  setFreshlyCreatedNodeId: (id: string | null) => void;
}

export function createDispatcher(env: DispatcherEnv): {
  dispatch: (event: EditorEvent) => void;
  handleAddNodeAt: (at: Point, shape: ShapeKind) => void;
} {
  const {
    getState,
    measure,
    commit,
    executeOp,
    messageEl: _messageEl,
    inlineEditor,
    updateProps,
    setFreshlyCreatedNodeId,
  } = env;

  function handleAddNodeAt(at: Point, shape: ShapeKind): void {
    const state = getState();
    const { newId, error } = createNodeAt(state, at, shape, commit);
    if (error) {
      showMessage(error);
      return;
    }
    if (newId) {
      setFreshlyCreatedNodeId(newId);
      state.editor.selection = { kind: 'node', id: newId };
      state.editor.editing = { kind: 'node', id: newId, initial: 'New' };
      updateProps();
      inlineEditor.start(
        'node',
        newId,
        'New',
        (t: string) => dispatch({ type: 'commitEdit', text: t }),
        () => {
          setFreshlyCreatedNodeId(null);
          dispatch({ type: 'cancelEdit' });
        },
      );
    }
  }

  function handleAddConnectedNode(fromId: string, at: Point): void {
    const state = getState();
    const { newId, error } = createConnectedNode(state, fromId, at, commit);
    if (error) {
      showMessage(error);
      return;
    }
    if (newId) {
      setFreshlyCreatedNodeId(newId);
      state.editor.selection = { kind: 'node', id: newId };
      state.editor.editing = { kind: 'node', id: newId, initial: 'New' };
      updateProps();
      inlineEditor.start(
        'node',
        newId,
        'New',
        (t: string) => dispatch({ type: 'commitEdit', text: t }),
        () => {
          setFreshlyCreatedNodeId(null);
          dispatch({ type: 'cancelEdit' });
        },
      );
    }
  }

  function handleEffects(effects: EditorEffect[]): void {
    const state = getState();
    for (const eff of effects) {
      if (eff.type === 'applyOp') executeOp(eff.op);
      else if (eff.type === 'panBy') state.view = panBy(state.view, eff.dx, eff.dy);
      else if (eff.type === 'message') showMessage(eff.text);
      else if (eff.type === 'addNodeAt') handleAddNodeAt(eff.at, eff.shape);
      else if (eff.type === 'addConnectedNode') handleAddConnectedNode(eff.fromId, eff.at);
      else if (eff.type === 'startEdit') {
        inlineEditor.start(
          eff.kind,
          eff.id,
          eff.initial,
          (t: string) => dispatch({ type: 'commitEdit', text: t }),
          () => dispatch({ type: 'cancelEdit' }),
        );
      }
    }
  }

  function dispatch(event: EditorEvent): void {
    const state = getState();
    const editorEnv: EditorEnv = {
      scene: state.scene ?? {
        doc: state.doc,
        layout: { nodes: {}, groups: {}, edges: {}, bounds: { x: 0, y: 0, width: 0, height: 0 } },
      },
      ok: state.doc.ok,
      measure,
    };
    const { state: nextEditor, effects } = reduce(state.editor, event, editorEnv);
    state.editor = nextEditor;
    updateProps();
    handleEffects(effects);
  }

  return { dispatch, handleAddNodeAt };
}
