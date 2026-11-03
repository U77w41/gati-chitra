import { MESSAGES } from '../core/constants';
import type { Point, Scene, Selection, TextOp } from '../core/types';
import { hitTest } from '../layout/geometry';
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
  | { type: 'textChanged' };

export type EditorEffect =
  | { type: 'applyOp'; op: TextOp }
  | { type: 'panBy'; dx: number; dy: number }
  | { type: 'message'; text: string };

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

export function reduce(
  state: EditorState,
  event: EditorEvent,
  env: EditorEnv,
): { state: EditorState; effects: EditorEffect[] } {
  switch (event.type) {
    case 'pointerDown': {
      if (event.button === 1 || event.space) {
        return {
          state: { ...state, pan: { last: event.screen } },
          effects: [],
        };
      }
      if (event.button === 0) {
        const selectedNodeId =
          state.selection?.kind === 'node' ? state.selection.id : null;
        const hit = hitTest(env.scene, event.world, selectedNodeId);

        if (hit?.kind === 'node') {
          const selection: Selection = { kind: 'node', id: hit.id };
          if (!env.ok) {
            return {
              state: { ...state, selection, drag: null },
              effects: [{ type: 'message', text: MESSAGES.fixTextFirst }],
            };
          }
          const nodeBox = env.scene.layout.nodes[hit.id];
          const nodeCenter = nodeBox ? nodeBox.center : event.world;
          const grab = {
            x: event.world.x - nodeCenter.x,
            y: event.world.y - nodeCenter.y,
          };
          const drag = {
            nodeId: hit.id,
            grab,
            start: event.world,
            current: event.world,
            moved: false,
          };
          return {
            state: { ...state, selection, drag, pan: null },
            effects: [],
          };
        }
        if (hit?.kind === 'edge' || hit?.kind === 'group') {
          return {
            state: {
              ...state,
              selection: { kind: hit.kind, id: hit.id },
              drag: null,
              pan: null,
            },
            effects: [],
          };
        }
        return {
          state: {
            ...state,
            selection: null,
            drag: null,
            pan: { last: event.screen },
          },
          effects: [],
        };
      }
      return { state, effects: [] };
    }

    case 'pointerMove': {
      if (state.drag) {
        const dist = Math.hypot(
          event.world.x - state.drag.start.x,
          event.world.y - state.drag.start.y,
        );
        const moved = state.drag.moved || dist > 3;
        const drag = { ...state.drag, current: event.world, moved };
        return { state: { ...state, drag }, effects: [] };
      }
      if (state.pan) {
        const dx = event.screen.x - state.pan.last.x;
        const dy = event.screen.y - state.pan.last.y;
        return {
          state: { ...state, pan: { last: event.screen } },
          effects: [{ type: 'panBy', dx, dy }],
        };
      }
      return { state, effects: [] };
    }

    case 'pointerUp': {
      const effects: EditorEffect[] = [];
      if (state.drag?.moved) {
        const x = Math.round(state.drag.current.x - state.drag.grab.x);
        const y = Math.round(state.drag.current.y - state.drag.grab.y);
        effects.push({
          type: 'applyOp',
          op: { type: 'setPin', id: state.drag.nodeId, x, y },
        });
      }
      return {
        state: { ...state, drag: null, pan: null },
        effects,
      };
    }

    case 'keyDown': {
      if (event.key === 'Escape') {
        return {
          state: { ...state, selection: null, drag: null, pan: null },
          effects: [],
        };
      }
      return { state, effects: [] };
    }

    case 'textChanged': {
      return {
        state: {
          ...state,
          drag: null,
          pan: null,
          connect: null,
          editing: null,
        },
        effects: [],
      };
    }
  }
}
