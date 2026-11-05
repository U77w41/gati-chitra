import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import type { Diagnostic as CmDiagnostic } from '@codemirror/lint';
import type { Text } from '@codemirror/state';
import { tags } from '@lezer/highlight';
import type { Diagnostic } from '../core/types';
import { HEADER_PATTERNS } from '../diagrams/kinds';

export type TokenType =
  | 'keyword'
  | 'operator'
  | 'string'
  | 'comment'
  | 'bracket'
  | 'id'
  | 'property';

export interface Token {
  from: number;
  to: number;
  type: TokenType;
}

const KEYWORDS = new Set([
  'flowchart', 'graph', 'subgraph', 'end', 'direction',
  'classDef', 'class', 'style', 'linkStyle', 'click',
  'accTitle', 'accDescr', 'TB', 'TD', 'BT', 'RL', 'LR', 'default',
]);

const OTHER_KEYWORDS = new Set(
  'sequenceDiagram classDiagram classDiagram-v2 stateDiagram stateDiagram-v2 erDiagram requirementDiagram usecase-beta architecture-beta block block-beta gitGraph journey timeline mindmap participant actor as activate deactivate Note note over left right of loop alt else opt par and critical option break rect box end autonumber title class namespace direction classDef style cssClass state requirement functionalRequirement interfaceRequirement performanceRequirement physicalRequirement designConstraint element contains copies derives satisfies verifies refines traces systemBoundary group service junction in columns space commit branch checkout switch merge cherry-pick id type tag order section accTitle accDescr TB TD BT RL LR'.split(' ')
);

const OPERATOR_REGEXES = [
  /^:::/, /^&/, /^<-\.+->/, /^<={2,}>/, /^o-{2,}o/, /^x-{2,}x/,
  /^~{3,}/, /^<-{2,}>/, /^o-{2,}/, /^x-{2,}/, /^-{2,}o/, /^-{2,}x/,
  /^-\.+->/, /^-\.+-/, /^={2,}>/, /^={2,}/, /^-{2,}>/, /^-{2,}/,
];

const OTHER_OPERATORS = [
  /^<<-->>/, /^<<->>/, /^-->>/, /^->>/, /^--x/, /^-x/, /^--\)/, /^-\)/,
  /^<\|--/, /^--\|>/, /^<\|\.\./, /^\.\.\|>/, /^\*--/, /^--\*/, /^o--/, /^--o/,
  /^\.\.>/, /^<\.\./, /^[|}][o|](?:--|\.\.)[o|][|{]/, /^<?-->?/, /^\.\./,
  /^->/, /^<-/, /^:/,
];

const BRACKET_PAIRS = [
  { open: '(((', close: ')))' }, { open: '[[', close: ']]' },
  { open: '[(', close: ')]' }, { open: '([', close: '])' },
  { open: '((', close: '))' }, { open: '{{', close: '}}' },
  { open: '[/', close: '/]' }, { open: '[/', close: '\\]' },
  { open: '[\\', close: '\\]' }, { open: '[\\', close: '/]' },
  { open: '[', close: ']' }, { open: '(', close: ')' },
  { open: '{', close: '}' }, { open: '>', close: ']' },
];

const TOKEN_NAMES: Record<TokenType, string> = {
  keyword: 'keyword',
  operator: 'operator',
  string: 'string',
  comment: 'comment',
  bracket: 'bracket',
  id: 'variableName',
  property: 'propertyName',
};

export function tokenizeLine(
  line: string,
  mode: 'flowchart' | 'other' = 'flowchart',
): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let firstKeyword: string | null = null;
  let styleIdCount = 0;
  const kwSet = mode === 'other' ? OTHER_KEYWORDS : KEYWORDS;
  const opList = mode === 'other' ? [...OTHER_OPERATORS, ...OPERATOR_REGEXES] : OPERATOR_REGEXES;

  while (pos < line.length) {
    if (/\s/.test(line[pos])) {
      pos++;
      continue;
    }

    if (line.startsWith('%%', pos)) {
      tokens.push({ from: pos, to: line.length, type: 'comment' });
      break;
    }

    if (
      firstKeyword &&
      (firstKeyword === 'classDef' || firstKeyword === 'style' || firstKeyword === 'linkStyle') &&
      styleIdCount >= 1
    ) {
      const commentIdx = line.indexOf('%%', pos);
      const propEnd = commentIdx === -1 ? line.length : commentIdx;
      const text = line.slice(pos, propEnd).trimEnd();
      if (text.length > 0) {
        tokens.push({ from: pos, to: pos + text.length, type: 'property' });
        pos = propEnd;
        continue;
      }
    }

    if (line.startsWith('@{', pos)) {
      tokens.push({ from: pos, to: pos + 2, type: 'bracket' });
      const closeIdx = line.indexOf('}', pos + 2);
      if (closeIdx !== -1) {
        const body = line.slice(pos + 2, closeIdx);
        const matchLead = /^\s*/.exec(body)![0].length;
        const matchTrail = /\s*$/.exec(body)![0].length;
        const from = pos + 2 + matchLead;
        const to = closeIdx - matchTrail;
        if (to > from) tokens.push({ from, to, type: 'property' });
        tokens.push({ from: closeIdx, to: closeIdx + 1, type: 'bracket' });
        pos = closeIdx + 1;
      } else {
        pos += 2;
      }
      continue;
    }

    let bracketMatched = false;
    for (const bp of BRACKET_PAIRS) {
      if (line.startsWith(bp.open, pos)) {
        const closeIdx = line.indexOf(bp.close, pos + bp.open.length);
        if (closeIdx !== -1) {
          tokens.push({ from: pos, to: pos + bp.open.length, type: 'bracket' });
          if (closeIdx > pos + bp.open.length) {
            tokens.push({ from: pos + bp.open.length, to: closeIdx, type: 'string' });
          }
          tokens.push({ from: closeIdx, to: closeIdx + bp.close.length, type: 'bracket' });
          pos = closeIdx + bp.close.length;
          bracketMatched = true;
          break;
        }
      }
    }
    if (bracketMatched) continue;

    if (line[pos] === '|') {
      const nextPipe = line.indexOf('|', pos + 1);
      if (nextPipe !== -1) {
        tokens.push({ from: pos, to: nextPipe + 1, type: 'string' });
        pos = nextPipe + 1;
        continue;
      }
    }

    if (line[pos] === '"') {
      const match = /^"([^"\\]|\\.)*"/.exec(line.slice(pos));
      if (match) {
        tokens.push({ from: pos, to: pos + match[0].length, type: 'string' });
        pos += match[0].length;
        continue;
      }
    }

    let opMatched = false;
    for (const r of opList) {
      const m = r.exec(line.slice(pos));
      if (m) {
        tokens.push({ from: pos, to: pos + m[0].length, type: 'operator' });
        pos += m[0].length;
        opMatched = true;
        break;
      }
    }
    if (opMatched) continue;

    const idMatch = /^[\p{L}\p{N}_]+(?:-[\p{L}\p{N}_]+)*/u.exec(line.slice(pos));
    if (idMatch) {
      const text = idMatch[0];
      const isKw = kwSet.has(text);
      if (!firstKeyword && isKw) firstKeyword = text;
      if (!isKw && firstKeyword) styleIdCount++;
      tokens.push({ from: pos, to: pos + text.length, type: isKw ? 'keyword' : 'id' });
      pos += text.length;
      continue;
    }

    pos++;
  }
  return tokens;
}

export const mermaidLanguage: StreamLanguage<unknown> = StreamLanguage.define<{
  tokens: Token[];
  index: number;
  mode: 'flowchart' | 'other';
}>({
  startState() {
    return { tokens: [], index: 0, mode: 'flowchart' };
  },
  token(stream, state) {
    if (stream.pos === 0) {
      const trimmed = stream.string.trim();
      for (const [kind, pattern] of HEADER_PATTERNS) {
        if (pattern.test(trimmed)) {
          state.mode = kind === 'flowchart' ? 'flowchart' : 'other';
          break;
        }
      }
      state.tokens = tokenizeLine(stream.string, state.mode);
      state.index = 0;
    }
    while (state.index < state.tokens.length) {
      const tok = state.tokens[state.index];
      if (stream.pos < tok.from) {
        stream.pos = tok.from;
        return null;
      }
      if (stream.pos >= tok.to) {
        state.index++;
        continue;
      }
      stream.pos = tok.to;
      state.index++;
      return TOKEN_NAMES[tok.type];
    }
    stream.skipToEnd();
    return null;
  },
  tokenTable: {
    keyword: tags.keyword,
    operator: tags.operator,
    string: tags.string,
    comment: tags.comment,
    bracket: tags.bracket,
    variableName: tags.variableName,
    propertyName: tags.propertyName,
  },
});

export const mermaidHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--hl-keyword)' },
  { tag: tags.operator, color: 'var(--hl-operator)' },
  { tag: tags.string, color: 'var(--hl-string)' },
  { tag: tags.comment, color: 'var(--hl-comment)' },
  { tag: tags.bracket, color: 'var(--hl-bracket)' },
  { tag: tags.variableName, color: 'var(--hl-id)' },
  { tag: tags.propertyName, color: 'var(--hl-property)' },
]);

export const mermaidHighlighting = syntaxHighlighting(mermaidHighlightStyle);

export { defaultKeymap } from '@codemirror/commands';
export { lintGutter, setDiagnostics } from '@codemirror/lint';

export function toCmDiagnostics(
  doc: Text,
  diags: Diagnostic[]
): CmDiagnostic[] {
  return diags.map((d) => {
    const lineNum = Math.max(1, Math.min(d.line, doc.lines));
    const line = doc.line(lineNum);
    return {
      from: line.from,
      to: line.to,
      severity: d.severity,
      message: d.message,
    };
  });
}
