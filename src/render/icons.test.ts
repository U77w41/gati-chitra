import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import { drawIcon, ICON_PRIMS, svgIcon } from './icons';

it('has every icon and draws it on canvas and in SVG', () => {
  expect(Object.keys(ICON_PRIMS).sort()).toEqual(['cloud', 'cross', 'database', 'disk', 'faceHappy', 'faceNeutral', 'faceSad', 'internet', 'server']);
  const { ctx, calls } = createRecordingContext();
  drawIcon(ctx, 'disk', 50, 50, 24, '#000');
  expect(calls.filter((c) => c.name === 'arc')).toHaveLength(2);
  expect(svgIcon('database', 50, 50, 24, '#000')).toContain('<ellipse');
});
