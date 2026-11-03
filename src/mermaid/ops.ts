import { MESSAGES } from '../core/constants';
import type {
  EdgeKind,
  ParsedDoc,
  ShapeKind,
  TextOp,
  TextOpResult,
} from '../core/types';
import {
  edgeOperatorText,
  formatLabel,
  formatPipeLabel,
  shapeTokens,
} from './format';
import { nextNodeId } from './ids';
import { parseMermaid } from './parse';
import { formatPinLine, PIN_LINE_RE, PIN_MARKER } from './positions';
import { scanStatement, type StatementToken } from './tokens';

export { edgeOperatorText, formatLabel, shapeTokens };

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

export function splitStatement(line: string): string[] {
  const tokens = scanStatement(line);
  if (!tokens) return [line];

  const edgeTokens = tokens.filter(t => t.type === 'edge');
  const hasAmp = tokens.some(t => t.type === 'amp');
  if (edgeTokens.length <= 1 && !hasAmp) return [line];

  const nodeGroups: StatementToken[][] = [[]];
  const ops: { kind: EdgeKind; label: string }[] = [];

  for (const tok of tokens) {
    if (tok.type === 'node') {
      nodeGroups[nodeGroups.length - 1].push(tok);
    } else if (tok.type === 'edge') {
      ops.push({ kind: tok.kind, label: tok.label });
      nodeGroups.push([]);
    }
  }

  if (ops.length === 0) return [line];

  const indent = indentOf(line);
  const emitted = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i < ops.length; i++) {
    const leftGroup = nodeGroups[i];
    const rightGroup = nodeGroups[i + 1];
    const op = ops[i];
    const opStr = edgeOperatorText(op.kind) + (op.label ? '|' + op.label + '|' : '');

    for (const a of leftGroup) {
      if (a.type !== 'node') continue;
      for (const b of rightGroup) {
        if (b.type !== 'node') continue;

        const textA = emitted.has(a.ref.id) ? a.ref.id : line.slice(a.start, a.end);
        emitted.add(a.ref.id);

        const textB = emitted.has(b.ref.id) ? b.ref.id : line.slice(b.start, b.end);
        emitted.add(b.ref.id);

        result.push(`${indent}${textA} ${opStr} ${textB}`);
      }
    }
  }

  return result;
}

function deleteEdgeInternal(
  text: string,
  index: number,
  exclude: string[] = []
): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  if (index < 0 || index >= doc.edges.length) return { error: MESSAGES.unknownEdge(index) };

  const edge = doc.edges[index];
  const L = edge.line;
  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const edgesOnLine = doc.edges.filter(e => e.line === L);
  if (edgesOnLine.length > 1) {
    const split = splitStatement(lines[L]);
    lines.splice(L, 1, ...split);
    return deleteEdgeInternal(lines.join('\n') + '\n', index, exclude);
  }

  const lineTokens = scanStatement(lines[L]);
  const nodeToks = lineTokens ? lineTokens.filter(t => t.type === 'node') : [];
  const indent = indentOf(lines[L]);
  const standaloneLines: string[] = [];
  const handled = new Set<string>();

  for (const t of nodeToks) {
    if (t.type === 'node' && !handled.has(t.ref.id)) {
      handled.add(t.ref.id);
      if (!exclude.includes(t.ref.id)) {
        const isRefElsewhere = doc.lines.some(
          l => l.index !== L && l.nodeIds.includes(t.ref.id)
        );
        if (!isRefElsewhere) {
          standaloneLines.push(indent + lines[L].slice(t.start, t.end));
        }
      }
    }
  }

  lines.splice(L, 1, ...standaloneLines);

  for (let j = 0; j < lines.length; j++) {
    const trimmed = lines[j].trim();
    if (trimmed.startsWith('linkStyle ')) {
      const rest = trimmed.slice(10).trim();
      const spaceIdx = rest.search(/\s/);
      if (spaceIdx !== -1) {
        const target = rest.slice(0, spaceIdx).trim();
        const stylePart = rest.slice(spaceIdx).trim();
        if (target !== 'default') {
          const nums = target
            .split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => !isNaN(n));
          const updatedNums: number[] = [];
          for (const n of nums) {
            if (n === index) continue;
            if (n > index) updatedNums.push(n - 1);
            else updatedNums.push(n);
          }
          if (updatedNums.length === 0) {
            lines.splice(j, 1);
            j--;
          } else {
            lines[j] = `${indentOf(lines[j])}linkStyle ${updatedNums.join(',')} ${stylePart}`;
          }
        }
      }
    }
  }

  return { text: lines.join('\n') + '\n' };
}

function deleteNodeInternal(text: string, id: string): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  if (!doc.nodes.some(n => n.id === id)) return { error: MESSAGES.unknownNode(id) };

  let currentText = text;
  while (true) {
    const curDoc = parseMermaid(currentText);
    const touching = curDoc.edges
      .filter(e => e.from === id || e.to === id)
      .sort((a, b) => b.index - a.index);
    if (touching.length === 0) break;

    const res = deleteEdgeInternal(currentText, touching[0].index, [id]);
    if ('error' in res) return res;
    currentText = res.text;
  }

  const curDoc = parseMermaid(currentText);
  const lines = curDoc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  for (let j = 0; j < lines.length; j++) {
    const toks = scanStatement(lines[j]);
    if (toks) {
      const nodeToks = toks.filter(t => t.type === 'node');
      const edgeToks = toks.filter(t => t.type === 'edge');
      if (edgeToks.length === 0) {
        if (nodeToks.length === 1 && nodeToks[0].ref.id === id) {
          lines.splice(j, 1);
          j--;
          continue;
        }
        if (nodeToks.some(t => t.ref.id === id)) {
          const remaining = nodeToks.filter(t => t.ref.id !== id);
          if (remaining.length === 0) {
            lines.splice(j, 1);
            j--;
            continue;
          } else {
            const indent = indentOf(lines[j]);
            lines[j] =
              indent + remaining.map(t => lines[j].slice(t.start, t.end)).join(' & ');
          }
          continue;
        }
      }
    }

    const trimmed = lines[j].trim();
    if (trimmed.startsWith('style ')) {
      const rest = trimmed.slice(6).trim();
      const spaceIdx = rest.search(/\s/);
      const styleId = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx).trim();
      if (styleId === id) {
        lines.splice(j, 1);
        j--;
        continue;
      }
    }

    if (trimmed.startsWith('class ')) {
      const rest = trimmed.slice(6).trim();
      const parts = rest.split(/\s+/);
      if (parts.length >= 2) {
        const ids = parts[0].split(',').map(s => s.trim()).filter(Boolean);
        const className = parts[1].trim();
        if (ids.includes(id)) {
          const remaining = ids.filter(x => x !== id);
          if (remaining.length === 0) {
            lines.splice(j, 1);
            j--;
          } else {
            lines[j] = `${indentOf(lines[j])}class ${remaining.join(',')} ${className}`;
          }
          continue;
        }
      }
    }

    const posMatch = PIN_LINE_RE.exec(lines[j]);
    if (posMatch && posMatch[1] === id) {
      lines.splice(j, 1);
      j--;
      continue;
    }
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
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
    const { open, close } = shapeTokens(op.shape);
    const { index, indent } = getInsertionInfo(doc);
    const nodeLine = `${indent}${id}${open}${formatLabel(op.label)}${close}`;
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

  return { error: 'Unsupported operation' };
}
