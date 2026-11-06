import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import {
  cleanForText,
  deleteLines,
  guardOk,
  joinLines,
  nextId,
  pinOps,
  rebuildLine,
  renameBySpan,
  textLines,
} from '../common/edit';
import { parseMindmap } from './parse';

export const MINDMAP_CAPS: EditCaps = {
  add: true,
  connect: true,
  rename: true,
  delete: true,
  move: false,
  shape: true,
  style: false,
  edgeVariant: false,
  reverse: false,
};

export const MINDMAP_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'round', name: 'Rounded' },
  { value: 'rect', name: 'Square' },
  { value: 'circle', name: 'Circle' },
  { value: 'bang', name: 'Bang' },
  { value: 'cloud', name: 'Cloud' },
  { value: 'hexagon', name: 'Hexagon' },
];

export const MINDMAP_SHAPE_CHOICES: Choice<ShapeKind>[] = MINDMAP_ADD_CHOICES;

export const MINDMAP_EDGE_VARIANTS: Choice[] = [];

const DELIMITERS: Record<string, { open: string; close: string }> = {
  rect: { open: '[', close: ']' },
  round: { open: '(', close: ')' },
  circle: { open: '((', close: '))' },
  bang: { open: '))', close: '((' },
  cloud: { open: ')', close: '(' },
  hexagon: { open: '{{', close: '}}' },
};

const FORBID = /[()[\]{}"]/g;

function computeIndent(raw: string): number {
  let width = 0;
  for (const ch of raw) {
    if (ch === ' ') width += 1;
    else if (ch === '\t') width += 4;
    else break;
  }
  return width;
}

function getBranchLineRange(rawLines: string[], startLine: number): { start: number; end: number } {
  const baseIndent = computeIndent(rawLines[startLine]);
  let end = startLine + 1;
  while (end < rawLines.length) {
    const t = rawLines[end].trim();
    if (!t) {
      end++;
      continue;
    }
    if (computeIndent(rawLines[end]) > baseIndent) {
      end++;
    } else {
      break;
    }
  }
  return { start: startLine, end };
}

export function applyMindmapOp(text: string, op: TextOp): TextOpResult {
  const doc = parseMindmap(text);
  const guarded = guardOk(doc);
  if (guarded) return guarded;

  const pinRes = pinOps(text, doc, op, MINDMAP_CAPS);
  if (pinRes) return pinRes;

  const rawLines = text.split('\n');
  const rootId = doc.data?.mindmap?.root ?? (doc.nodes[0]?.id ?? '');
  const childrenMap = doc.data?.mindmap?.children ?? {};

  if (op.type === 'addNode') {
    const rootNode = doc.nodes.find((n) => n.id === rootId);
    const rootIndent = rootNode ? computeIndent(rawLines[rootNode.line]) : 2;
    const indent = ' '.repeat(rootIndent + 2);
    const id = nextId(doc, 'm');
    const shape = op.shape && DELIMITERS[op.shape] ? op.shape : 'round';
    const delim = DELIMITERS[shape] ?? DELIMITERS.round;
    const label = cleanForText(op.label, FORBID);
    const line = `${indent}${id}${delim.open}${label}${delim.close}`;

    // Append as a child of the root
    let newText = text;
    if (!newText.endsWith('\n')) newText += '\n';
    newText += `${line}\n`;
    return { text: newText, createdId: id };
  }

  if (op.type === 'addEdge') {
    const fromNode = doc.nodes.find((n) => n.id === op.from);
    if (!fromNode) return { error: MESSAGES.unknownNode(op.from) };
    const toNode = doc.nodes.find((n) => n.id === op.to);
    if (!toNode) return { error: MESSAGES.unknownNode(op.to) };

    if (op.to === rootId || op.from === op.to) {
      return { error: MESSAGES.mindmapCycle };
    }

    function isDescendant(ancestor: string, target: string): boolean {
      const chs = childrenMap[ancestor] ?? [];
      for (const ch of chs) {
        if (ch === target || isDescendant(ch, target)) return true;
      }
      return false;
    }

    if (isDescendant(op.to, op.from)) {
      return { error: MESSAGES.mindmapCycle };
    }

    const lines = textLines(text);
    const toRange = getBranchLineRange(lines, toNode.line);
    const toLines = lines.slice(toRange.start, toRange.end);
    const toIndentWidth = computeIndent(lines[toNode.line]);
    const fromIndentWidth = computeIndent(lines[fromNode.line]);

    const reindentedToLines = toLines.map((line) => {
      if (!line.trim()) return line;
      const oldIndent = computeIndent(line);
      const newIndent = fromIndentWidth + 2 + (oldIndent - toIndentWidth);
      return ' '.repeat(newIndent) + line.trim();
    });

    const fromRange = getBranchLineRange(lines, fromNode.line);
    const linesWithCut: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (i >= toRange.start && i < toRange.end) continue;
      linesWithCut.push(lines[i]);
      if (i === fromRange.end - 1 && toRange.start > fromRange.end - 1) {
        linesWithCut.push(...reindentedToLines);
      }
    }
    if (toRange.start < fromRange.end) {
      let insertIdx = 0;
      let seen = 0;
      for (let i = 0; i < lines.length; i++) {
        if (i >= toRange.start && i < toRange.end) continue;
        if (i === fromRange.end - 1) {
          insertIdx = seen + 1;
          break;
        }
        seen++;
      }
      linesWithCut.splice(insertIdx, 0, ...reindentedToLines);
    }

    return { text: joinLines(linesWithCut) };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const clean = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return renameBySpan(text, node.labelSpan, clean, FORBID) ?? { error: MESSAGES.opUnsupported };
    }
    return { error: MESSAGES.opUnsupported };
  }

  if (op.type === 'setShape') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    const delim = DELIMITERS[op.shape];
    if (!delim) return { error: MESSAGES.opUnsupported };

    const raw = rawLines[node.line] ?? '';
    const trimmed = raw.trim();
    let suffix = '';
    const classMatch = /\s*:::([A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\s*$/.exec(trimmed);
    if (classMatch) {
      suffix = classMatch[0];
    }

    const m = /^([\w-]*)/.exec(trimmed);
    const explicitId = m && m[1] && m[1] === node.id ? m[1] : '';
    const clean = cleanForText(node.label, FORBID);
    const newContent = `${explicitId}${delim.open}${clean}${delim.close}${suffix}`;
    return { text: rebuildLine(text, node.line, newContent) };
  }

  if (op.type === 'deleteNode') {
    if (op.id === rootId) {
      return { error: MESSAGES.opUnsupported };
    }
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };

    const range = getBranchLineRange(rawLines, node.line);
    const linesToDelete: number[] = [];
    for (let i = range.start; i < range.end; i++) {
      linesToDelete.push(i);
    }
    return { text: deleteLines(text, linesToDelete) };
  }

  if ('id' in op) {
    const targetId = (op as { id: string }).id;
    const exists = doc.nodes.some((n) => n.id === targetId);
    if (!exists) return { error: MESSAGES.unknownNode(targetId) };
  }
  if ('index' in op) {
    const targetIdx = (op as { index: number }).index;
    if (targetIdx < 0 || targetIdx >= doc.edges.length) {
      return { error: MESSAGES.unknownEdge(targetIdx) };
    }
  }

  return { error: MESSAGES.opUnsupported };
}
