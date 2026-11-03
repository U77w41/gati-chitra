import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from './parse';

describe('groups', () => {
  it('parses subgraphs and nesting', () => {
    const nested = parseMermaid(
      'flowchart TD\n  subgraph outer [Outer]\n    subgraph inner [Inner]\n      A\n    end\n    B\n  end\n  C'
    );
    expect(nested.groups).toMatchObject([
      { id: 'outer', parent: null, title: 'Outer' },
      { id: 'inner', parent: 'outer', title: 'Inner' },
    ]);
    expect(Object.fromEntries(nested.nodes.map(n => [n.id, n.group]))).toEqual({
      A: 'inner',
      B: 'outer',
      C: null,
    });
    expect(parseMermaid('flowchart TD\nsubgraph "My Title"\nA\nend').groups[0]).toMatchObject({
      id: 'group1',
      title: 'My Title',
    });
    expect(parseMermaid('flowchart TD\nsubgraph Plain Words\nA\nend').groups[0]).toMatchObject({
      id: 'Plain_Words',
      title: 'Plain Words',
    });
    expect(parseMermaid('flowchart TD\nsubgraph g1 ["Quoted"]\nA\nend').groups[0].title).toBe('Quoted');
    expect(parseMermaid('flowchart TD\nend').diagnostics).toEqual([
      { line: 2, severity: 'warning', message: MESSAGES.strayEnd },
    ]);
    expect(parseMermaid('flowchart TD\nsubgraph g\nA').diagnostics).toEqual([
      { line: 2, severity: 'warning', message: MESSAGES.unclosedGroup('g') },
    ]);
    expect(parseMermaid('flowchart TD\nsubgraph g\ndirection LR\nA\nend').groups[0].direction).toBe('LR');
    const deep = 'flowchart TD\n' + 'subgraph a\n'.repeat(5) + 'X\n' + 'end\n'.repeat(5);
    expect(parseMermaid(deep)).toMatchObject({ ok: false });
    expect(parseMermaid(deep).diagnostics.map(d => d.message)).toContain(MESSAGES.groupTooDeep);
  });

  it('renames a repeated subgraph id', () => {
    const d = parseMermaid('flowchart TD\nsubgraph X\nsubgraph X\nA\nend\nend');
    expect(d.groups.map(g => g.id)).toEqual(['X', 'X_2']);
    expect(d.diagnostics).toContainEqual({ line: 3, severity: 'warning', message: MESSAGES.duplicateGroupId('X', 'X_2') });
  });

  it('does not let a quoted title reuse an id', () => {
    const d = parseMermaid('flowchart TD\nsubgraph group2\nA\nend\nsubgraph "T"\nB\nend');
    expect(new Set(d.groups.map(g => g.id)).size).toBe(2);
  });
});
