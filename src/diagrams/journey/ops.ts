import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import {
  appendLine,
  cleanForText,
  deleteLines,
  guardOk,
  indentOf,
  nextId,
  pinOps,
  renameBySpan,
} from '../common/edit';
import { parseJourney } from './parse';

export const JOURNEY_CAPS: EditCaps = {
  add: true,
  connect: false,
  rename: true,
  delete: true,
  move: false,
  shape: false,
  style: false,
  edgeVariant: false,
  reverse: false,
};

export const JOURNEY_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'round', name: 'Task' },
];

export const JOURNEY_SHAPE_CHOICES: Choice<ShapeKind>[] = [];
export const JOURNEY_EDGE_VARIANTS: Choice[] = [];

const FORBID = /[:"]/g;

export function applyJourneyOp(text: string, op: TextOp): TextOpResult {
  const doc = parseJourney(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, JOURNEY_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const cardNodes = doc.nodes.filter((n) => n.id.startsWith('t'));
    const lastCard = cardNodes[cardNodes.length - 1];
    const indent = lastCard ? indentOf(rawLines[lastCard.line]) || '    ' : '    ';
    const label = cleanForText(op.label, FORBID);
    const id = nextId(doc, 't');
    const line = `${indent}${label}: 3: Me`;
    return { text: appendLine(text, doc, line), createdId: id };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    if (node.id.startsWith('f')) {
      return { error: MESSAGES.opUnsupported };
    }
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return renameBySpan(text, node.labelSpan, clean, FORBID) ?? { error: MESSAGES.opUnsupported };
    }
    return { error: MESSAGES.opUnsupported };
  }

  if (op.type === 'deleteNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    if (node.refLines && node.refLines.length > 0) {
      return { text: deleteLines(text, node.refLines) };
    }
    return { error: MESSAGES.opUnsupported };
  }

  if ('id' in op) {
    const targetId = (op as { id: string }).id;
    const exists = doc.nodes.some((n) => n.id === targetId);
    if (!exists) return { error: MESSAGES.unknownNode(targetId) };
  }
  if ('index' in op) {
    const targetIdx = (op as { index: number }).index;
    if (targetIdx < 0 || targetIdx >= doc.edges.length) {
      return { error: MESSAGES.unknownEdge(targetIdx) };
    }
  }

  return { error: MESSAGES.opUnsupported };
}
