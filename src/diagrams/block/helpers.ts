import type { BlockItem } from '../../core/diagram-types';
import type { BlockArrowDir, GraphNode, Span } from '../../core/types';
import { matchBracketShape, readBracketLabel } from '../../mermaid/props';
import { makeNode } from '../common/prelude';
import { BLOCK_ARROW_RE, SPACE_RE } from './patterns';

export interface RawToken {
  text: string;
  from: number;
  to: number;
}

export function scanLineTokens(raw: string): RawToken[] {
  const tokens: RawToken[] = [];
  let i = 0;
  const n = raw.length;

  while (i < n) {
    while (i < n && /\s/.test(raw[i])) i++;
    if (i >= n) break;

    const start = i;
    let inQuote = false;
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let angleDepth = 0;

    while (i < n) {
      const ch = raw[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (!inQuote) {
        if (ch === '(') parenDepth++;
        else if (ch === ')') { if (parenDepth > 0) parenDepth--; }
        else if (ch === '[') bracketDepth++;
        else if (ch === ']') { if (bracketDepth > 0) bracketDepth--; }
        else if (ch === '{') braceDepth++;
        else if (ch === '}') { if (braceDepth > 0) braceDepth--; }
        else if (ch === '<') angleDepth++;
        else if (ch === '>') { if (angleDepth > 0) angleDepth--; }
        else if (
          /\s/.test(ch) &&
          parenDepth === 0 &&
          bracketDepth === 0 &&
          braceDepth === 0 &&
          angleDepth === 0
        ) {
          break;
        }
      }
      i++;
    }

    tokens.push({ text: raw.slice(start, i), from: start, to: i });
  }

  return tokens;
}

export function parseItemToken(
  tok: RawToken,
  lineIdx: number,
  groupId: string | null,
): { item: BlockItem; node: GraphNode | null } | null {
  const spaceMatch = SPACE_RE.exec(tok.text);
  if (spaceMatch) {
    const span = spaceMatch[1] ? parseInt(spaceMatch[1], 10) : 1;
    return { item: { type: 'space', span }, node: null };
  }

  const arrowMatch = BLOCK_ARROW_RE.exec(tok.text);
  if (arrowMatch) {
    let id = arrowMatch[1];
    const classNames: string[] = [];
    const mClass = /^(.+?):::([^\s:]+)$/.exec(id);
    if (mClass) { id = mClass[1]; classNames.push(mClass[2]); }

    const label = arrowMatch[2];
    const rawDir = arrowMatch[3].trim().split(/[\s,]+/)[0];
    const validDirs = ['right', 'left', 'up', 'down', 'x', 'y'];
    const arrowDir = (validDirs.includes(rawDir) ? rawDir : 'right') as BlockArrowDir;
    const span = arrowMatch[4] ? parseInt(arrowMatch[4], 10) : 1;

    const labelIdx = tok.text.indexOf(label);
    const labelSpan: Span | undefined = labelIdx >= 0
      ? { line: lineIdx, from: tok.from + labelIdx, to: tok.from + labelIdx + label.length }
      : undefined;
    const defSpan: Span = { line: lineIdx, from: tok.from, to: tok.to };

    const node = makeNode(id, label, 'blockArrow', lineIdx, {
      group: groupId, arrowDir, labelSpan, defSpan, classNames,
    });
    return { item: { type: 'node', id, span }, node };
  }

  const firstBracket = tok.text.search(/[[({>]/);
  if (firstBracket > 0) {
    let id = tok.text.slice(0, firstBracket);
    const classNames: string[] = [];
    const mClass = /^(.+?):::([^\s:]+)$/.exec(id);
    if (mClass) { id = mClass[1]; classNames.push(mClass[2]); }

    const shapeMatch = matchBracketShape(tok.text, firstBracket);
    if (shapeMatch) {
      const labelRes = readBracketLabel(tok.text, firstBracket + shapeMatch.open.length, shapeMatch.close);
      if (labelRes) {
        const tail = tok.text.slice(labelRes.end);
        const spanMatch = /^:(\d+)$/.exec(tail);
        const span = spanMatch ? parseInt(spanMatch[1], 10) : 1;
        const label = labelRes.label ?? id;

        const openLen = shapeMatch.open.length;
        const isQuoted = tok.text[firstBracket + openLen] === '"';
        const labelStartInTok = firstBracket + openLen + (isQuoted ? 1 : 0);
        const labelLen = labelRes.label ? labelRes.label.length : 0;
        const labelSpan: Span = {
          line: lineIdx,
          from: tok.from + labelStartInTok,
          to: tok.from + labelStartInTok + labelLen,
        };
        const defSpan: Span = { line: lineIdx, from: tok.from, to: tok.to };

        const node = makeNode(id, label, shapeMatch.shape, lineIdx, {
          group: groupId, labelSpan, defSpan, markdown: Boolean(labelRes.markdown), classNames,
        });
        return { item: { type: 'node', id, span }, node };
      }
    }
  }

  const bareMatch = /^([^\s:]+)(?::(\d+))?$/.exec(tok.text);
  if (bareMatch) {
    let id = bareMatch[1];
    const classNames: string[] = [];
    const mClass = /^(.+?):::([^\s:]+)$/.exec(id);
    if (mClass) { id = mClass[1]; classNames.push(mClass[2]); }

    const span = bareMatch[2] ? parseInt(bareMatch[2], 10) : 1;
    const defSpan: Span = { line: lineIdx, from: tok.from, to: tok.to };
    const node = makeNode(id, id, 'rect', lineIdx, { group: groupId, defSpan, classNames });
    return { item: { type: 'node', id, span }, node };
  }

  return null;
}
