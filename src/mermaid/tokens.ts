import { LIMITS } from '../core/constants';
import type { ShapeKind } from '../core/types';

export interface NodeRef {
  id: string;
  label: string | null;
  shape: ShapeKind | null;
  className: string | null;
}

export const SHAPE_TABLE: { open: string; close: string; shape: ShapeKind }[] = [
  { open: '[[', close: ']]', shape: 'subroutine' },
  { open: '[(', close: ')]', shape: 'cylinder' },
  { open: '[/', close: '/]', shape: 'parallelogram' },
  { open: '[\\', close: '\\]', shape: 'parallelogramAlt' },
  { open: '([', close: '])', shape: 'stadium' },
  { open: '((', close: '))', shape: 'circle' },
  { open: '{{', close: '}}', shape: 'hexagon' },
  { open: '[', close: ']', shape: 'rect' },
  { open: '(', close: ')', shape: 'round' },
  { open: '{', close: '}', shape: 'diamond' },
];

export function cleanLabel(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/#quot;/g, '"');
  return cleaned.slice(0, LIMITS.maxLabelChars);
}

export function readNodeRef(s: string, pos: number): { ref: NodeRef; end: number } | null {
  const idRegex = /[A-Za-z0-9_]+/y;
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
    const classRegex = /:::([A-Za-z0-9_]+)/y;
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
