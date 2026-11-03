import { Text } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { toCmDiagnostics, tokenizeLine } from './mermaid-lang';

const types = (l: string) => tokenizeLine(l).map((t) => t.type);

describe('mermaid-lang', () => {
  it('tokenizes', () => {
    expect(tokenizeLine('flowchart TD')).toEqual([
      { from: 0, to: 9, type: 'keyword' },
      { from: 10, to: 12, type: 'keyword' },
    ]);
    expect(tokenizeLine('%% note')).toEqual([
      { from: 0, to: 7, type: 'comment' },
    ]);
    expect(types('A[Start] --> B')).toEqual([
      'id',
      'bracket',
      'string',
      'bracket',
      'operator',
      'id',
    ]);
    expect(types('A -->|yes| B')).toEqual(['id', 'operator', 'string', 'id']);
    expect(types('classDef hot fill:#f00')).toEqual([
      'keyword',
      'id',
      'property',
    ]);
  });

  it('tokenizes props in @{} and various bracket shapes', () => {
    expect(types('A@{ shape: doc, label: "Start" }')).toEqual([
      'id',
      'bracket',
      'property',
      'bracket',
    ]);
    expect(types('A((Round)) & B:::hot')).toEqual([
      'id',
      'bracket',
      'string',
      'bracket',
      'operator',
      'id',
      'operator',
      'id',
    ]);
  });

  it('maps diagnostics to whole lines', () => {
    expect(
      toCmDiagnostics(Text.of(['a', 'bb']), [
        { line: 2, severity: 'warning', message: 'm' },
      ])
    ).toEqual([{ from: 2, to: 4, severity: 'warning', message: 'm' }]);
  });
});
