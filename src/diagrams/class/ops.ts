import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import { setPinInternal } from '../../mermaid/positions';
import {
  appendLine, cleanForText, deleteEdgeGeneric, deleteNodeGeneric,
  guardOk, indentOf, insertLine, lastContentLine, mirrorOp,
  nextId, pinOps, rebuildLine, replaceSpan, upsertStyleLine,
} from '../common/edit';
import { parseClass } from './parse';

export const CLASS_CAPS: EditCaps = {
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

export const CLASS_ADD_CHOICES: Choice<ShapeKind>[] = [{ value: 'rect', name: 'Class' }];

export const CLASS_EDGE_VARIANTS: Choice[] = [
  { value: '<|--', name: 'Inheritance' },
  { value: '*--', name: 'Composition' },
  { value: 'o--', name: 'Aggregation' },
  { value: '-->', name: 'Association' },
  { value: '--', name: 'Link' },
  { value: '..>', name: 'Dependency' },
  { value: '..|>', name: 'Realization' },
  { value: '..', name: 'Dashed link' },
];

const FORBID = /["]/g;

export function applyClassOp(text: string, op: TextOp): TextOpResult {
  const doc = parseClass(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, CLASS_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const id = nextId(doc, 'Class');
    const label = cleanForText(op.label, FORBID);
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const line = `${indent}class ${id}["${label}"]`;
    let newText = appendLine(text, doc, line);
    if (op.pin && CLASS_CAPS.move) {
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
    const label = op.label ? ` : ${cleanForText(op.label, FORBID)}` : '';
    const last = lastContentLine(doc);
    const indent = last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
    const line = `${indent}${op.from} --> ${op.to}${label}`;
    return { text: appendLine(text, doc, line) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return { text: replaceSpan(text, node.labelSpan, clean) };
    }
    const classDeclRe = new RegExp(`^(\\s*class\\s+${node.id}(?:~[^~]+~)?)(.*)$`);
    let declLine = -1;
    let declMatch: RegExpExecArray | null = null;
    if (node.refLines) {
      for (const lineIdx of node.refLines) {
        if (lineIdx >= 0 && lineIdx < rawLines.length) {
          const m = classDeclRe.exec(rawLines[lineIdx]);
          if (m) {
            declLine = lineIdx;
            declMatch = m;
            break;
          }
        }
      }
    }
    if (declLine !== -1 && declMatch) {
      const newLine = `${declMatch[1]}["${clean}"]${declMatch[2]}`;
      return { text: rebuildLine(text, declLine, newLine.trimStart()) };
    }
    const headerLineIdx = doc.lines.find((l) => l.kind === 'header')?.index ?? 0;
    const indent = indentOf(rawLines[headerLineIdx + 1] ?? '') || '  ';
    const line = `${indent}class ${node.id}["${clean}"]`;
    return { text: insertLine(text, headerLineIdx, line) };
  }

  if (op.type === 'renameEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    const clean = cleanForText(op.label, FORBID);
    if (edge.labelSpan) {
      return { text: replaceSpan(text, edge.labelSpan, clean) };
    }
    const lineText = doc.lines[edge.line]?.text ?? '';
    const rebuilt = `${lineText.trimEnd()} : ${clean}`;
    return { text: rebuildLine(text, edge.line, rebuilt.trimStart()) };
  }

  if (op.type === 'setEdgeVariant') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    if (!edge.opSpan) return { error: MESSAGES.opUnsupported };
    let newText = replaceSpan(text, edge.opSpan, op.variant);
    const lines = newText.split('\n');
    const line = lines[edge.line];
    if (line) {
      const esc = op.variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const spaced = line.replace(new RegExp(`(\\S)(${esc})`, 'g'), '$1 $2')
        .replace(new RegExp(`(${esc})(\\S)`, 'g'), '$1 $2');
      if (spaced !== line) {
        lines[edge.line] = spaced;
        newText = lines.join('\n');
      }
    }
    return { text: newText };
  }

  if (op.type === 'reverseEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    const opStr = edge.variant ?? '-->';
    const mirrored = mirrorOp(opStr);
    const toPart = edge.endLabels?.to ? `${edge.to} "${edge.endLabels.to}"` : edge.to;
    const fromPart = edge.endLabels?.from ? `"${edge.endLabels.from}" ${edge.from}` : edge.from;
    const label = edge.label ? ` : ${edge.label}` : '';
    const rebuilt = `${toPart} ${mirrored} ${fromPart}${label}`;
    return { text: rebuildLine(text, edge.line, rebuilt) };
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
