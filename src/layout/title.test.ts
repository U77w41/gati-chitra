import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../tests/support/measure';
import { placeTitle } from './title';
describe('placeTitle', () => {
  it('adds the title band above the bounds and widens them for a long title', () => {
    const r = placeTitle({ x: 0, y: 0, width: 40, height: 100 }, 'A long title', testMeasure);
    expect(r.title).toEqual({ text: 'A long title', center: { x: 20, y: -18 } });
    expect(r.bounds).toEqual({ x: -28, y: -36, width: 96, height: 136 });
  });
  it('returns the bounds unchanged without a title', () => {
    expect(placeTitle({ x: 1, y: 2, width: 3, height: 4 }, null, testMeasure)).toEqual({ bounds: { x: 1, y: 2, width: 3, height: 4 }, title: null });
  });
});
