import { describe, expect, it } from 'vitest';
import { edgeCycle, nextNodeInDirection } from './keyboard-nav';
import { announceSelection } from '../app/describe';
import { parseMermaid } from '../mermaid/parse';
import { sceneOf } from '../../tests/support/scene';
import type { NodeBox, SceneLayout } from '../core/types';

describe('keyboard navigation', () => {
  const order: string[] = [];
  const nodes: Record<string, NodeBox> = {};
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const id = `r${r}c${c}`;
      order.push(id);
      nodes[id] = {
        id,
        center: { x: c * 100, y: r * 100 },
        width: 80,
        height: 40,
        lines: [id],
      };
    }
  }

  const grid: SceneLayout = {
    nodes,
    groups: {},
    edges: {},
    bounds: { x: 0, y: 0, width: 300, height: 300 },
    title: null,
  };

  it('moves in a direction', () => {
    expect(nextNodeInDirection(grid, order, 'r1c1', 'right')).toBe('r1c2');
    expect(nextNodeInDirection(grid, order, 'r2c0', 'up')).toBe('r1c0');
    expect(nextNodeInDirection(grid, order, null, 'down')).toBe('r0c0');
    expect(nextNodeInDirection(grid, order, 'r0c2', 'right')).toBe('r0c2');
  });

  it('announces', () => {
    const d = parseMermaid('flowchart TD\nA[Start] --> B\nB -->|yes| C');
    expect(announceSelection(d, { kind: 'node', id: 'A' })).toBe('Node A, Start, Rectangle. 0 in, 1 out.');
    expect(announceSelection(d, { kind: 'edge', id: 'e1' })).toBe('Arrow from B to C, yes.');
    expect(announceSelection(d, null)).toBe('No selection.');
  });

  it('cycles arrows', () => {
    const d = parseMermaid('flowchart TD\nA --> B\nB --> C\nC --> A');
    expect(edgeCycle(d, 'B', null, 1)).toBe(0);
    expect(edgeCycle(d, 'B', 1, 1)).toBe(0);
    expect(edgeCycle(d, 'B', 0, -1)).toBe(1);
  });

  it('moves on approval template', () => {
    const text = 'flowchart TD\n  A[Start] --> B{Valid?}\n  B -->|yes| C[Save]\n  B -->|no| D[Fix input]\n  D --> B\n  C --> E([Done])';
    const s = sceneOf(text);
    const order = s.doc.nodes.map((n) => n.id);
    const next1 = nextNodeInDirection(s.layout, order, null, 'down');
    expect(next1).toBe('A');
    const next2 = nextNodeInDirection(s.layout, order, 'A', 'down');
    expect(next2).toBe('B');
  });
});
