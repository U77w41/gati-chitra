import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../../tests/support/measure';
import { parseSequence } from './parse';
import { layoutSequence } from './layout';

const L = (t: string) => layoutSequence(parseSequence(t), testMeasure);

describe('layoutSequence', () => {
  it('places columns and the first message (the Part 6.1 worked example)', () => {
    const r = L('sequenceDiagram\n  Alice->>Bob: Hello');
    expect(r.nodes.Alice.center).toEqual({ x: 50, y: 22 });
    expect(r.nodes.Bob.center).toEqual({ x: 190, y: 22 });
    expect(r.edges.e0).toMatchObject({ kind: 'straight', from: { x: 50, y: 68 }, to: { x: 190, y: 68 }, labelPoint: { x: 120, y: 56 } });
  });
  it('widens columns for long labels', () => {
    expect(L('sequenceDiagram\n  Alice->>Bob: A very long message text here').nodes.Bob.center.x).toBe(314);
  });
  it('draws activation bars and starts messages at their edge', () => {
    const r = L('sequenceDiagram\n  Alice->>+Bob: hi\n  Bob-->>-Alice: back');
    expect(r.decorations).toContainEqual({ kind: 'rect', role: 'activation', rect: { x: 185, y: 68, width: 10, height: 44 }, radius: 2 });
    expect(r.edges.e1.from).toEqual({ x: 185, y: 112 });
  });
  it('loops self messages, frames blocks and spreads notes over two columns', () => {
    expect(L('sequenceDiagram\n  A->>A: think').edges.e0).toMatchObject({ kind: 'quad', from: { x: 50, y: 68 }, to: { x: 50, y: 92 }, control: { x: 98, y: 80 } });
    const f = L('sequenceDiagram\n  A->>B: x\n  loop L\n    A->>B: y\n  end');
    expect(f.decorations).toContainEqual({ kind: 'rect', role: 'frame', rect: { x: -10, y: 112, width: 260, height: 84 }, radius: 4, label: 'loop [L]' });
    const n = L('sequenceDiagram\n  A->>B: x\n  Note over A,B: hello');
    expect(n.nodes.note1).toMatchObject({ center: { x: 120, y: 134 }, width: 180 });
  });
  it('draws a lifeline for every participant', () => {
    const r = L('sequenceDiagram\n  Alice->>Bob: Hello');
    expect(r.decorations!.filter((d) => d.role === 'lifeline')).toHaveLength(2);
  });
});
