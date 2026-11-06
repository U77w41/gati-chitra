import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import { SHAPE_NAMES } from '../../core/shapes';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import { shapeTokens } from '../../mermaid/format';
import {
  appendLine,
  cleanForText,
  deleteEdgeGeneric,
  deleteLines,
  guardOk,
  indentOf,
  lastContentLine,
  nextId,
  pinOps,
  renameBySpan,
  replaceSpan,
  upsertStyleLine,
} from '../common/edit';
import { parseBlock } from './parse';

export const BLOCK_CAPS: EditCaps = {
  add: true,
  connect: true,
  rename: true,
  delete: true,
  move: false,
  shape: true,
  style: true,
  edgeVariant: true,
  reverse: false,
};

const EXCLUDED_SHAPES = new Set(['smallCircle', 'filledCircle', 'framedCircle', 'forkBar', 'text']);

export const BLOCK_ADD_CHOICES: Choice<ShapeKind>[] = (
  Object.entries(SHAPE_NAMES) as [ShapeKind, string][]
)
  .filter(([shape]) => !EXCLUDED_SHAPES.has(shape))
  .map(([value, name]) => ({ value, name }));

export const BLOCK_SHAPE_CHOICES: Choice<ShapeKind>[] = BLOCK_ADD_CHOICES;

export const BLOCK_EDGE_VARIANTS: Choice[] = [
  { value: '-->', name: 'Arrow' },
  { value: '---', name: 'Line' },
];

const FORBID = /["[\](){}<>]/g;

export function applyBlockOp(text: string, op: TextOp): TextOpResult {
  const doc = parseBlock(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, BLOCK_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const label = cleanForText(op.label, FORBID);
    const id = nextId(doc, 'b');
    const shape = op.shape && BLOCK_ADD_CHOICES.some((c) => c.value === op.shape)
      ? op.shape
      : BLOCK_ADD_CHOICES[0].value;
    const tokens = shapeTokens(shape) ?? { open: '[', close: ']' };
    const line = `${indent}${id}${tokens.open}"${label}"${tokens.close}`;
    return { text: appendLine(text, doc, line), createdId: id };
  }

  if (op.type === 'addEdge') {
    const fromExists = doc.nodes.some((n) => n.id === op.from) || doc.groups.some((g) => g.id === op.from);
    if (!fromExists) return { error: MESSAGES.unknownNode(op.from) };
    const toExists = doc.nodes.some((n) => n.id === op.to) || doc.groups.some((g) => g.id === op.to);
    if (!toExists) return { error: MESSAGES.unknownNode(op.to) };
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const line = `${indent}${op.from} --> ${op.to}`;
    return { text: appendLine(text, doc, line) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return renameBySpan(text, node.labelSpan, clean, FORBID) ?? { error: MESSAGES.opUnsupported };
    }
    if (node.defSpan) {
      const rawLine = rawLines[node.defSpan.line] ?? '';
      const defText = rawLine.slice(node.defSpan.from, node.defSpan.to);
      const suffixMatch = /:(\d+)$/.exec(defText);
      const suffix = suffixMatch ? suffixMatch[0] : '';
      return { text: replaceSpan(text, node.defSpan, `${node.id}["${clean}"]${suffix}`) };
    }
    return { error: MESSAGES.opUnsupported };
  }

  if (op.type === 'setShape') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    if (!node.defSpan) return { error: MESSAGES.opUnsupported };
    const tokens = shapeTokens(op.shape);
    if (!tokens) return { error: MESSAGES.opUnsupported };
    const rawLine = rawLines[node.defSpan.line] ?? '';
    const defText = rawLine.slice(node.defSpan.from, node.defSpan.to);
    const suffixMatch = /:(\d+)$/.exec(defText);
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const clean = cleanForText(node.label, FORBID);
    return {
      text: replaceSpan(text, node.defSpan, `${node.id}${tokens.open}"${clean}"${tokens.close}${suffix}`),
    };
  }

  if (op.type === 'deleteNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    if (!node.defSpan) return { error: MESSAGES.opUnsupported };
    const rawLine = rawLines[node.defSpan.line] ?? '';
    let from = node.defSpan.from;
    let to = node.defSpan.to;
    if (to < rawLine.length && rawLine[to] === ' ') {
      to++;
    } else if (from > 0 && rawLine[from - 1] === ' ') {
      from--;
    }
    const updatedLine = rawLine.slice(0, from) + rawLine.slice(to);
    const edgeLines = doc.edges.filter((e) => e.from === op.id || e.to === op.id).map((e) => e.line);
    if (updatedLine.trim().length === 0) {
      return { text: deleteLines(text, [node.defSpan.line, ...edgeLines]) };
    }
    const intermediateText = replaceSpan(text, { line: node.defSpan.line, from, to }, '');
    return { text: edgeLines.length > 0 ? deleteLines(intermediateText, edgeLines) : intermediateText };
  }

  if (op.type === 'deleteEdge') {
    return deleteEdgeGeneric(text, doc, op.index);
  }

  if (op.type === 'setEdgeVariant') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    if (!edge.opSpan) return { error: MESSAGES.opUnsupported };
    return { text: replaceSpan(text, edge.opSpan, op.variant) };
  }

  if (op.type === 'setNodeStyle') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    return { text: upsertStyleLine(text, doc, op.id, op.style) };
  }

  if (op.type === 'reverseEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    return { error: MESSAGES.opUnsupported };
  }

  if ('id' in op) {
    const targetId = (op as { id: string }).id;
    const exists = doc.nodes.some((n) => n.id === targetId) || doc.groups.some((g) => g.id === targetId);
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
