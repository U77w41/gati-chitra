import { expect, it } from 'vitest';
import { endLabelPoints } from './edge-extras';

it('places end labels beside each end', () => {
  const path = {
    id: 'e0',
    kind: 'straight' as const,
    from: { x: 0, y: 0 },
    to: { x: 100, y: 0 },
    control: null,
    labelPoint: { x: 50, y: 0 },
    length: 100,
  };
  expect(endLabelPoints(path, { from: '1', to: '*' })).toEqual([
    { at: { x: 18, y: 12 }, text: '1' },
    { at: { x: 82, y: 12 }, text: '*' },
  ]);
});
