import { MESSAGES } from '../core/constants';
import type { ShapeKind, TextOpResult } from '../core/types';
import { formatLabel, shapeTokens } from './format';
import { deleteEdgeInternal } from './ops-edge';
import { parseMermaid } from './parse';
import { PIN_LINE_RE } from './positions';
import { scanStatement } from './tokens';

function indentOf(line: string): string {
  const m = /^\s*/.exec(line);
  return m ? m[0] : '';
}

export function spliceLine(
  line: string,
  edits: { start: number; end: number; text: string }[]
): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let res = line;
  for (const edit of sorted) {
    res = res.slice(0, edit.start) + edit.text + res.slice(edit.end);
  }
  return res;
}

export function deleteNodeInternal(text: string, id: string): TextOpResult {
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

export function renameNodeInternal(
  text: string,
  id: string,
  label: string
): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  const targetNode = doc.nodes.find(n => n.id === id);
  if (!targetNode) return { error: MESSAGES.unknownNode(id) };

  const rawLabel = label.trim() === '' ? id : label;
  const newLabel = formatLabel(rawLabel);
  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  let replacedCount = 0;
  let firstRefLineIndex = -1;

  for (let i = 0; i < doc.lines.length; i++) {
    const l = doc.lines[i];
    if (l.nodeIds.includes(id)) {
      if (firstRefLineIndex === -1) firstRefLineIndex = i;
      if (l.kind === 'statement') {
        const toks = scanStatement(lines[i]);
        if (toks) {
          const edits: { start: number; end: number; text: string }[] = [];
          for (const tok of toks) {
            if (tok.type === 'node' && tok.ref.id === id && tok.ref.shape !== null) {
              const { open, close } = shapeTokens(tok.ref.shape);
              const classSuffix = tok.ref.className ? ':::' + tok.ref.className : '';
              edits.push({
                start: tok.start,
                end: tok.end,
                text: `${id}${open}${newLabel}${close}${classSuffix}`,
              });
            }
          }
          if (edits.length > 0) {
            lines[i] = spliceLine(lines[i], edits);
            replacedCount += edits.length;
          }
        }
      }
    }
  }

  if (replacedCount === 0 && firstRefLineIndex !== -1) {
    const { open, close } = shapeTokens(targetNode.shape);
    const indent = indentOf(lines[firstRefLineIndex]);
    lines.splice(firstRefLineIndex + 1, 0, `${indent}${id}${open}${newLabel}${close}`);
  }

  return { text: lines.join('\n') + '\n' };
}

export function setShapeInternal(
  text: string,
  id: string,
  shape: ShapeKind
): TextOpResult {
  const doc = parseMermaid(text);
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  const targetNode = doc.nodes.find(n => n.id === id);
  if (!targetNode) return { error: MESSAGES.unknownNode(id) };

  const { open: newOpen, close: newClose } = shapeTokens(shape);
  const lines = doc.lines.map(l => l.text);
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  let replacedCount = 0;
  let firstRefLineIndex = -1;

  for (let i = 0; i < doc.lines.length; i++) {
    const l = doc.lines[i];
    if (l.nodeIds.includes(id)) {
      if (firstRefLineIndex === -1) firstRefLineIndex = i;
      if (l.kind === 'statement') {
        const toks = scanStatement(lines[i]);
        if (toks) {
          const edits: { start: number; end: number; text: string }[] = [];
          for (const tok of toks) {
            if (tok.type === 'node' && tok.ref.id === id && tok.ref.shape !== null) {
              const classSuffix = tok.ref.className ? ':::' + tok.ref.className : '';
              const labelStr = formatLabel(tok.ref.label ?? id);
              edits.push({
                start: tok.start,
                end: tok.end,
                text: `${id}${newOpen}${labelStr}${newClose}${classSuffix}`,
              });
            }
          }
          if (edits.length > 0) {
            lines[i] = spliceLine(lines[i], edits);
            replacedCount += edits.length;
          }
        }
      }
    }
  }

  if (replacedCount === 0 && firstRefLineIndex !== -1) {
    const indent = indentOf(lines[firstRefLineIndex]);
    const labelStr = formatLabel(targetNode.label);
    lines.splice(firstRefLineIndex + 1, 0, `${indent}${id}${newOpen}${labelStr}${newClose}`);
  }

  return { text: lines.join('\n') + '\n' };
}
