import { MESSAGES } from '../core/constants';
import type { Selection, TextOp } from '../core/types';
import { hitTest } from '../layout/geometry';
import type {
  EditorEffect,
  EditorEnv,
  EditorEvent,
  EditorState,
} from './controller-types';

export * from './controller-types';

function getItemLabel(env: EditorEnv, kind: 'node' | 'edge' | 'group', id: string): string {
  if (kind === 'node') return env.scene.doc.nodes.find((n) => n.id === id)?.label ?? id;
  if (kind === 'edge') return env.scene.doc.edges.find((e) => e.id === id)?.label ?? '';
  return env.scene.doc.groups.find((g) => g.id === id)?.title ?? id;
}

export function reduce(
  state: EditorState,
  event: EditorEvent,
  env: EditorEnv,
): { state: EditorState; effects: EditorEffect[] } {
  switch (event.type) {
    case 'pointerDown': {
      if (event.button === 1 || event.space) {
        return { state: { ...state, pan: { last: event.screen } }, effects: [] };
      }
      if (event.button === 0) {
        const canConnect = env.caps ? env.caps.connect : true;
        const selectedNodeId =
          canConnect && state.selection?.kind === 'node' ? state.selection.id : null;
        const hit = hitTest(env.scene, event.world, selectedNodeId);

        if (hit?.kind === 'handle') {
          if (!env.ok) return { state, effects: [{ type: 'message', text: MESSAGES.fixTextFirst }] };
          return { state: { ...state, connect: { fromId: hit.id, to: event.world } }, effects: [] };
        }
        if (hit?.kind === 'node') {
          const selection: Selection = { kind: 'node', id: hit.id };
          if (!env.ok) {
            return { state: { ...state, selection, drag: null }, effects: [{ type: 'message', text: MESSAGES.fixTextFirst }] };
          }
          const canMove = env.caps ? env.caps.move : true;
          let drag = null;
          if (canMove) {
            const nodeBox = env.scene.layout.nodes[hit.id];
            const nodeCenter = nodeBox ? nodeBox.center : event.world;
            const grab = { x: event.world.x - nodeCenter.x, y: event.world.y - nodeCenter.y };
            drag = { nodeId: hit.id, grab, start: event.world, current: event.world, moved: false };
          }
          return { state: { ...state, selection, drag, pan: null }, effects: [] };
        }
        if (hit?.kind === 'edge' || hit?.kind === 'group') {
          return { state: { ...state, selection: { kind: hit.kind, id: hit.id }, drag: null, pan: null }, effects: [] };
        }
        return { state: { ...state, selection: null, drag: null, pan: { last: event.screen } }, effects: [] };
      }
      return { state, effects: [] };
    }

    case 'pointerMove': {
      if (state.connect) {
        return { state: { ...state, connect: { ...state.connect, to: event.world } }, effects: [] };
      }
      if (state.drag) {
        const dist = Math.hypot(event.world.x - state.drag.start.x, event.world.y - state.drag.start.y);
        const drag = { ...state.drag, current: event.world, moved: state.drag.moved || dist > 3 };
        return { state: { ...state, drag }, effects: [] };
      }
      if (state.pan) {
        const dx = event.screen.x - state.pan.last.x;
        const dy = event.screen.y - state.pan.last.y;
        return { state: { ...state, pan: { last: event.screen } }, effects: [{ type: 'panBy', dx, dy }] };
      }
      return { state, effects: [] };
    }

    case 'pointerUp': {
      if (state.connect) {
        const fromId = state.connect.fromId;
        const hit = hitTest(env.scene, event.world, null);
        let targetId = hit?.kind === 'node' ? hit.id : null;
        if (!targetId) {
          let minDist = Infinity;
          for (const node of env.scene.doc.nodes) {
            const box = env.scene.layout.nodes[node.id];
            if (!box) continue;
            const left = box.center.x - box.width / 2;
            const right = box.center.x + box.width / 2;
            const top = box.center.y - box.height / 2;
            const bottom = box.center.y + box.height / 2;
            const dx = Math.max(left - event.world.x, 0, event.world.x - right);
            const dy = Math.max(top - event.world.y, 0, event.world.y - bottom);
            const dist = Math.hypot(dx, dy);
            if (dist <= 24 && dist < minDist) {
              minDist = dist;
              targetId = node.id;
            }
          }
        }
        const effects: EditorEffect[] = [];
        if (targetId) {
          effects.push({ type: 'applyOp', op: { type: 'addEdge', from: fromId, to: targetId } });
        } else if (hit === null) {
          effects.push({ type: 'addConnectedNode', fromId, at: event.world });
        }
        return { state: { ...state, connect: null }, effects };
      }
      const effects: EditorEffect[] = [];
      if (state.drag?.moved) {
        const x = Math.round(state.drag.current.x - state.drag.grab.x);
        const y = Math.round(state.drag.current.y - state.drag.grab.y);
        effects.push({ type: 'applyOp', op: { type: 'setPin', id: state.drag.nodeId, x, y } });
      }
      return { state: { ...state, drag: null, pan: null }, effects };
    }

    case 'dblClick': {
      if (!env.ok) return { state, effects: [{ type: 'message', text: MESSAGES.fixTextFirst }] };
      const hit = hitTest(env.scene, event.world, null);
      if (hit?.kind === 'node' || hit?.kind === 'edge' || hit?.kind === 'group') {
        const canRename = env.caps ? env.caps.rename : true;
        if (!canRename) return { state, effects: [] };
        const initial = getItemLabel(env, hit.kind, hit.id);
        const editing = { kind: hit.kind, id: hit.id, initial };
        return {
          state: { ...state, editing, selection: { kind: hit.kind, id: hit.id } },
          effects: [{ type: 'startEdit', kind: hit.kind, id: hit.id, initial }],
        };
      }
      const canAdd = env.caps ? env.caps.add : true;
      if (!canAdd) return { state, effects: [] };
      const shape = env.defaultShape ?? 'rect';
      return { state, effects: [{ type: 'addNodeAt', at: event.world, shape }] };
    }

    case 'keyDown': {
      if (state.editing) return { state, effects: [] };
      if (event.key === 'Escape') return { state: { ...state, selection: null, drag: null, pan: null }, effects: [] };
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!state.selection) return { state, effects: [] };
        const canDelete = env.caps ? env.caps.delete : true;
        if (!canDelete) return { state, effects: [] };
        if (!env.ok) return { state, effects: [{ type: 'message', text: MESSAGES.fixTextFirst }] };
        if (state.selection.kind === 'node') {
          return { state: { ...state, selection: null }, effects: [{ type: 'applyOp', op: { type: 'deleteNode', id: state.selection.id } }] };
        }
        if (state.selection.kind === 'edge') {
          const index = Number(state.selection.id.slice(1));
          return { state: { ...state, selection: null }, effects: [{ type: 'applyOp', op: { type: 'deleteEdge', index } }] };
        }
        if (state.selection.kind === 'group') {
          return { state, effects: [{ type: 'message', text: MESSAGES.groupsInText }] };
        }
      }
      if (event.key === 'Enter') {
        if (!state.selection) return { state, effects: [] };
        const canRename = env.caps ? env.caps.rename : true;
        if (!canRename) return { state, effects: [] };
        if (!env.ok) return { state, effects: [{ type: 'message', text: MESSAGES.fixTextFirst }] };
        const { kind, id } = state.selection;
        const initial = getItemLabel(env, kind, id);
        return { state: { ...state, editing: { kind, id, initial } }, effects: [{ type: 'startEdit', kind, id, initial }] };
      }
      return { state, effects: [] };
    }

    case 'commitEdit': {
      if (!state.editing) return { state, effects: [] };
      const { kind, id, initial } = state.editing;
      const nextState = { ...state, editing: null };
      if (event.text === initial) return { state: nextState, effects: [] };
      let op: TextOp;
      if (kind === 'node') op = { type: 'renameNode', id, label: event.text };
      else if (kind === 'edge') op = { type: 'renameEdge', index: Number(id.slice(1)), label: event.text };
      else op = { type: 'renameGroup', id, title: event.text };
      return { state: nextState, effects: [{ type: 'applyOp', op }] };
    }

    case 'cancelEdit': {
      return { state: { ...state, editing: null }, effects: [] };
    }

    case 'select': {
      return { state: { ...state, selection: event.selection }, effects: [] };
    }

    case 'textChanged': {
      return { state: { ...state, drag: null, pan: null, connect: null, editing: null }, effects: [] };
    }
  }
}
