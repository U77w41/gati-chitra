import { describe, expect, it } from 'vitest';
import { parseBlock } from './parse';

const T = `block
  columns 3
  a["A"] b:2
  space c d
  block:grp:3
    columns 2
    e f
  end
  a --> d`;

describe('parseBlock', () => {
  it('reads items, spans, nested blocks and edges', () => {
    const d = parseBlock(T);
    expect(d).toMatchObject({ kind: 'block', ok: true });
    expect(d.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(d.groups.map((g) => [g.id, g.parent])).toEqual([['grp', null]]);
    expect(d.nodes.find((n) => n.id === 'e')!.group).toBe('grp');
    expect(d.data!.block!.columns).toBe(3);
    expect(d.data!.block!.items.map((i) => [i.type, i.span])).toEqual([
      ['node', 1],
      ['node', 2],
      ['space', 1],
      ['node', 1],
      ['node', 1],
      ['block', 3],
    ]);
    expect(d.edges[0]).toMatchObject({ from: 'a', to: 'd', kind: 'arrow', variant: '-->' });
    const s = d.nodes[1].defSpan!;
    expect(T.split('\n')[s.line].slice(s.from, s.to)).toBe('b:2');
  });

  it('reads shapes and block arrows', () => {
    const d = parseBlock('block\n  x[("DB")] y<["Go"]>(right) z((("End")))');
    expect(d.nodes.map((n) => [n.id, n.shape, n.label])).toEqual([
      ['x', 'cylinder', 'DB'],
      ['y', 'blockArrow', 'Go'],
      ['z', 'doubleCircle', 'End'],
    ]);
    expect(d.nodes[1].arrowDir).toBe('right');
  });
});
