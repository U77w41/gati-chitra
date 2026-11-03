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
import { formatPinLine, PIN_LINE_RE, PIN_MARKER } from './positions';
import { parseStyleString } from './styles';

export { edgeOperatorText, formatLabel, shapeTokens, spliceLine, splitStatement };

function indentOf(line: string): string {
  const m = /^\s*/.exec(line);
  return m ? m[0] : '';
}

function getInsertionInfo(doc: ParsedDoc): { index: number; indent: string } {
  let depth = 0;
  let lastTopLevelIndex = -1;
  let lastTopLevelLine: string | null = null;
  let headerIndex = -1;

  for (let i = 0; i < doc.lines.length; i++) {
    const l = doc.lines[i];
    if (l.kind === 'header') headerIndex = i;
    if (l.kind === 'end') depth = Math.max(0, depth - 1);

    const isContent = [
      'statement',
      'subgraph',
      'end',
      'direction',
      'classDef',
      'class',
      'style',
      'linkStyle',
    ].includes(l.kind);

    if (isContent && depth === 0) {
      lastTopLevelIndex = i;
      lastTopLevelLine = l.text;
    }

    if (l.kind === 'subgraph') depth++;
  }

  if (lastTopLevelIndex !== -1) {
    return { index: lastTopLevelIndex, indent: indentOf(lastTopLevelLine!) };
  }
  if (headerIndex !== -1) {
    return { index: headerIndex, indent: '  ' };
  }
  return { index: doc.lines.length - 1, indent: '  ' };
}

function setNodeStyleInternal(text: string, id: string, style: StyleMap): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  if (!doc.nodes.some(n => n.id === id)) return { error: MESSAGES.unknownNode(id) };

  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  let styleLineIdx = -1;
  let existingStyleMap: StyleMap = {};

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

  if (styleLineIdx !== -1) {
    const merged = { ...existingStyleMap };
    for (const [k, v] of Object.entries(style)) {
      if (v === '') {
        delete merged[k];
      } else {
        merged[k] = v;
      }
    }
    const pairs = Object.entries(merged).map(([k, v]) => `${k}:${v}`);
    if (pairs.length === 0) {
      lines.splice(styleLineIdx, 1);
    } else {
      const indent = indentOf(lines[styleLineIdx]);
      lines[styleLineIdx] = `${indent}style ${id} ${pairs.join(',')}`;
    }
  } else {
    const pairs = Object.entries(style)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}:${v}`);
    if (pairs.length > 0) {
      const { index, indent } = getInsertionInfo(doc);
      lines.splice(index + 1, 0, `${indent}style ${id} ${pairs.join(',')}`);
    }
  }

  return { text: lines.join('\n') + '\n' };
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
  return { text: lines.join('\n') + '\n' };
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

  return { text: lines.join('\n') + '\n' };
}

export function applyOp(text: string, op: TextOp): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };

  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  if (op.type === 'setPin') {
    if (!doc.nodes.some(n => n.id === op.id)) {
      return { error: MESSAGES.unknownNode(op.id) };
    }
    const pinLine = formatPinLine(op.id, op.x, op.y);
    const existingIdx = lines.findIndex(l => {
      const m = PIN_LINE_RE.exec(l);
      return m && m[1] === op.id;
    });

    if (existingIdx !== -1) {
      lines[existingIdx] = pinLine;
    } else {
      let lastPosIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (PIN_LINE_RE.test(lines[i])) {
          lastPosIdx = i;
          break;
        }
      }
      if (lastPosIdx !== -1) {
        lines.splice(lastPosIdx + 1, 0, pinLine);
      } else {
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
        const markerIdx = lines.findIndex(l => l.trim() === PIN_MARKER);
        if (markerIdx !== -1) {
          lines.splice(markerIdx + 1, 0, pinLine);
        } else {
          lines.push('', PIN_MARKER, pinLine);
        }
      }
    }
    return { text: lines.join('\n') + '\n' };
  }

  if (op.type === 'clearPins') {
    const filtered = lines.filter(l => !PIN_LINE_RE.test(l) && l.trim() !== PIN_MARKER);
    while (filtered.length > 0 && filtered[filtered.length - 1].trim() === '') {
      filtered.pop();
    }
    return { text: filtered.join('\n') + '\n' };
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
    const newText = lines.join('\n') + '\n';
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
    return { text: lines.join('\n') + '\n' };
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
