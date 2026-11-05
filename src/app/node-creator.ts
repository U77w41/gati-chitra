import { MESSAGES } from '../core/constants';
import type { Point, ShapeKind } from '../core/types';
import { parseDocument } from '../diagrams/parse-any';
import { applyAnyOp } from '../diagrams/apply-op';
import type { AppState, CommitSource } from './state';

export function createNodeAt(
  state: AppState,
  at: Point,
  shape: ShapeKind,
  commit: (text: string, source: CommitSource) => void,
): { newId?: string; error?: string } {
  if (!state.doc.ok) return { error: MESSAGES.fixTextFirst };
  const res = applyAnyOp(state.text, {
    type: 'addNode',
    label: 'New',
    shape,
    pin: { x: Math.round(at.x), y: Math.round(at.y) },
  });
  if ('error' in res) return { error: res.error };
  const prevIds = new Set(state.doc.nodes.map((n) => n.id));
  const newDoc = parseDocument(res.text);
  const newId = newDoc.nodes.find((n) => !prevIds.has(n.id))?.id;
  commit(res.text, 'op');
  return { newId };
}

export function createConnectedNode(
  state: AppState,
  fromId: string,
  at: Point,
  commit: (text: string, source: CommitSource) => void,
): { newId?: string; error?: string } {
  if (!state.doc.ok) return { error: MESSAGES.fixTextFirst };
  const addNodeRes = applyAnyOp(state.text, {
    type: 'addNode',
    label: 'New',
    shape: 'rect',
    pin: { x: Math.round(at.x), y: Math.round(at.y) },
  });
  if ('error' in addNodeRes) return { error: addNodeRes.error };

  const tempDoc = parseDocument(addNodeRes.text);
  const prevIds = new Set(state.doc.nodes.map((n) => n.id));
  const newId = tempDoc.nodes.find((n) => !prevIds.has(n.id))?.id;
  if (!newId) return { error: 'Failed to create node' };

  const addEdgeRes = applyAnyOp(addNodeRes.text, {
    type: 'addEdge',
    from: fromId,
    to: newId,
  });
  if ('error' in addEdgeRes) return { error: addEdgeRes.error };

  commit(addEdgeRes.text, 'op');
  return { newId };
}
