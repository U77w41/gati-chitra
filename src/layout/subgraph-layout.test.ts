import { describe, expect, it } from 'vitest';
import { distanceToRectBorder, layoutOf, sceneOf } from '../../tests/support/scene';

describe('subgraph-layout', () => {
  it('lays out a sealed LR subgraph sideways inside a TB chart', () => {
    const l = layoutOf('flowchart TB\nsubgraph S\ndirection LR\nA --> B\nend');
    expect(Math.abs(l.nodes.A.center.y - l.nodes.B.center.y)).toBeLessThan(1);
    expect(l.nodes.A.center.x).toBeLessThan(l.nodes.B.center.x);
  });

  it('ignores the direction when an arrow leaves the subgraph', () => {
    const l = layoutOf('flowchart TB\nsubgraph S\ndirection LR\nA --> B\nend\nC --> A');
    expect(l.nodes.A.center.y).toBeLessThan(l.nodes.B.center.y);
  });

  it('keeps nodes inside their group box', () => {
    const l = layoutOf('flowchart TB\nsubgraph S\ndirection LR\nA --> B\nend\nX --> S');
    const r = l.groups.S.rect;
    for (const id of ['A', 'B']) {
      const n = l.nodes[id];
      expect(n.center.x - n.width / 2).toBeGreaterThanOrEqual(r.x);
      expect(n.center.y - n.height / 2).toBeGreaterThan(r.y);
    }
  });

  it('routes an arrow to the subgraph border', () => {
    const s = sceneOf('flowchart LR\nsubgraph S\nA\nend\nB --> S');
    expect(s.layout.nodes.S).toBeUndefined();
    expect(distanceToRectBorder(s.layout.edges.e0.to, s.layout.groups.S.rect)).toBeLessThan(0.5);
  });

  it('does not throw for an arrow to an empty subgraph', () => {
    expect(() => sceneOf('flowchart LR\nsubgraph S\nend\nB --> S')).not.toThrow();
  });
});
