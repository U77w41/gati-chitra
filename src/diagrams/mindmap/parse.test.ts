import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseMindmap } from './parse';

const T = `mindmap
  root((Origins))
    A[Long history]
      A1
    B(Popular)
    C)Cloud(
    D`;

describe('parseMindmap', () => {
  it('reads the tree, shapes and branch colours', () => {
    const d = parseMindmap(T);
    expect(d).toMatchObject({ kind: 'mindmap', ok: true });
    expect(d.nodes.map((n) => [n.id, n.shape, n.label, n.colorIndex])).toEqual([
      ['root', 'circle', 'Origins', undefined],
      ['A', 'rect', 'Long history', 0],
      ['m1', 'round', 'A1', 0],
      ['B', 'round', 'Popular', 1],
      ['C', 'cloud', 'Cloud', 2],
      ['m2', 'round', 'D', 3],
    ]);
    expect(d.edges.map((e) => [e.from, e.to])).toEqual([
      ['root', 'A'],
      ['A', 'm1'],
      ['root', 'B'],
      ['root', 'C'],
      ['root', 'm2'],
    ]);
    expect(d.data!.mindmap!.parent).toEqual({
      root: null,
      A: 'root',
      m1: 'A',
      B: 'root',
      C: 'root',
      m2: 'root',
    });
  });

  it('refuses a second root', () => {
    expect(parseMindmap('mindmap\n  a\n  b').diagnostics).toContainEqual({
      line: 3,
      severity: 'error',
      message: MESSAGES.mindmapTwoRoots,
    });
  });
});
