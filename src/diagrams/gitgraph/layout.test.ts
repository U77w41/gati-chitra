import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../../tests/support/measure';
import { parseGitGraph } from './parse';
import { layoutGitGraph } from './layout';

const T = `gitGraph
  commit id: "init"
  branch develop
  commit
  commit tag: "v1"
  checkout main
  merge develop id: "m1"`;

describe('layoutGitGraph', () => {
  it('puts each branch in its own lane, in commit order', () => {
    const L = layoutGitGraph(parseGitGraph(T), testMeasure);
    expect(['c0', 'c1', 'c2', 'c3'].map((id) => L.nodes[id].center)).toEqual([
      { x: 140, y: 0 },
      { x: 200, y: 60 },
      { x: 260, y: 60 },
      { x: 320, y: 0 },
    ]);
    expect(L.edges.e0.kind).toBe('quad');
    expect(L.edges.e1.kind).toBe('straight');
    const labels = L.decorations!
      .filter((d) => d.kind === 'rect' && d.role === 'band')
      .map((d) => (d.kind === 'rect' ? d.label : ''));
    expect(labels).toEqual(['main', 'develop']);
    expect(L.decorations!.some((d) => d.kind === 'rect' && d.role === 'tag' && d.label === 'v1')).toBe(true);
    expect(L.decorations!.some((d) => d.kind === 'text' && d.text === 'init')).toBe(true);
  });
});
