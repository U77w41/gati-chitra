import { expect, it } from 'vitest';
import { makeEdgePath } from './path';
import { growBounds } from './decor-bounds';

it('makes straight and curved paths with lengths', () => {
  expect(makeEdgePath('e0', { x: 0, y: 0 }, { x: 30, y: 40 }, null)).toMatchObject({ kind: 'straight', length: 50, labelPoint: { x: 15, y: 20 } });
  expect(makeEdgePath('e1', { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 }).kind).toBe('quad');
});

it('grows bounds to cover decorations', () => {
  expect(growBounds({ x: 0, y: 0, width: 10, height: 10 }, [{ kind: 'line', role: 'axis', from: { x: -5, y: 0 }, to: { x: 0, y: 30 } }])).toEqual({ x: -5, y: 0, width: 15, height: 30 });
});
