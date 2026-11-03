import { MESSAGES } from '../core/constants';
import type { Diagnostic, Direction, SourceLine } from '../core/types';

export interface HeaderResult {
  headerIdx: number;
  direction: Direction;
  ok: boolean;
}

const HEADER_REGEX = /^\s*(flowchart|graph)(?:\s+(TB|TD|BT|RL|LR))?\s*;?\s*$/;

export function parseHeader(
  rawLines: string[],
  lines: SourceLine[],
  diagnostics: Diagnostic[],
): HeaderResult {
  let first = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].trim() !== '') {
      first = i;
      break;
    }
  }

  let step4Start = first === -1 ? 0 : first;
  if (first !== -1 && rawLines[first].trim() === '---') {
    let closeFm = -1;
    for (let i = first + 1; i < rawLines.length; i++) {
      if (rawLines[i].trim() === '---') {
        closeFm = i;
        break;
      }
    }
    if (closeFm !== -1) {
      for (let i = first; i <= closeFm; i++) {
        lines[i].kind = 'frontmatter';
      }
      step4Start = closeFm + 1;
    }
  }

  let headerIdx = -1;
  let direction: Direction = 'TB';

  for (let i = step4Start; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (trimmed === '') continue;
    if (trimmed.startsWith('%%{')) {
      lines[i].kind = 'directive';
      continue;
    }
    if (trimmed.startsWith('%%')) {
      lines[i].kind = 'comment';
      continue;
    }

    const match = HEADER_REGEX.exec(trimmed);
    if (match) {
      lines[i].kind = 'header';
      const dirMatch = match[2];
      direction = dirMatch === 'TD' || !dirMatch ? 'TB' : (dirMatch as Direction);
      headerIdx = i;
      break;
    } else {
      diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.notFlowchart });
      for (let j = i; j < rawLines.length; j++) lines[j].kind = 'unknown';
      return { headerIdx: -1, direction: 'TB', ok: false };
    }
  }

  if (headerIdx === -1) {
    diagnostics.push({ line: 1, severity: 'error', message: MESSAGES.notFlowchart });
    return { headerIdx: -1, direction: 'TB', ok: false };
  }

  return { headerIdx, direction, ok: true };
}
