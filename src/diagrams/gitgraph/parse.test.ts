import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseGitGraph } from './parse';

const T = `gitGraph
  commit id: "init"
  branch develop
  commit
  commit tag: "v1"
  checkout main
  merge develop id: "m1"`;

describe('parseGitGraph', () => {
  it('reads commits, branches and merges', () => {
    const d = parseGitGraph(T);
    expect(d).toMatchObject({ kind: 'gitgraph', ok: true });
    expect(d.nodes.map((n) => [n.id, n.shape, n.label, n.colorIndex])).toEqual([
      ['c0', 'filledCircle', 'init', 0],
      ['c1', 'filledCircle', '', 1],
      ['c2', 'filledCircle', '', 1],
      ['c3', 'doubleCircle', 'm1', 0],
    ]);
    expect(d.edges.map((e) => [e.from, e.to, e.colorIndex])).toEqual([
      ['c0', 'c1', 1],
      ['c1', 'c2', 1],
      ['c0', 'c3', 0],
      ['c2', 'c3', 1],
    ]);
    expect(d.stages).toEqual({
      nodes: { c0: 0, c1: 1, c2: 2, c3: 3 },
      edges: { e0: 1, e1: 2, e2: 3, e3: 3 },
    });
    expect(d.data!.gitgraph!.branches).toEqual([
      { name: 'main', colorIndex: 0, order: 0 },
      { name: 'develop', colorIndex: 1, order: 1 },
    ]);
    expect(d.data!.gitgraph!.commits[2].tag).toBe('v1');
  });

  it('reports bad branch commands', () => {
    expect(parseGitGraph('gitGraph\n  checkout nope').diagnostics).toContainEqual({
      line: 2,
      severity: 'error',
      message: MESSAGES.gitNoBranch('nope'),
    });
    expect(parseGitGraph('gitGraph\n  branch main').diagnostics).toContainEqual({
      line: 2,
      severity: 'error',
      message: MESSAGES.gitBranchExists('main'),
    });
    expect(parseGitGraph('gitGraph\n  commit\n  merge main').diagnostics).toContainEqual({
      line: 3,
      severity: 'error',
      message: MESSAGES.gitMergeInvalid('main'),
    });
  });
});
