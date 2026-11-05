import { expect, it } from 'vitest';
import { markerPrims } from './markers';

const T = { x: 0, y: 0 };
const U = { x: 1, y: 0 };

it('builds a hollow triangle', () => {
  expect(markerPrims('triangle', T, U)).toEqual([
    {
      type: 'poly',
      points: [
        { x: 0, y: 0 },
        { x: -14, y: 7 },
        { x: -14, y: -7 },
      ],
      closed: true,
      fill: 'background',
    },
  ]);
});

it('builds diamonds, open arrows and ER ends', () => {
  expect(markerPrims('diamondFilled', T, U)[0]).toMatchObject({
    fill: 'stroke',
    points: [
      { x: 0, y: 0 },
      { x: -10, y: 5 },
      { x: -20, y: 0 },
      { x: -10, y: -5 },
    ],
  });
  expect(markerPrims('openArrow', T, U)[0]).toMatchObject({ closed: false, fill: 'none' });
  expect(markerPrims('erOne', T, U)).toEqual([
    { type: 'poly', points: [{ x: -6, y: 7 }, { x: -6, y: -7 }], closed: false, fill: 'none' },
    { type: 'poly', points: [{ x: -11, y: 7 }, { x: -11, y: -7 }], closed: false, fill: 'none' },
  ]);
  expect(markerPrims('erZeroOrMore', T, U).find((p) => p.type === 'circle')).toEqual({
    type: 'circle',
    c: { x: -18, y: 0 },
    r: 4,
    fill: 'background',
  });
  expect(markerPrims('arrow', T, U)).toEqual([]);
});
