import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import { setPinInternal } from '../../mermaid/positions';
import {
  appendLine, appendLines, cleanForText, deleteEdgeGeneric, deleteNodeGeneric,
  guardOk, indentOf, lastContentLine, nextId, pinOps, rebuildLine, replaceSpan,
  upsertStyleLine,
} from '../common/edit';
import { parseRequirement } from './parse';

export const REQUIREMENT_CAPS: EditCaps = {
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

export const REQUIREMENT_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'rect', name: 'Requirement' },
  { value: 'document', name: 'Element' },
];

export const REQUIREMENT_EDGE_VARIANTS: Choice[] = [
  'contains', 'copies', 'derives', 'satisfies', 'verifies', 'refines', 'traces',
].map((v) => ({ value: v, name: v }));

export function applyRequirementOp(text: string, op: TextOp): TextOpResult {
  const doc = parseRequirement(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, REQUIREMENT_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const innerIndent = indent + '  ';

    if (op.shape === 'document') {
      const id = nextId(doc, 'el');
      const label = cleanForText(op.label, /[^A-Za-z0-9_ ]/g);
      const lines = [
        `${indent}element ${id} {`,
        `${innerIndent}type: ${label}`,
        `${indent}}`,
      ];
      let newText = appendLines(text, doc, lines);
      if (op.pin && REQUIREMENT_CAPS.move) {
        const p = setPinInternal(newText, id, op.pin.x, op.pin.y, true);
        if ('text' in p) newText = p.text;
      }
      return { text: newText, createdId: id };
    }

    const id = nextId(doc, 'req');
    const numMatch = id.match(/\d+$/);
    const num = numMatch ? numMatch[0] : '1';
    const label = cleanForText(op.label, /[^A-Za-z0-9_ ]/g);
    const lines = [
      `${indent}requirement ${id} {`,
      `${innerIndent}id: ${num}`,
      `${innerIndent}text: ${label}`,
      `${innerIndent}risk: medium`,
      `${innerIndent}verifymethod: test`,
      `${indent}}`,
    ];
    let newText = appendLines(text, doc, lines);
    if (op.pin && REQUIREMENT_CAPS.move) {
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
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const line = `${indent}${op.from} - satisfies -> ${op.to}`;
    return { text: appendLine(text, doc, line) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const newName = op.label.replace(/[^A-Za-z0-9_]/g, '_') || 'req';
    if (doc.nodes.some((n) => n.id === newName && n.id !== op.id)) {
      return { error: MESSAGES.nameTaken(newName) };
    }

    const targetLines = new Set<number>();
    targetLines.add(node.line);
    for (const edge of doc.edges) {
      if (edge.from === op.id || edge.to === op.id) {
        targetLines.add(edge.line);
      }
    }

    const escapedOld = op.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRe = new RegExp(`\\b${escapedOld}\\b`, 'g');
    const lines = text.split('\n');
    for (const lineIdx of targetLines) {
      if (lineIdx >= 0 && lineIdx < lines.length) {
        lines[lineIdx] = lines[lineIdx].replace(wordRe, newName);
      }
    }
    return { text: lines.join('\n') };
  }

  if (op.type === 'renameEdge') {
    return { error: MESSAGES.opUnsupported };
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
    const line = `${edge.to} - ${edge.variant ?? 'satisfies'} -> ${edge.from}`;
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
