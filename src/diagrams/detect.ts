import type { DiagramKind } from '../core/types';
import { HEADER_PATTERNS, KIND_NAMES, UNSUPPORTED_HEADERS } from './kinds';

export interface Detected {
  kind: DiagramKind | 'unsupported' | 'unknown';
  headerIdx: number;
  name: string;
}

export function detectKind(text: string): Detected {
  const lines = text.split(/\r\n|\r|\n/);
  let idx = 0;

  // 1. Skip leading blank lines
  while (idx < lines.length && lines[idx].trim() === '') {
    idx++;
  }

  // 2. Check for front matter
  if (idx < lines.length && lines[idx].trim() === '---') {
    let closing = -1;
    for (let j = idx + 1; j < lines.length; j++) {
      if (lines[j].trim() === '---') {
        closing = j;
        break;
      }
    }
    if (closing !== -1) {
      idx = closing + 1;
    }
  }

  // 3. Skip blank lines and comment lines (%%)
  while (idx < lines.length) {
    const trimmed = lines[idx].trim();
    if (trimmed === '' || trimmed.startsWith('%%')) {
      idx++;
      continue;
    }
    break;
  }

  // 4. Header line
  if (idx >= lines.length) {
    return { kind: 'unknown', headerIdx: -1, name: '' };
  }

  const headerLine = lines[idx].trim();

  for (const [kind, pattern] of HEADER_PATTERNS) {
    if (pattern.test(headerLine)) {
      return { kind, headerIdx: idx, name: KIND_NAMES[kind] };
    }
  }

  for (const [pattern, name] of UNSUPPORTED_HEADERS) {
    if (pattern.test(headerLine)) {
      return { kind: 'unsupported', headerIdx: idx, name };
    }
  }

  return { kind: 'unknown', headerIdx: idx, name: '' };
}
