import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import { setPinInternal } from '../../mermaid/positions';
import {
  appendLine, cleanForText, deleteEdgeGeneric, deleteNodeGeneric,
  guardOk, indentOf, lastContentLine, mirrorOp,
  nextId, pinOps, rebuildLine, replaceSpan,
} from '../common/edit';
import { parseArchitecture } from './parse';
import { EDGE_RE } from './patterns';

export const ARCHITECTURE_CAPS: EditCaps = {
  add: true,
  connect: true,
  rename: true,
  delete: true,
  move: true,
  shape: false,
  style: false,
  edgeVariant: true,
  reverse: true,
};

export const ARCHITECTURE_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'round', name: 'Service' },
];

export const ARCHITECTURE_EDGE_VARIANTS: Choice[] = [
  { value: '--', name: 'Line' },
  { value: '-->', name: 'Arrow' },
  { value: '<--', name: 'Arrow back' },
  { value: '<-->', name: 'Both ways' },
];

const FORBID = /[[\]()]/g;

export function applyArchitectureOp(text: string, op: TextOp): TextOpResult {
  const doc = parseArchitecture(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, ARCHITECTURE_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const label = cleanForText(op.label, FORBID);
    const id = nextId(doc, 's');
    const line = `${indent}service ${id}(server)[${label}]`;
    let newText = appendLine(text, doc, line);
    if (op.pin && ARCHITECTURE_CAPS.move) {
      const p = setPinInternal(newText, id, op.pin.x, op.pin.y, true);
      if ('text' in p) newText = p.text;
    }
    return { text: newText, createdId: id };
  }

  if (op.type === 'addEdge') {
    const fromExists = doc.nodes.some((n) => n.id === op.from) || doc.groups.some((g) => g.id === op.from);
    if (!fromExists) return { error: MESSAGES.unknownNode(op.from) };
    const toExists = doc.nodes.some((n) => n.id === op.to) || doc.groups.some((g) => g.id === op.to);
    if (!toExists) return { error: MESSAGES.unknownNode(op.to) };
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const line = `${indent}${op.from}:R -- L:${op.to}`;
    return { text: appendLine(text, doc, line) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return { text: replaceSpan(text, node.labelSpan, clean) };
    }
    if (node.line >= 0 && node.line < rawLines.length) {
      const lineStr = rawLines[node.line];
      const iconMatch = /\((?:[\w:-]+)\)/.exec(lineStr);
      if (iconMatch) {
        const pos = iconMatch.index + iconMatch[0].length;
        const newLine = lineStr.slice(0, pos) + `[${clean}]` + lineStr.slice(pos);
        return { text: rebuildLine(text, node.line, newLine.trimStart()) };
      }
      const declMatch = /(?:service|group|junction)\s+([A-Za-z0-9_-]+)/.exec(lineStr);
      if (declMatch) {
        const pos = declMatch.index + declMatch[0].length;
        const newLine = lineStr.slice(0, pos) + `[${clean}]` + lineStr.slice(pos);
        return { text: rebuildLine(text, node.line, newLine.trimStart()) };
      }
    }
    return { error: MESSAGES.opUnsupported };
  }

  if (op.type === 'renameGroup') {
    const group = doc.groups.find((g) => g.id === op.id);
    if (!group) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.title, FORBID);
    if (group.labelSpan) {
      return { text: replaceSpan(text, group.labelSpan, clean) };
    }
    if (group.line >= 0 && group.line < rawLines.length) {
      const lineStr = rawLines[group.line];
      const iconMatch = /\((?:[\w:-]+)\)/.exec(lineStr);
      if (iconMatch) {
        const pos = iconMatch.index + iconMatch[0].length;
        const newLine = lineStr.slice(0, pos) + `[${clean}]` + lineStr.slice(pos);
        return { text: rebuildLine(text, group.line, newLine.trimStart()) };
      }
      const declMatch = /group\s+([A-Za-z0-9_-]+)/.exec(lineStr);
      if (declMatch) {
        const pos = declMatch.index + declMatch[0].length;
        const newLine = lineStr.slice(0, pos) + `[${clean}]` + lineStr.slice(pos);
        return { text: rebuildLine(text, group.line, newLine.trimStart()) };
      }
    }
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
    if (edge.line < 0 || edge.line >= rawLines.length) return { error: MESSAGES.opUnsupported };
    const m = EDGE_RE.exec(rawLines[edge.line].trim());
    if (!m) return { error: MESSAGES.opUnsupported };
    const fromGroup = Boolean(m[2]);
    const toGroup = Boolean(m[7]);
    if (fromGroup || toGroup) return { error: MESSAGES.opUnsupported };
    const rawFrom = m[1];
    const fromSide = m[3];
    const variant = m[4];
    const toSide = m[5];
    const rawTo = m[6];
    const mirrored = mirrorOp(variant);
    const newLine = `${rawTo}:${toSide} ${mirrored} ${fromSide}:${rawFrom}`;
    return { text: rebuildLine(text, edge.line, newLine) };
  }

  if (op.type === 'deleteNode') {
    return deleteNodeGeneric(text, doc, op.id);
  }

  if (op.type === 'deleteEdge') {
    return deleteEdgeGeneric(text, doc, op.index);
  }

  return { error: MESSAGES.opUnsupported };
}
