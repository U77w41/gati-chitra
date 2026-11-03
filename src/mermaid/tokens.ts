import { LIMITS } from '../core/constants';
import type { EdgeKind, ShapeKind } from '../core/types';

export interface NodeRef {
  id: string;
  label: string | null;
  shape: ShapeKind | null;
  className: string | null;
}

export type StatementToken =
  | { type: 'node'; ref: NodeRef; start: number; end: number }
  | { type: 'edge'; kind: EdgeKind; label: string; length: number; start: number; end: number }
  | { type: 'amp'; start: number; end: number }
  | { type: 'semi'; start: number; end: number };

export const SHAPE_TABLE: { open: string; close: string; shape: ShapeKind }[] = [
  { open: '[[', close: ']]', shape: 'subroutine' }, { open: '[(', close: ')]', shape: 'cylinder' },
  { open: '[/', close: '/]', shape: 'parallelogram' }, { open: '[\\', close: '\\]', shape: 'parallelogramAlt' },
  { open: '([', close: '])', shape: 'stadium' }, { open: '((', close: '))', shape: 'circle' },
  { open: '{{', close: '}}', shape: 'hexagon' }, { open: '[', close: ']', shape: 'rect' },
  { open: '(', close: ')', shape: 'round' }, { open: '{', close: '}', shape: 'diamond' },
];

export function cleanLabel(raw: string): string {
  let cleaned = raw.trim().replace(/<br\s*\/?>/gi, '\n').replace(/#quot;/g, '"');
  return cleaned.slice(0, LIMITS.maxLabelChars);
}

export function readNodeRef(s: string, pos: number): { ref: NodeRef; end: number } | null {
  const idRegex = /[\p{L}\p{N}_]+(?:-[\p{L}\p{N}_]+)*/uy;
  idRegex.lastIndex = pos;
  const matchId = idRegex.exec(s);
  if (!matchId) return null;

  const id = matchId[0];
  const p = pos + id.length;

  let shape: ShapeKind | null = null;
  let label: string | null = null;
  let end = p;

  for (const row of SHAPE_TABLE) {
    if (s.startsWith(row.open, p)) {
      const labelStart = p + row.open.length;
      if (s[labelStart] === '"') {
        const quoteEnd = s.indexOf('"', labelStart + 1);
        if (quoteEnd === -1) return null;
        const raw = s.slice(labelStart + 1, quoteEnd);
        if (!s.startsWith(row.close, quoteEnd + 1)) return null;
        end = quoteEnd + 1 + row.close.length;
        const cleaned = cleanLabel(raw);
        label = cleaned === '' ? null : cleaned;
      } else {
        const closeIdx = s.indexOf(row.close, labelStart);
        if (closeIdx === -1) return null;
        const raw = s.slice(labelStart, closeIdx);
        end = closeIdx + row.close.length;
        const cleaned = cleanLabel(raw);
        label = cleaned === '' ? null : cleaned;
      }
      shape = row.shape;
      break;
    }
  }

  let className: string | null = null;
  if (s.startsWith(':::', end)) {
    const classRegex = /:::([\p{L}\p{N}_]+(?:-[\p{L}\p{N}_]+)*)/uy;
    classRegex.lastIndex = end;
    const matchClass = classRegex.exec(s);
    if (matchClass) {
      className = matchClass[1];
      end = classRegex.lastIndex;
    }
  }

  return {
    ref: { id, label, shape, className },
    end,
  };
}

const INLINE_OPENERS: { opener: RegExp; closers: { regex: RegExp; kind: EdgeKind }[] }[] = [
  { opener: /^--(?=\s)/, closers: [{ regex: /^-{2,}>/, kind: 'arrow' }, { regex: /^-{3,}/, kind: 'open' }] },
  { opener: /^-\.(?=\s)/, closers: [{ regex: /^\.+->/, kind: 'dottedArrow' }, { regex: /^\.+-/, kind: 'dotted' }] },
  { opener: /^==(?=\s)/, closers: [{ regex: /^={2,}>/, kind: 'thickArrow' }, { regex: /^={3,}/, kind: 'thick' }] },
];

export function computeEdgeLength(kind: EdgeKind, text: string): number {
  switch (kind) {
    case 'arrow':
    case 'bidirectional':
    case 'thickArrow':
    case 'thickBidirectional':
      return Math.max(1, (text.match(/[-=]/g) || []).length - 1);
    case 'open':
    case 'thick':
    case 'invisible':
    case 'circleEnd':
    case 'crossEnd':
    case 'circleBoth':
    case 'crossBoth':
      return Math.max(1, (text.match(/[-=~]/g) || []).length - 2);
    case 'dottedArrow':
    case 'dotted':
    case 'dottedBidirectional':
      return Math.max(1, (text.match(/\./g) || []).length);
  }
}

const OPERATORS_TABLE: { regex: RegExp; kind: EdgeKind }[] = [
  { regex: /^<-\.+->/, kind: 'dottedBidirectional' },
  { regex: /^<={2,}>/, kind: 'thickBidirectional' },
  { regex: /^o-{2,}o(?=\s)/, kind: 'circleBoth' },
  { regex: /^x-{2,}x(?=\s)/, kind: 'crossBoth' },
  { regex: /^~{3,}/, kind: 'invisible' },
  { regex: /^<-{2,}>/, kind: 'bidirectional' },
  { regex: /^-{2,}o(?=\s)/, kind: 'circleEnd' },
  { regex: /^-{2,}x(?=\s)/, kind: 'crossEnd' },
  { regex: /^-\.+->/, kind: 'dottedArrow' },
  { regex: /^-\.+-/, kind: 'dotted' },
  { regex: /^={2,}>/, kind: 'thickArrow' },
  { regex: /^={3,}/, kind: 'thick' },
  { regex: /^-{2,}>/, kind: 'arrow' },
  { regex: /^-{3,}/, kind: 'open' },
];

export function readEdgeOperator(
  s: string,
  pos: number
): { kind: EdgeKind; label: string; length: number; end: number } | null {
  while (pos < s.length && /\s/.test(s[pos])) pos++;
  if (pos >= s.length) return null;

  const rest = s.slice(pos);

  // 1. Try inline openers (Form 2)
  for (const { opener, closers } of INLINE_OPENERS) {
    if (opener.test(rest)) {
      const openerLen = 2;
      for (let cand = pos + openerLen + 1; cand < s.length; cand++) {
        if (/\s/.test(s[cand - 1])) {
          const candRest = s.slice(cand);
          for (const closer of closers) {
            const m = closer.regex.exec(candRest);
            if (m) {
              const label = s.slice(pos + openerLen, cand).trim();
              const length = computeEdgeLength(closer.kind, m[0]);
              return {
                kind: closer.kind,
                label,
                length,
                end: cand + m[0].length,
              };
            }
          }
        }
      }
      return null;
    }
  }

  // 2. Try the operator patterns
  let matchedKind: EdgeKind | null = null;
  let opLength = 1;
  let opEnd = pos;

  for (const op of OPERATORS_TABLE) {
    const m = op.regex.exec(rest);
    if (m) {
      matchedKind = op.kind;
      opLength = computeEdgeLength(op.kind, m[0]);
      opEnd = pos + m[0].length;
      break;
    }
  }

  if (!matchedKind) return null;

  // 3. Check for pipe label
  let end = opEnd;
  let label = '';
  let p = opEnd;
  while (p < s.length && /\s/.test(s[p])) p++;

  if (p < s.length && s[p] === '|') {
    let pipeEnd = -1;
    if (s[p + 1] === '"') {
      const qEnd = s.indexOf('"', p + 2);
      if (qEnd !== -1) {
        const nextPipe = s.indexOf('|', qEnd + 1);
        if (nextPipe !== -1) {
          pipeEnd = nextPipe;
        }
      }
    }
    if (pipeEnd === -1) {
      pipeEnd = s.indexOf('|', p + 1);
    }
    if (pipeEnd === -1) return null;
    label = s.slice(p + 1, pipeEnd).trim();
    if (label.startsWith('"') && label.endsWith('"') && label.length >= 2) {
      label = label.slice(1, -1);
    }
    end = pipeEnd + 1;
  }

  return {
    kind: matchedKind,
    label,
    length: opLength,
    end,
  };
}

export function scanStatement(line: string): StatementToken[] | null {
  let p = 0;
  while (p < line.length && /\s/.test(line[p])) p++;
  if (p >= line.length) return null;

  const tokens: StatementToken[] = [];
  let expectNode = true;

  while (p < line.length) {
    while (p < line.length && /\s/.test(line[p])) p++;
    if (p >= line.length) break;

    if (expectNode) {
      const res = readNodeRef(line, p);
      if (!res) return null;
      tokens.push({
        type: 'node',
        ref: res.ref,
        start: p,
        end: res.end,
      });
      p = res.end;
      while (p < line.length && /\s/.test(line[p])) p++;
      if (p < line.length && line[p] === '&') {
        tokens.push({
          type: 'amp',
          start: p,
          end: p + 1,
        });
        p++;
        expectNode = true;
      } else {
        expectNode = false;
      }
    } else {
      if (line[p] === ';') {
        tokens.push({
          type: 'semi',
          start: p,
          end: p + 1,
        });
        p++;
        while (p < line.length && /\s/.test(line[p])) p++;
        if (p < line.length) return null;
        break;
      }

      const op = readEdgeOperator(line, p);
      if (!op) return null;
      tokens.push({
        type: 'edge',
        kind: op.kind,
        label: op.label,
        length: op.length,
        start: p,
        end: op.end,
      });
      p = op.end;
      expectNode = true;
    }
  }

  if (expectNode && tokens.length > 0) return null;
  return tokens;
}
