import { LIMITS } from '../core/constants';
import type { ShapeKind } from '../core/types';

export const SHAPE_TABLE: { open: string; close: string; shape: ShapeKind }[] = [
  { open: '[[', close: ']]', shape: 'subroutine' },
  { open: '[(', close: ')]', shape: 'cylinder' },
  { open: '([', close: '])', shape: 'stadium' },
  { open: '(((', close: ')))', shape: 'doubleCircle' },
  { open: '((', close: '))', shape: 'circle' },
  { open: '{{', close: '}}', shape: 'hexagon' },
  { open: '[', close: ']', shape: 'rect' },
  { open: '(', close: ')', shape: 'round' },
  { open: '{', close: '}', shape: 'diamond' },
  { open: '>', close: ']', shape: 'asymmetric' },
];

export function matchBracketShape(s: string, p: number): { open: string; close: string; shape: ShapeKind } | null {
  if (s.startsWith('[/', p)) {
    const s1 = s.indexOf('/]', p + 2);
    const s2 = s.indexOf('\\]', p + 2);
    if (s1 === -1 && s2 === -1) return null;
    return s1 !== -1 && (s2 === -1 || s1 < s2)
      ? { open: '[/', close: '/]', shape: 'parallelogram' }
      : { open: '[/', close: '\\]', shape: 'trapezoid' };
  }
  if (s.startsWith('[\\', p)) {
    const s1 = s.indexOf('\\]', p + 2);
    const s2 = s.indexOf('/]', p + 2);
    if (s1 === -1 && s2 === -1) return null;
    return s1 !== -1 && (s2 === -1 || s1 < s2)
      ? { open: '[\\', close: '\\]', shape: 'parallelogramAlt' }
      : { open: '[\\', close: '/]', shape: 'trapezoidAlt' };
  }
  for (const row of SHAPE_TABLE) {
    if (s.startsWith(row.open, p)) return row;
  }
  return null;
}

export function decodeEntities(s: string): string {
  return s
    .replace(/#(\d+);/g, (_, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return _;
      }
    })
    .replace(/#amp;/g, '&')
    .replace(/#lt;/g, '<')
    .replace(/#gt;/g, '>')
    .replace(/#quot;/g, '"')
    .replace(/#apos;/g, "'")
    .replace(/#nbsp;/g, ' ');
}

export function cleanLabel(raw: string): string {
  let cleaned = raw.trim().replace(/<br\s*\/?>/gi, '\n').replace(/#quot;/g, '"');
  cleaned = decodeEntities(cleaned);
  return cleaned.slice(0, LIMITS.maxLabelChars);
}

export function readBracketLabel(
  s: string,
  start: number,
  close: string
): { label: string | null; markdown?: boolean; end: number } | null {
  if (s[start] === '"') {
    const qEnd = s.indexOf('"', start + 1);
    if (qEnd === -1 || !s.startsWith(close, qEnd + 1)) return null;
    const raw = s.slice(start + 1, qEnd);
    if (raw.startsWith('`') && raw.endsWith('`') && raw.length >= 2) {
      return { label: raw.slice(1, -1), markdown: true, end: qEnd + 1 + close.length };
    }
    const c = cleanLabel(raw);
    return { label: c || null, end: qEnd + 1 + close.length };
  }
  const closeIdx = s.indexOf(close, start);
  if (closeIdx === -1) return null;
  const c = cleanLabel(s.slice(start, closeIdx));
  return { label: c || null, end: closeIdx + close.length };
}

export function readProps(
  s: string,
  pos: number
): { props: Record<string, string>; end: number } | null {
  if (!s.startsWith('@{', pos)) return null;

  let inQuotes = false;
  let closeIdx = -1;

  for (let i = pos + 2; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === '}' && !inQuotes) {
      closeIdx = i;
      break;
    }
  }

  if (closeIdx === -1) return null;

  const inner = s.slice(pos + 2, closeIdx);
  const props: Record<string, string> = {};

  const entries: string[] = [];
  let curr = '';
  inQuotes = false;

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      curr += ch;
    } else if (ch === ',' && !inQuotes) {
      if (curr.trim() !== '') entries.push(curr.trim());
      curr = '';
    } else {
      curr += ch;
    }
  }
  if (curr.trim() !== '') entries.push(curr.trim());

  for (const entry of entries) {
    let colonIdx = -1;
    inQuotes = false;
    for (let i = 0; i < entry.length; i++) {
      if (entry[i] === '"') {
        inQuotes = !inQuotes;
      } else if (entry[i] === ':' && !inQuotes) {
        colonIdx = i;
        break;
      }
    }
    if (colonIdx === -1) continue;

    const key = entry.slice(0, colonIdx).trim();
    let val = entry.slice(colonIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val.slice(1, -1);
    }
    if (key) {
      props[key] = val;
    }
  }

  return { props, end: closeIdx + 1 };
}
