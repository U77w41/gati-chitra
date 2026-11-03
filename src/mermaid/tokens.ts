import { MESSAGES } from '../core/constants';
import { shapeFromName, SHAPE_NAMES } from '../core/shapes';
import type { EdgeKind, ShapeKind } from '../core/types';
import { computeEdgeLength } from './format';
import {
  cleanLabel,
  decodeEntities,
  matchBracketShape,
  readBracketLabel,
  readProps,
  SHAPE_TABLE,
} from './props';

export { cleanLabel, decodeEntities, SHAPE_TABLE };

export interface NodeRef {
  id: string;
  label: string | null;
  shape: ShapeKind | null;
  className: string | null;
  markdown?: boolean;
  notes?: { severity: 'warning' | 'info'; message: string }[];
}

export type StatementToken =
  | { type: 'node'; ref: NodeRef; start: number; end: number }
  | { type: 'edge'; kind: EdgeKind; label: string; length: number; markdown: boolean; ref: string | null; start: number; end: number }
  | { type: 'amp'; start: number; end: number }
  | { type: 'semi'; start: number; end: number };

export function readNodeRef(s: string, pos: number): { ref: NodeRef; end: number } | null {
  const idRegex = /[\p{L}\p{N}_]+(?:-[\p{L}\p{N}_]+)*/uy;
  idRegex.lastIndex = pos;
  const matchId = idRegex.exec(s);
  if (!matchId) return null;

  const id = matchId[0];
  const p = pos + id.length;

  let shape: ShapeKind | null = null;
  let label: string | null = null;
  let markdown = false;
  let end = p;
  let notes: { severity: 'warning' | 'info'; message: string }[] | undefined;

  if (s.startsWith('@{', p)) {
    const propRes = readProps(s, p);
    if (!propRes) return null;
    end = propRes.end;
    const nList: { severity: 'warning' | 'info'; message: string }[] = [];
    if (propRes.props.shape) {
      const sh = shapeFromName(propRes.props.shape);
      if (!sh) {
        shape = 'rect';
        nList.push({ severity: 'warning', message: MESSAGES.unknownShape(propRes.props.shape) });
      } else {
        shape = sh.shape;
        if (sh.approx) {
          nList.push({ severity: 'info', message: MESSAGES.shapeApprox(propRes.props.shape, SHAPE_NAMES[sh.shape]) });
        }
      }
    }
    if (propRes.props.icon !== undefined || propRes.props.img !== undefined) {
      shape = 'rect';
      nList.push({ severity: 'info', message: MESSAGES.iconUnsupported });
    }
    if (propRes.props.label !== undefined) {
      const rawL = propRes.props.label;
      if (rawL.startsWith('`') && rawL.endsWith('`') && rawL.length >= 2) {
        label = rawL.slice(1, -1);
        markdown = true;
      } else {
        label = cleanLabel(rawL);
      }
    }
    if (nList.length) notes = nList;
  } else {
    const matched = matchBracketShape(s, p);
    if (matched) {
      shape = matched.shape;
      const parsed = readBracketLabel(s, p + matched.open.length, matched.close);
      if (!parsed) return null;
      label = parsed.label;
      if (parsed.markdown) markdown = true;
      end = parsed.end;
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

  const ref: NodeRef = { id, label, shape, className };
  if (markdown) ref.markdown = true;
  if (notes) ref.notes = notes;

  return { ref, end };
}

const INLINE_OPENERS = [
  { opener: /^--(?=\s)/, closers: [{ regex: /^-{2,}>/, kind: 'arrow' as EdgeKind }, { regex: /^-{3,}/, kind: 'open' as EdgeKind }] },
  { opener: /^-\.(?=\s)/, closers: [{ regex: /^\.+->/, kind: 'dottedArrow' as EdgeKind }, { regex: /^\.+-/, kind: 'dotted' as EdgeKind }] },
  { opener: /^==(?=\s)/, closers: [{ regex: /^={2,}>/, kind: 'thickArrow' as EdgeKind }, { regex: /^={3,}/, kind: 'thick' as EdgeKind }] },
];

const OPERATORS_TABLE: { regex: RegExp; kind: EdgeKind }[] = [
  { regex: /^<-\.+->/, kind: 'dottedBidirectional' }, { regex: /^<={2,}>/, kind: 'thickBidirectional' },
  { regex: /^o-{2,}o(?=\s)/, kind: 'circleBoth' }, { regex: /^x-{2,}x(?=\s)/, kind: 'crossBoth' },
  { regex: /^~{3,}/, kind: 'invisible' }, { regex: /^<-{2,}>/, kind: 'bidirectional' },
  { regex: /^-{2,}o(?=\s)/, kind: 'circleEnd' }, { regex: /^-{2,}x(?=\s)/, kind: 'crossEnd' },
  { regex: /^-\.+->/, kind: 'dottedArrow' }, { regex: /^-\.+-/, kind: 'dotted' },
  { regex: /^={2,}>/, kind: 'thickArrow' }, { regex: /^={3,}/, kind: 'thick' },
  { regex: /^-{2,}>/, kind: 'arrow' }, { regex: /^-{3,}/, kind: 'open' },
];

export function readEdgeOperator(
  s: string,
  pos: number
): { kind: EdgeKind; label: string; length: number; markdown?: boolean; ref?: string | null; end: number } | null {
  while (pos < s.length && /\s/.test(s[pos])) pos++;
  if (pos >= s.length) return null;

  let rest = s.slice(pos);
  let edgeRef: string | null = null;
  const refMatch = /^([\p{L}\p{N}_]+)@(?=[-=<~ox])/u.exec(rest);
  if (refMatch) {
    edgeRef = refMatch[1];
    pos += refMatch[0].length;
    rest = s.slice(pos);
  }

  for (const { opener, closers } of INLINE_OPENERS) {
    if (opener.test(rest)) {
      const openerLen = 2;
      for (let cand = pos + openerLen + 1; cand < s.length; cand++) {
        if (/\s/.test(s[cand - 1])) {
          const candRest = s.slice(cand);
          for (const closer of closers) {
            const m = closer.regex.exec(candRest);
            if (m) {
              const rawL = s.slice(pos + openerLen, cand).trim();
              let label = rawL;
              let markdown = false;
              if (label.startsWith('`') && label.endsWith('`') && label.length >= 2) {
                label = label.slice(1, -1);
                markdown = true;
              } else {
                label = cleanLabel(label);
              }
              const length = computeEdgeLength(closer.kind, m[0]);
              const res: { kind: EdgeKind; label: string; length: number; markdown?: boolean; ref?: string | null; end: number } = {
                kind: closer.kind,
                label,
                length,
                end: cand + m[0].length,
              };
              if (markdown) res.markdown = true;
              if (edgeRef) res.ref = edgeRef;
              return res;
            }
          }
        }
      }
      return null;
    }
  }

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

  let end = opEnd;
  let label = '';
  let markdown = false;
  let p = opEnd;
  while (p < s.length && /\s/.test(s[p])) p++;

  if (p < s.length && s[p] === '|') {
    let pipeEnd = -1;
    if (s[p + 1] === '"') {
      const qEnd = s.indexOf('"', p + 2);
      if (qEnd !== -1) {
        const nextPipe = s.indexOf('|', qEnd + 1);
        if (nextPipe !== -1) pipeEnd = nextPipe;
      }
    }
    if (pipeEnd === -1) pipeEnd = s.indexOf('|', p + 1);
    if (pipeEnd === -1) return null;
    const rawL = s.slice(p + 1, pipeEnd).trim();
    if (rawL.startsWith('`') && rawL.endsWith('`') && rawL.length >= 2) {
      label = rawL.slice(1, -1);
      markdown = true;
    } else if (rawL.startsWith('"') && rawL.endsWith('"') && rawL.length >= 2) {
      const inside = rawL.slice(1, -1);
      if (inside.startsWith('`') && inside.endsWith('`') && inside.length >= 2) {
        label = inside.slice(1, -1);
        markdown = true;
      } else {
        label = cleanLabel(inside);
      }
    } else {
      label = cleanLabel(rawL);
    }
    end = pipeEnd + 1;
  }

  const res: { kind: EdgeKind; label: string; length: number; markdown?: boolean; ref?: string | null; end: number } = {
    kind: matchedKind,
    label,
    length: opLength,
    end,
  };
  if (markdown) res.markdown = true;
  if (edgeRef) res.ref = edgeRef;
  return res;
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
      tokens.push({ type: 'node', ref: res.ref, start: p, end: res.end });
      p = res.end;
      while (p < line.length && /\s/.test(line[p])) p++;
      if (p < line.length && line[p] === '&') {
        tokens.push({ type: 'amp', start: p, end: p + 1 });
        p++;
        expectNode = true;
      } else {
        expectNode = false;
      }
    } else {
      if (line[p] === ';') {
        tokens.push({ type: 'semi', start: p, end: p + 1 });
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
        markdown: op.markdown ?? false,
        ref: op.ref ?? null,
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
