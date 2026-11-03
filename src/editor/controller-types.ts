import type { Point, Scene, Selection, ShapeKind, TextOp } from '../core/types';
import type { MeasureText } from '../layout/measure';

export interface EditorState {
  selection: Selection | null;
  drag: {
    nodeId: string;
    grab: Point;
    start: Point;
    current: Point;
    moved: boolean;
  } | null;
  pan: { last: Point } | null;
  connect: { fromId: string; to: Point } | null;
  editing: { kind: 'node' | 'edge' | 'group'; id: string; initial: string } | null;
}

export type EditorEvent =
  | { type: 'pointerDown'; world: Point; screen: Point; button: number; space: boolean }
  | { type: 'pointerMove'; world: Point; screen: Point }
  | { type: 'pointerUp'; world: Point; screen: Point }
  | { type: 'keyDown'; key: string }
  | { type: 'textChanged' }
  | { type: 'dblClick'; world: Point }
  | { type: 'commitEdit'; text: string }
  | { type: 'cancelEdit' };

export type EditorEffect =
  | { type: 'applyOp'; op: TextOp }
  | { type: 'panBy'; dx: number; dy: number }
  | { type: 'message'; text: string }
  | { type: 'addNodeAt'; at: Point; shape: ShapeKind }
  | { type: 'addConnectedNode'; fromId: string; at: Point }
  | { type: 'startEdit'; kind: 'node' | 'edge' | 'group'; id: string; initial: string };

export interface EditorEnv {
  scene: Scene;
  ok: boolean;
  measure: MeasureText;
}

export function createEditorState(): EditorState {
  return {
    selection: null,
    drag: null,
    pan: null,
    connect: null,
    editing: null,
  };
}
