import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../../tests/support/measure';
import { layoutBlock } from './layout';
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

describe('layoutBlock', () => {
  it('fills rows of columns, spans cells and nests blocks', () => {
    const L = layoutBlock(parseBlock(T), testMeasure);
    expect(L.nodes.a.center).toEqual({ x: 40, y: 22 });
    expect(L.nodes.b).toMatchObject({ center: { x: 184, y: 22 }, width: 176 });
    expect(L.nodes.c.center).toEqual({ x: 136, y: 82 });
    expect(L.groups.grp.rect).toEqual({ x: 0, y: 120, width: 272, height: 68 });
    expect(L.nodes.e).toMatchObject({ center: { x: 70, y: 154 }, width: 116 });
  });
});
