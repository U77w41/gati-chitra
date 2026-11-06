import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import { setPinInternal } from '../../mermaid/positions';
import {
  appendLine, cleanForText, deleteEdgeGeneric, deleteNodeGeneric,
  guardOk, indentOf, insertLine, lastContentLine, mirrorOp,
  nextId, pinOps, rebuildLine, replaceSpan, upsertStyleLine,
} from '../common/edit';
import { parseUsecase } from './parse';

export const USECASE_CAPS: EditCaps = {
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

export const USECASE_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'ellipse', name: 'Use case' },
  { value: 'actor', name: 'Actor' },
  { value: 'rect', name: 'Box' },
];

export const USECASE_EDGE_VARIANTS: Choice[] = [
  { value: '-->', name: 'Association' },
  { value: '--', name: 'Line' },
  { value: '--|>', name: 'Generalization' },
  { value: '..>', name: 'Include or extend' },
];

const FORBID = /["()[\]]/g;

export function applyUsecaseOp(text: string, op: TextOp): TextOpResult {
  const doc = parseUsecase(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, USECASE_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const label = cleanForText(op.label, FORBID);
    let id: string;
    let line: string;

    if (op.shape === 'actor') {
      id = nextId(doc, 'Actor');
      line = `${indent}actor ${id}("${label}")`;
    } else if (op.shape === 'rect') {
      id = nextId(doc, 'Box');
      line = `${indent}${id}["${label}"]`;
    } else {
      id = nextId(doc, 'UC');
      line = `${indent}${id}("${label}")`;
    }

    let newText = appendLine(text, doc, line);
    if (op.pin && USECASE_CAPS.move) {
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
    const line = `${indent}${op.from} --> ${op.to}`;
    return { text: appendLine(text, doc, line) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return { text: replaceSpan(text, node.labelSpan, clean) };
    }
    if (node.shape === 'actor' && node.line >= 0 && node.line < rawLines.length) {
      const lineStr = rawLines[node.line];
      const actorBareMatch = /^(\s*actor\s+[A-Za-z0-9_-]+)(.*)$/.exec(lineStr);
      if (actorBareMatch) {
        const newLine = `${actorBareMatch[1]}("${clean}")${actorBareMatch[2]}`;
        return { text: rebuildLine(text, node.line, newLine.trimStart()) };
      }
    }
    const headerLineIdx = doc.lines.find((l) => l.kind === 'header')?.index ?? 0;
    const indent = indentOf(rawLines[headerLineIdx + 1] ?? '') || '  ';
    const line = `${indent}${node.id}("${clean}")`;
    return { text: insertLine(text, headerLineIdx, line) };
  }

  if (op.type === 'renameEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    const clean = cleanForText(op.label, FORBID);
    if (edge.labelSpan) {
      return { text: replaceSpan(text, edge.labelSpan, clean) };
    }
    if (edge.variant === '-->') {
      const line = `${edge.from} -- "${clean}" --> ${edge.to}`;
      return { text: rebuildLine(text, edge.line, line) };
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
    const v = edge.variant ?? '-->';
    if (v === '-->' || v === '<--' || v === '--') {
      const mirrored = mirrorOp(v);
      const line = `${edge.to} ${mirrored} ${edge.from}`;
      return { text: rebuildLine(text, edge.line, line) };
    }
    return { error: MESSAGES.opUnsupported };
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
