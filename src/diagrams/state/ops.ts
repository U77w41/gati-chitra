import { MESSAGES } from '../../core/constants';
import type { EditCaps } from '../../core/diagram-types';
import type { ParsedDoc, TextOp, TextOpResult } from '../../core/types';
import { setPinInternal } from '../../mermaid/positions';
import {
  appendLine, cleanForText, deleteEdgeGeneric, deleteNodeGeneric,
  guardOk, indentOf, insertLine, lastContentLine, nextId, pinOps,
  rebuildLine, replaceSpan, upsertClassStyle,
} from '../common/edit';
import { parseState } from './parse';

export const STATE_CAPS: EditCaps = {
  add: true,
  connect: true,
  rename: true,
  delete: true,
  move: true,
  shape: false,
  style: true,
  edgeVariant: false,
  reverse: true,
};

const FORBID = /[:;"]/g;

function resolvePseudo(name: string): string {
  if (name === '[*]' || name.startsWith('__start_') || name.startsWith('__end_')) {
    return '[*]';
  }
  return name;
}

function getNodeScope(doc: ParsedDoc, id: string): string | null | undefined {
  if (id === '[*]') return null;
  if (id.startsWith('__start_')) {
    const s = id.slice(8);
    return s === 'root' ? null : s;
  }
  if (id.startsWith('__end_')) {
    const s = id.slice(6);
    return s === 'root' ? null : s;
  }
  const node = doc.nodes.find((n) => n.id === id);
  if (node) return node.group;
  const group = doc.groups.find((g) => g.id === id);
  if (group) return group.parent;
  return undefined;
}

function findScopeIndent(doc: ParsedDoc, rawLines: string[], scope: string | null): string {
  if (!scope) {
    const last = lastContentLine(doc);
    return last >= 0 ? indentOf(rawLines[last]) || '  ' : '  ';
  }
  const group = doc.groups.find((g) => g.id === scope);
  if (!group || group.endLine === undefined || group.endLine < 0) return '  ';
  for (let j = group.line + 1; j < group.endLine; j++) {
    const trimmed = rawLines[j].trim();
    if (trimmed !== '' && !trimmed.startsWith('%%')) {
      return indentOf(rawLines[j]) || '    ';
    }
  }
  return `${indentOf(rawLines[group.line])}  `;
}

export function applyStateOp(text: string, op: TextOp): TextOpResult {
  const doc = parseState(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, STATE_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');

  if (op.type === 'addNode') {
    const id = nextId(doc, 'S');
    const label = cleanForText(op.label, FORBID);
    const indent = findScopeIndent(doc, rawLines, null);
    const line = `${indent}${id} : ${label}`;
    let newText = appendLine(text, doc, line);
    if (op.pin && STATE_CAPS.move) {
      const p = setPinInternal(newText, id, op.pin.x, op.pin.y, true);
      if ('text' in p) newText = p.text;
    }
    return { text: newText, createdId: id };
  }

  if (op.type === 'addEdge') {
    let fromScope = getNodeScope(doc, op.from);
    let toScope = getNodeScope(doc, op.to);
    if (fromScope === undefined) return { error: MESSAGES.unknownNode(op.from) };
    if (toScope === undefined) return { error: MESSAGES.unknownNode(op.to) };

    if (op.from === '[*]' && fromScope === null && toScope !== null) fromScope = toScope;
    if (op.to === '[*]' && toScope === null && fromScope !== null) toScope = fromScope;

    if (fromScope !== toScope) return { error: MESSAGES.crossScope };

    const fromName = resolvePseudo(op.from);
    const toName = resolvePseudo(op.to);
    const label = op.label ? ` : ${cleanForText(op.label, FORBID)}` : '';
    const indent = findScopeIndent(doc, rawLines, fromScope);
    const line = `${indent}${fromName} --> ${toName}${label}`;

    if (!fromScope) {
      return { text: appendLine(text, doc, line) };
    }
    const group = doc.groups.find((g) => g.id === fromScope);
    if (!group || group.endLine === undefined || group.endLine < 0) {
      return { text: appendLine(text, doc, line) };
    }
    return { text: insertLine(text, group.endLine - 1, line) };
  }

  if (op.type === 'renameNode') {
    if (op.id === '[*]' || op.id.startsWith('__start_') || op.id.startsWith('__end_')) {
      return { error: MESSAGES.opUnsupported };
    }
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    if (node.shape === 'note' && (node.label.includes('\n') || (node.refLines && node.refLines.length > 1))) {
      return { error: MESSAGES.opUnsupported };
    }
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return { text: replaceSpan(text, node.labelSpan, clean) };
    }
    const indent = findScopeIndent(doc, rawLines, node.group);
    const line = `${indent}${node.id} : ${clean}`;
    if (!node.group) {
      return { text: appendLine(text, doc, line) };
    }
    const group = doc.groups.find((g) => g.id === node.group);
    if (!group || group.endLine === undefined || group.endLine < 0) {
      return { text: appendLine(text, doc, line) };
    }
    return { text: insertLine(text, group.endLine - 1, line) };
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

  if (op.type === 'renameGroup') {
    const group = doc.groups.find((g) => g.id === op.id);
    if (!group) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.title, FORBID);
    if (group.labelSpan) {
      return { text: replaceSpan(text, group.labelSpan, clean) };
    }
    const lineText = doc.lines[group.line]?.text ?? '';
    const replaced = lineText.replace(/^(\s*state\s+)/, `$1"${clean}" as `);
    return { text: rebuildLine(text, group.line, replaced.trimStart()) };
  }

  if (op.type === 'reverseEdge') {
    const edge = doc.edges[op.index];
    if (!edge) return { error: MESSAGES.unknownEdge(op.index) };
    const fromName = resolvePseudo(edge.from);
    const toName = resolvePseudo(edge.to);
    const label = edge.label ? ` : ${edge.label}` : '';
    return { text: rebuildLine(text, edge.line, `${toName} --> ${fromName}${label}`) };
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
    return { text: upsertClassStyle(text, doc, op.id, op.style) };
  }

  return { error: MESSAGES.opUnsupported };
}
