import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import {
  appendLine, cleanForText, deleteEdgeGeneric, deleteNodeGeneric,
  guardOk, indentOf, insertLine, lastContentLine, nextId, pinOps,
  rebuildLine, renameBySpan, replaceSpan, textLines,
} from '../common/edit';
import { parseSequence } from './parse';

export const SEQUENCE_CAPS: EditCaps = {
  add: true,
  connect: true,
  rename: true,
  delete: true,
  move: false,
  shape: true,
  style: false,
  edgeVariant: true,
  reverse: true,
};

export const SEQUENCE_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'rect', name: 'Participant' },
  { value: 'actor', name: 'Actor' },
];

export const SEQUENCE_SHAPE_CHOICES: Choice<ShapeKind>[] = [
  { value: 'rect', name: 'Participant' },
  { value: 'actor', name: 'Actor' },
];

export const SEQUENCE_EDGE_VARIANTS = [
  { value: '->>', name: 'Arrow' },
  { value: '-->>', name: 'Dotted arrow' },
  { value: '->', name: 'Line' },
  { value: '-->', name: 'Dotted line' },
  { value: '-x', name: 'Cross' },
  { value: '--x', name: 'Dotted cross' },
  { value: '-)', name: 'Async' },
  { value: '--)', name: 'Dotted async' },
  { value: '<<->>', name: 'Both ways' },
  { value: '<<-->>', name: 'Dotted, both ways' },
];

const FORBID = /[";#]/g;

export function applySequenceOp(text: string, op: TextOp): TextOpResult {
  const doc = parseSequence(text);
  const guard = guardOk(doc);
  if (guard) return guard;

  const pinRes = pinOps(text, doc, op, SEQUENCE_CAPS);
  if (pinRes) return pinRes;

  const lines = textLines(text);

  if (op.type === 'addNode') {
    const id = nextId(doc, 'P');
    const kw = op.shape === 'actor' ? 'actor' : 'participant';
    const label = cleanForText(op.label, FORBID);
    let lastPartIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(?:participant|actor)\b/.test(lines[i])) {
        lastPartIdx = i;
      }
    }
    const indent = lastPartIdx >= 0 ? indentOf(lines[lastPartIdx]) : '  ';
    const newLine = `${indent}${kw} ${id} as ${label}`;
    const insertAfter = lastPartIdx >= 0
      ? lastPartIdx
      : doc.lines.findIndex((l) => l.kind === 'header');
    return {
      text: insertLine(text, insertAfter, newLine),
      createdId: id,
    };
  }

  if (op.type === 'addEdge') {
    const clean = cleanForText(op.label ?? 'message', FORBID) || 'message';
    const lastIdx = lastContentLine(doc);
    const indent = lastIdx >= 0 ? indentOf(lines[lastIdx]) : '  ';
    const newLine = `${indent}${op.from}->>${op.to}: ${clean}`;
    return { text: appendLine(text, doc, newLine) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const label = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return renameBySpan(text, node.labelSpan, label, FORBID) ?? { error: MESSAGES.opUnsupported };
    }
    const raw = node.line >= 0 && node.line < lines.length ? lines[node.line] : '';
    if (/^\s*(?:participant|actor)\b/.test(raw)) {
      const newContent = raw.trimEnd() + ` as ${label}`;
      return { text: rebuildLine(text, node.line, newContent.trimStart()) };
    }
    const indent = indentOf(raw) || '  ';
    const newDecl = `${indent}participant ${node.id} as ${label}`;
    return { text: insertLine(text, node.line - 1, newDecl) };
  }

  if (op.type === 'renameEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    const label = cleanForText(op.label, FORBID);
    if (edge.labelSpan) {
      return renameBySpan(text, edge.labelSpan, label, FORBID) ?? { error: MESSAGES.opUnsupported };
    }
    const raw = lines[edge.line].trimEnd();
    return { text: rebuildLine(text, edge.line, (raw + `: ${label}`).trimStart()) };
  }

  if (op.type === 'deleteNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    return deleteNodeGeneric(text, doc, op.id);
  }

  if (op.type === 'deleteEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    return deleteEdgeGeneric(text, doc, op.index);
  }

  if (op.type === 'setEdgeVariant') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    if (!edge.opSpan) return { error: MESSAGES.opUnsupported };
    return { text: replaceSpan(text, edge.opSpan, op.variant) };
  }

  if (op.type === 'reverseEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    const labelPart = edge.label ? `: ${edge.label}` : '';
    const newContent = `${edge.to}${edge.variant ?? '->>'}${edge.from}${labelPart}`;
    return { text: rebuildLine(text, edge.line, newContent) };
  }

  if (op.type === 'setShape') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    if (op.shape !== 'rect' && op.shape !== 'actor') return { error: MESSAGES.opUnsupported };
    const raw = node.line >= 0 && node.line < lines.length ? lines[node.line] : '';
    if (/^\s*(?:participant|actor)\b/.test(raw)) {
      const newContent = raw.trimStart().replace(/^(participant|actor)\b/, op.shape === 'actor' ? 'actor' : 'participant');
      return { text: rebuildLine(text, node.line, newContent) };
    }
    const indent = indentOf(raw) || '  ';
    const kw = op.shape === 'actor' ? 'actor' : 'participant';
    return { text: insertLine(text, node.line - 1, `${indent}${kw} ${node.id}`) };
  }

  return { error: MESSAGES.opUnsupported };
}
