import { MESSAGES } from '../core/constants';
import type { EdgeKind, TextOpResult } from '../core/types';
import { edgeOperatorText, formatPipeLabel } from './format';
import { parseMermaid } from './parse';
import { scanStatement, type StatementToken } from './tokens';

function indentOf(line: string): string {
  const m = /^\s*/.exec(line);
  return m ? m[0] : '';
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

export function deleteEdgeInternal(
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

export function renameEdgeInternal(
  text: string,
  index: number,
  label: string
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
    return renameEdgeInternal(lines.join('\n') + '\n', index, label);
  }

  const toks = scanStatement(lines[L]);
  const edgeTok = toks?.find(t => t.type === 'edge');
  if (edgeTok) {
    const opText = edgeOperatorText(edge.kind);
    const pipe = label ? '|' + formatPipeLabel(label) + '|' : '';
    lines[L] =
      lines[L].slice(0, edgeTok.start) + opText + pipe + lines[L].slice(edgeTok.end);
  }

  return { text: lines.join('\n') + '\n' };
}

export function setEdgeKindInternal(
  text: string,
  index: number,
  kind: EdgeKind
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
    return setEdgeKindInternal(lines.join('\n') + '\n', index, kind);
  }

  const toks = scanStatement(lines[L]);
  const edgeTok = toks?.find(t => t.type === 'edge');
  if (edgeTok) {
    const opText = edgeOperatorText(kind);
    const pipe = edge.label ? '|' + formatPipeLabel(edge.label) + '|' : '';
    lines[L] =
      lines[L].slice(0, edgeTok.start) + opText + pipe + lines[L].slice(edgeTok.end);
  }

  return { text: lines.join('\n') + '\n' };
}

export function reverseEdgeInternal(text: string, index: number): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  if (index < 0 || index >= doc.edges.length) return { error: MESSAGES.unknownEdge(index) };

  const edge = doc.edges[index];
  if (edge.from === edge.to) return { text };

  const L = edge.line;
  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const edgesOnLine = doc.edges.filter(e => e.line === L);
  if (edgesOnLine.length > 1) {
    const split = splitStatement(lines[L]);
    lines.splice(L, 1, ...split);
    return reverseEdgeInternal(lines.join('\n') + '\n', index);
  }

  const toks = scanStatement(lines[L]);
  if (!toks) return { text: lines.join('\n') + '\n' };

  const nodeToks = toks.filter(t => t.type === 'node');
  const edgeTok = toks.find(t => t.type === 'edge');

  if (nodeToks.length >= 2 && edgeTok) {
    const a = nodeToks[0];
    const b = nodeToks[1];
    const prefix = lines[L].slice(0, a.start);
    const textA = lines[L].slice(a.start, a.end);
    const edgeText = lines[L].slice(edgeTok.start, edgeTok.end);
    const textB = lines[L].slice(b.start, b.end);
    const suffix = lines[L].slice(b.end);

    lines[L] = `${prefix}${textB} ${edgeText} ${textA}${suffix}`;
  }

  return { text: lines.join('\n') + '\n' };
}
