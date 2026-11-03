import { MESSAGES } from '../core/constants';
import type { TextOpResult } from '../core/types';

export const PIN_MARKER = '%% studio:layout v1';
export const PIN_LINE_RE =
  /^\s*%%\s*studio:pos\s+(\S+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;

export function formatPinLine(id: string, x: number, y: number): string {
  return `%% studio:pos ${id} ${Math.round(x)} ${Math.round(y)}`;
}

export function setPinInternal(
  text: string,
  id: string,
  x: number,
  y: number,
  hasNode: boolean
): TextOpResult {
  if (!hasNode) return { error: MESSAGES.unknownNode(id) };

  const lines = text.split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const pinLine = formatPinLine(id, x, y);
  const existingIdx = lines.findIndex(l => {
    const m = PIN_LINE_RE.exec(l);
    return m && m[1] === id;
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

  const trailing = text.endsWith('\n') ? '\n' : '';
  return { text: lines.join('\n') + (trailing || '\n') };
}

export function clearPinsInternal(text: string): TextOpResult {
  const lines = text.split('\n');
  const filtered = lines.filter(l => !PIN_LINE_RE.test(l) && l.trim() !== PIN_MARKER);
  while (filtered.length > 0 && filtered[filtered.length - 1].trim() === '') {
    filtered.pop();
  }
  const trailing = text.endsWith('\n') ? '\n' : '';
  return { text: filtered.join('\n') + (trailing || '\n') };
}
