import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../../tests/support/measure';
import { layoutMindmap } from './layout';
import { parseMindmap } from './parse';

const T = `mindmap
  root((Origins))
    A[Long history]
      A1
    B(Popular)
    C)Cloud(
    D`;

describe('layoutMindmap', () => {
  it('puts the first half of the branches right of the root and the rest left', () => {
    const L = layoutMindmap(parseMindmap(T), testMeasure);
    const c = (id: string) => L.nodes[id].center;
    expect(c('root')).toEqual({ x: 0, y: 0 });
    expect(c('A').x).toBeGreaterThan(0);
    expect(c('B').x).toBeGreaterThan(0);
    expect(c('C').x).toBeLessThan(0);
    expect(c('m2').x).toBeLessThan(0);
    expect(c('m1').x).toBeGreaterThan(c('A').x);
    expect(c('A').y).toBeLessThan(c('B').y);
  });
});
