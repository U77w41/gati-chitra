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
  replaceSpan,
} from '../common/edit';
import { parseTimeline } from './parse';

export const TIMELINE_CAPS: EditCaps = {
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

export const TIMELINE_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'round', name: 'Period' },
];

export const TIMELINE_SHAPE_CHOICES: Choice<ShapeKind>[] = [];
export const TIMELINE_EDGE_VARIANTS: Choice[] = [];

const FORBID = /[:"]/g;

export function applyTimelineOp(text: string, op: TextOp): TextOpResult {
  const doc = parseTimeline(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, TIMELINE_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const periods = doc.nodes.filter((n) => n.shape === 'round');
    const lastPeriod = periods[periods.length - 1];
    const indent = lastPeriod ? indentOf(rawLines[lastPeriod.line]) || '  ' : '  ';
    const label = cleanForText(op.label, FORBID);
    const id = nextId(doc, 'p');
    const line = `${indent}${label}`;
    return { text: appendLine(text, doc, line), createdId: id };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return renameBySpan(text, node.labelSpan, clean, FORBID) ?? { error: MESSAGES.opUnsupported };
    }
    return { error: MESSAGES.opUnsupported };
  }

  if (op.type === 'deleteNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };

    if (node.shape === 'round') {
      if (node.refLines && node.refLines.length > 0) {
        return { text: deleteLines(text, node.refLines) };
      }
      return { error: MESSAGES.opUnsupported };
    }

    const lineIdx = node.labelSpan ? node.labelSpan.line : (node.refLines?.[0] ?? -1);
    if (lineIdx < 0 || lineIdx >= rawLines.length) return { error: MESSAGES.opUnsupported };
    const rawLine = rawLines[lineIdx];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith(':')) {
      const eventsOnLine = trimmed.slice(1).split(/\s*:\s*/).filter(Boolean);
      if (eventsOnLine.length === 1) {
        return { text: deleteLines(text, [lineIdx]) };
      }
    }

    if (node.labelSpan) {
      const linePrefix = rawLine.slice(0, node.labelSpan.from);
      const lastColonIdx = linePrefix.lastIndexOf(':');
      if (lastColonIdx >= 0) {
        let fromIdx = lastColonIdx;
        if (fromIdx > 0 && rawLine[fromIdx - 1] === ' ') {
          fromIdx--;
        }
        const toIdx = node.labelSpan.to;
        return { text: replaceSpan(text, { line: lineIdx, from: fromIdx, to: toIdx }, '') };
      }
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
