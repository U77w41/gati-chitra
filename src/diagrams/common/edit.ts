import { MESSAGES } from '../../core/constants';
import type { EditCaps } from '../../core/diagram-types';
import type { ParsedDoc, Span, StyleMap, TextOp, TextOpResult } from '../../core/types';
import { clearPinsInternal, setPinInternal } from '../../mermaid/positions';
import { parseStyleString } from '../../mermaid/styles';

export function guardOk(doc: ParsedDoc): TextOpResult | null {
  if (!doc.ok) return { error: MESSAGES.fixTextFirst };
  return null;
}

export function textLines(text: string): string[] {
  const lines = text.split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

export function joinLines(lines: string[]): string {
  if (lines.length === 0) return '';
  return lines.join('\n') + '\n';
}

export function replaceSpan(text: string, span: Span, value: string): string {
  const lines = text.split('\n');
  if (span.line >= 0 && span.line < lines.length) {
    const l = lines[span.line];
    lines[span.line] = l.slice(0, span.from) + value + l.slice(span.to);
  }
  return lines.join('\n');
}

export function deleteLines(text: string, lineIdx: number[]): string {
  const toDelete = new Set(lineIdx);
  const lines = text.split('\n');
  const hasTrailingNewline = text.endsWith('\n');
  const realLines = hasTrailingNewline ? lines.slice(0, -1) : lines;
  const kept = realLines.filter((_, idx) => !toDelete.has(idx));
  return kept.length === 0 ? '' : kept.join('\n') + '\n';
}

export function insertLine(text: string, afterIdx: number, line: string): string {
  const lines = text.split('\n');
  const hasTrailingNewline = text.endsWith('\n');
  const realLines = hasTrailingNewline ? lines.slice(0, -1) : lines;
  const insertAt = afterIdx < 0 ? 0 : afterIdx + 1;
  realLines.splice(insertAt, 0, line);
  return realLines.join('\n') + '\n';
}

export function lastContentLine(doc: ParsedDoc): number {
  const ignored = new Set(['blank', 'comment', 'pos', 'directive', 'frontmatter']);
  let last = -1;
  for (let i = 0; i < doc.lines.length; i++) {
    if (!ignored.has(doc.lines[i].kind)) {
      last = i;
    }
  }
  return last;
}

export function appendLine(text: string, doc: ParsedDoc, line: string): string {
  return insertLine(text, lastContentLine(doc), line);
}

export function appendLines(text: string, doc: ParsedDoc, lines: string[]): string {
  const l = lastContentLine(doc);
  const linesArr = text.split('\n');
  const hasTrailingNewline = text.endsWith('\n');
  const realLines = hasTrailingNewline ? linesArr.slice(0, -1) : linesArr;
  const insertAt = l < 0 ? 0 : l + 1;
  realLines.splice(insertAt, 0, ...lines);
  return realLines.join('\n') + '\n';
}

export function indentOf(line: string): string {
  const m = /^\s*/.exec(line);
  return m ? m[0] : '';
}

export function nextId(doc: ParsedDoc, prefix: string): string {
  const re = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const node of doc.nodes) {
    const m = re.exec(node.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  for (const group of doc.groups) {
    const m = re.exec(group.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${max + 1}`;
}

export function cleanForText(label: string, forbid: RegExp): string {
  const s = label.replace(/\r?\n/g, ' ').replace(forbid, ' ').replace(/\s+/g, ' ').trim();
  return s.length === 0 ? 'New' : s;
}

export function rebuildLine(text: string, lineIdx: number, content: string): string {
  const lines = text.split('\n');
  const hasTrailingNewline = text.endsWith('\n');
  const realLines = hasTrailingNewline ? lines.slice(0, -1) : lines;
  if (lineIdx >= 0 && lineIdx < realLines.length) {
    const indent = indentOf(realLines[lineIdx]);
    realLines[lineIdx] = indent + content;
  }
  return realLines.join('\n') + '\n';
}

export function mirrorOp(op: string): string {
  const chars = op.split('').reverse();
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '<') chars[i] = '>';
    else if (chars[i] === '>') chars[i] = '<';
    else if (chars[i] === '{') chars[i] = '}';
    else if (chars[i] === '}') chars[i] = '{';
  }
  return chars.join('');
}

export function upsertStyleLine(
  text: string,
  doc: ParsedDoc,
  id: string,
  style: StyleMap,
): string {
  const lines = text.split('\n');
  const hasTrailingNewline = text.endsWith('\n');
  const realLines = hasTrailingNewline ? lines.slice(0, -1) : lines;
  const styleRe = new RegExp(`^\\s*style\\s+${id}\\s+(.*)$`);

  let foundIdx = -1;
  let existingStyleStr = '';
  for (let i = 0; i < realLines.length; i++) {
    const m = styleRe.exec(realLines[i]);
    if (m) {
      foundIdx = i;
      existingStyleStr = m[1];
      break;
    }
  }

  if (foundIdx !== -1) {
    const map = parseStyleString(existingStyleStr);
    for (const [k, v] of Object.entries(style)) {
      if (v === '') {
        delete map[k];
      } else {
        map[k] = v;
      }
    }
    const remaining = Object.entries(map);
    if (remaining.length === 0) {
      return deleteLines(text, [foundIdx]);
    }
    const newStyle = remaining.map(([k, v]) => `${k}:${v}`).join(',');
    return rebuildLine(text, foundIdx, `style ${id} ${newStyle}`);
  }

  const nonEmpty = Object.entries(style).filter(([, v]) => v !== '');
  if (nonEmpty.length === 0) return text;
  const styleStr = nonEmpty.map(([k, v]) => `${k}:${v}`).join(',');
  return appendLine(text, doc, `  style ${id} ${styleStr}`);
}

export function upsertClassStyle(
  text: string,
  doc: ParsedDoc,
  id: string,
  style: StyleMap,
): string {
  const className = `gc_${id}`;
  const nonEmpty = Object.entries(style).filter(([, v]) => v !== '');
  const styleStr = nonEmpty.map(([k, v]) => `${k}:${v}`).join(',');
  return appendLines(text, doc, [
    `  classDef ${className} ${styleStr}`,
    `  class ${id} ${className}`,
  ]);
}

export function pinOps(
  text: string,
  doc: ParsedDoc,
  op: TextOp,
  caps: EditCaps,
): TextOpResult | null {
  if (op.type === 'setPin') {
    if (!caps.move) return { error: MESSAGES.opUnsupported };
    const hasNode = doc.nodes.some((n) => n.id === op.id);
    return setPinInternal(text, op.id, op.x, op.y, hasNode);
  }
  if (op.type === 'clearPins') {
    if (!caps.move) return { error: MESSAGES.opUnsupported };
    return clearPinsInternal(text);
  }
  return null;
}

export function deleteNodeGeneric(text: string, doc: ParsedDoc, id: string): TextOpResult {
  const node = doc.nodes.find((n) => n.id === id);
  if (!node) return { error: MESSAGES.unknownNode(id) };

  const linesToDelete: number[] = [];
  if (node.refLines && node.refLines.length > 0) {
    linesToDelete.push(...node.refLines);
  } else {
    linesToDelete.push(node.line);
  }

  for (const edge of doc.edges) {
    if (edge.from === id || edge.to === id) {
      linesToDelete.push(edge.line);
    }
  }

  const pinRe = new RegExp(`^\\s*%%\\s*studio:pos\\s+${id}\\s+`);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pinRe.test(lines[i])) {
      linesToDelete.push(i);
    }
  }

  return { text: deleteLines(text, linesToDelete) };
}

export function deleteEdgeGeneric(text: string, doc: ParsedDoc, index: number): TextOpResult {
  const edge = doc.edges.find((e) => e.index === index);
  if (!edge) return { error: MESSAGES.unknownEdge(index) };
  const shared = doc.edges.some((e) => e.index !== index && e.line === edge.line);
  if (shared) return { error: MESSAGES.opUnsupported };
  return { text: deleteLines(text, [edge.line]) };
}

export function renameBySpan(
  text: string,
  span: Span | undefined,
  label: string,
  forbid: RegExp,
): TextOpResult | null {
  if (!span) return null;
  const clean = cleanForText(label, forbid);
  return { text: replaceSpan(text, span, clean) };
}
