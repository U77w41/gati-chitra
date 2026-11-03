import { MESSAGES } from '../core/constants';
import { SHAPE_SHORT } from '../core/shapes';
import type { Direction, ParsedDoc, StyleMap, TextOp, TextOpResult } from '../core/types';
import {
  edgeOperatorText,
  formatLabel,
  formatPipeLabel,
  shapeTokens,
} from './format';
import { nextNodeId } from './ids';
import {
  deleteEdgeInternal,
  renameEdgeInternal,
  reverseEdgeInternal,
  setEdgeKindInternal,
  splitStatement,
} from './ops-edge';
import {
  deleteNodeInternal,
  renameNodeInternal,
  setShapeInternal,
  spliceLine,
} from './ops-node';
import { parseMermaid } from './parse';
import { splitStatements } from './parse-statement';
import { clearPinsInternal, setPinInternal } from './positions';
import { parseStyleString } from './styles';

export { edgeOperatorText, formatLabel, shapeTokens, spliceLine, splitStatement };

function indentOf(line: string): string {
  const m = /^\s*/.exec(line);
  return m ? m[0] : '';
}

function getInsertionInfo(doc: ParsedDoc): { index: number; indent: string } {
  let depth = 0, lastIdx = -1, lastLine: string | null = null, headerIdx = -1;
  const contentKinds = new Set(['statement', 'subgraph', 'end', 'direction', 'classDef', 'class', 'style', 'linkStyle']);
  for (let i = 0; i < doc.lines.length; i++) {
    const l = doc.lines[i];
    if (l.kind === 'header') headerIdx = i;
    if (l.kind === 'end') depth = Math.max(0, depth - 1);
    if (contentKinds.has(l.kind) && depth === 0) { lastIdx = i; lastLine = l.text; }
    if (l.kind === 'subgraph') depth++;
  }
  if (lastIdx !== -1) return { index: lastIdx, indent: indentOf(lastLine!) };
  if (headerIdx !== -1) return { index: headerIdx, indent: '  ' };
  return { index: doc.lines.length - 1, indent: '  ' };
}

function setNodeStyleInternal(text: string, id: string, style: StyleMap): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  if (!doc.nodes.some(n => n.id === id)) return { error: MESSAGES.unknownNode(id) };

  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  let styleLineIdx = -1, existingStyleMap: StyleMap = {};
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('style ')) {
      const rest = trimmed.slice(6).trim();
      const spaceIdx = rest.search(/\s/);
      const styleId = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx).trim();
      if (styleId === id) {
        styleLineIdx = i;
        let sStr = spaceIdx === -1 ? '' : rest.slice(spaceIdx + 1).trim();
        if (sStr.endsWith(';')) sStr = sStr.slice(0, -1).trim();
        existingStyleMap = parseStyleString(sStr);
        break;
      }
    }
  }

  const merged = { ...existingStyleMap };
  for (const [k, v] of Object.entries(style)) {
    if (v === '') delete merged[k]; else merged[k] = v;
  }
  const pairs = Object.entries(merged).map(([k, v]) => `${k}:${v}`);

  if (styleLineIdx !== -1) {
    if (pairs.length === 0) lines.splice(styleLineIdx, 1);
    else lines[styleLineIdx] = `${indentOf(lines[styleLineIdx])}style ${id} ${pairs.join(',')}`;
  } else if (pairs.length > 0) {
    const { index, indent } = getInsertionInfo(doc);
    lines.splice(index + 1, 0, `${indent}style ${id} ${pairs.join(',')}`);
  }

  const trailing = text.endsWith('\n') ? '\n' : '';
  return { text: lines.join('\n') + trailing };
}

function renameGroupInternal(text: string, id: string, title: string): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  const grp = doc.groups.find(g => g.id === id);
  if (!grp) return { error: `Unknown group "${id}".` };

  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const indent = indentOf(lines[grp.line]);
  lines[grp.line] = `${indent}subgraph ${id} [${formatLabel(title)}]`;
  const trailing = text.endsWith('\n') ? '\n' : '';
  return { text: lines.join('\n') + trailing };
}

function setDirectionInternal(text: string, direction: Direction): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };

  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const headerIdx = doc.lines.findIndex(l => l.kind === 'header');
  if (headerIdx !== -1) {
    const dirStr = direction === 'TB' ? 'TD' : direction;
    lines[headerIdx] = lines[headerIdx].replace(
      /^(\s*)(flowchart|graph)(?:\s+(TB|TD|BT|RL|LR))?(\s*;?\s*)$/,
      `$1$2 ${dirStr}$4`
    );
  }

  const trailing = text.endsWith('\n') ? '\n' : '';
  return { text: lines.join('\n') + trailing };
}

function getTargetLines(doc: ParsedDoc, op: TextOp): number[] {
  switch (op.type) {
    case 'deleteEdge':
    case 'renameEdge':
    case 'setEdgeKind':
    case 'reverseEdge':
      return doc.edges[op.index] ? [doc.edges[op.index].line] : [];
    case 'renameNode':
    case 'setShape':
      return doc.lines.filter(l => l.nodeIds.includes(op.id)).map(l => l.index);
    case 'deleteNode':
      return [
        ...doc.lines.filter(l => l.nodeIds.includes(op.id)).map(l => l.index),
        ...doc.edges.filter(e => e.from === op.id || e.to === op.id).map(e => e.line),
      ];
    case 'renameGroup':
      return doc.groups.filter(g => g.id === op.id).map(g => g.line);
    case 'setDirection':
      return doc.lines.filter(l => l.kind === 'header').map(l => l.index);
    default:
      return [];
  }
}

export function applyOp(text: string, op: TextOp): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };

  const targetLines = getTargetLines(doc, op);
  if (targetLines.length > 0) {
    const rawLines = doc.lines.map(l => l.text);
    const multiStmtLines = targetLines.filter(
      idx => idx >= 0 && idx < rawLines.length && splitStatements(rawLines[idx]).length > 1
    );
    if (multiStmtLines.length > 0) {
      const sorted = Array.from(new Set(multiStmtLines)).sort((a, b) => b - a);
      for (const idx of sorted) {
        const raw = rawLines[idx];
        const indent = indentOf(raw);
        const parts = splitStatements(raw).map(p => `${indent}${p.trim()}`);
        rawLines.splice(idx, 1, ...parts);
      }
      const trailing = text.endsWith('\n') ? '\n' : '';
      return applyOp(rawLines.join('\n') + trailing, op);
    }
  }

  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  if (op.type === 'setPin') {
    return setPinInternal(text, op.id, op.x, op.y, doc.nodes.some(n => n.id === op.id));
  }

  if (op.type === 'clearPins') {
    return clearPinsInternal(text);
  }

  if (op.type === 'addNode') {
    const id = nextNodeId(doc);
    const tok = shapeTokens(op.shape);
    const { index, indent } = getInsertionInfo(doc);
    const nodeLine =
      tok === null
        ? `${indent}${id}@{ shape: ${SHAPE_SHORT[op.shape]}, label: "${formatLabel(op.label)}" }`
        : `${indent}${id}${tok.open}${formatLabel(op.label)}${tok.close}`;
    lines.splice(index + 1, 0, nodeLine);
    const trailing = text.endsWith('\n') ? '\n' : '';
    const newText = lines.join('\n') + (trailing || '\n');
    if (op.pin) {
      const pinRes = applyOp(newText, {
        type: 'setPin',
        id,
        x: op.pin.x,
        y: op.pin.y,
      });
      if ('text' in pinRes) {
        return { text: pinRes.text, createdId: id };
      }
      return pinRes;
    }
    return { text: newText, createdId: id };
  }

  if (op.type === 'addEdge') {
    if (!doc.nodes.some(n => n.id === op.from)) {
      return { error: MESSAGES.unknownNode(op.from) };
    }
    if (!doc.nodes.some(n => n.id === op.to)) {
      return { error: MESSAGES.unknownNode(op.to) };
    }
    const { index, indent } = getInsertionInfo(doc);
    const opText = edgeOperatorText(op.kind ?? 'arrow');
    const pipe = op.label ? `|${formatPipeLabel(op.label)}|` : '';
    const edgeLine = `${indent}${op.from} ${opText}${pipe} ${op.to}`;
    lines.splice(index + 1, 0, edgeLine);
    const trailing = text.endsWith('\n') ? '\n' : '';
    return { text: lines.join('\n') + trailing };
  }

  if (op.type === 'deleteEdge') {
    return deleteEdgeInternal(text, op.index);
  }

  if (op.type === 'deleteNode') {
    return deleteNodeInternal(text, op.id);
  }

  if (op.type === 'renameNode') {
    return renameNodeInternal(text, op.id, op.label);
  }

  if (op.type === 'setShape') {
    return setShapeInternal(text, op.id, op.shape);
  }

  if (op.type === 'renameEdge') {
    return renameEdgeInternal(text, op.index, op.label);
  }

  if (op.type === 'setEdgeKind') {
    return setEdgeKindInternal(text, op.index, op.kind);
  }

  if (op.type === 'reverseEdge') {
    return reverseEdgeInternal(text, op.index);
  }

  if (op.type === 'setNodeStyle') {
    return setNodeStyleInternal(text, op.id, op.style);
  }

  if (op.type === 'renameGroup') {
    return renameGroupInternal(text, op.id, op.title);
  }

  if (op.type === 'setDirection') {
    return setDirectionInternal(text, op.direction);
  }

  return { error: 'Unsupported operation' };
}
