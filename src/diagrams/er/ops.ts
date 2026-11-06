import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import { setPinInternal } from '../../mermaid/positions';
import {
  appendLine, cleanForText, deleteEdgeGeneric, deleteNodeGeneric,
  guardOk, indentOf, insertLine, lastContentLine, mirrorOp,
  nextId, pinOps, rebuildLine, replaceSpan, upsertStyleLine,
} from '../common/edit';
import { parseEr } from './parse';

export const ER_CAPS: EditCaps = {
  add: true,
  connect: true,
  rename: true,
  delete: true,
  move: true,
  shape: false,
  style: true,
  edgeVariant: true,
  reverse: true,
};

export const ER_ADD_CHOICES: Choice<ShapeKind>[] = [{ value: 'rect', name: 'Entity' }];

export const ER_EDGE_VARIANTS: Choice[] = [
  { value: '||--||', name: 'One to one' },
  { value: '||--o{', name: 'One to zero or more' },
  { value: '||--|{', name: 'One to one or more' },
  { value: '|o--o{', name: 'Zero or one to zero or more' },
  { value: '}o--o{', name: 'Many to many' },
  { value: '||..o{', name: 'One to zero or more (non-identifying)' },
];

const FORBID = /["[\]{}]/g;

export function applyErOp(text: string, op: TextOp): TextOpResult {
  const doc = parseEr(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, ER_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const id = nextId(doc, 'E');
    const label = cleanForText(op.label, FORBID);
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const line = `${indent}${id}["${label}"]`;
    let newText = appendLine(text, doc, line);
    if (op.pin && ER_CAPS.move) {
      const p = setPinInternal(newText, id, op.pin.x, op.pin.y, true);
      if ('text' in p) newText = p.text;
    }
    return { text: newText, createdId: id };
  }

  if (op.type === 'addEdge') {
    const fromNode = doc.nodes.find((n) => n.id === op.from);
    const toNode = doc.nodes.find((n) => n.id === op.to);
    if (!fromNode) return { error: MESSAGES.unknownNode(op.from) };
    if (!toNode) return { error: MESSAGES.unknownNode(op.to) };
    const label = cleanForText(op.label || 'relates', FORBID);
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const line = `${indent}${op.from} ||--o{ ${op.to} : "${label}"`;
    return { text: appendLine(text, doc, line) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return { text: replaceSpan(text, node.labelSpan, clean) };
    }
    const headerLineIdx = doc.lines.find((l) => l.kind === 'header')?.index ?? 0;
    const indent = indentOf(rawLines[headerLineIdx + 1] ?? '') || '  ';
    const namePart = node.id.includes(' ') ? `"${node.id}"` : node.id;
    const line = `${indent}${namePart}["${clean}"]`;
    return { text: insertLine(text, headerLineIdx, line) };
  }

  if (op.type === 'renameEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    const clean = cleanForText(op.label, FORBID);
    if (edge.labelSpan) {
      const lineStr = rawLines[edge.labelSpan.line] ?? '';
      const oldSnippet = lineStr.slice(edge.labelSpan.from, edge.labelSpan.to).trim();
      const wasQuoted = oldSnippet.startsWith('"') && oldSnippet.endsWith('"');
      const needsQuotes = wasQuoted || clean.includes(' ');
      const replacement = needsQuotes ? `"${clean}"` : clean;
      return { text: replaceSpan(text, edge.labelSpan, replacement) };
    }
    const lineText = doc.lines[edge.line]?.text ?? '';
    const rebuilt = `${lineText.trimEnd()} : "${clean}"`;
    return { text: rebuildLine(text, edge.line, rebuilt.trimStart()) };
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
    const mirrored = mirrorOp(edge.variant ?? '||--o{');
    const line = `${edge.to} ${mirrored} ${edge.from} : "${edge.label}"`;
    return { text: rebuildLine(text, edge.line, line) };
  }

  if (op.type === 'deleteNode') {
    return deleteNodeGeneric(text, doc, op.id);
  }

  if (op.type === 'deleteEdge') {
    return deleteEdgeGeneric(text, doc, op.index);
  }

  if (op.type === 'setNodeStyle') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    return { text: upsertStyleLine(text, doc, op.id, op.style) };
  }

  return { error: MESSAGES.opUnsupported };
}
