import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import { drawActorFigure, extraShapePath, svgActorFigure } from './shapes-new';

const box = { id: 'A', center: { x: 50, y: 40 }, width: 40, height: 80, lines: ['User'] };

it('draws the actor figure with a head of radius 8', () => {
  const { ctx, calls } = createRecordingContext();
  drawActorFigure(ctx, box, '#000', 2);
  expect(calls).toContainEqual({ name: 'arc', args: [50, 10, 8, 0, 2 * Math.PI] });
  expect(svgActorFigure(box, '#000', 2)).toContain('<circle');
});

it('writes SVG paths for the note and the cloud', () => {
  expect(extraShapePath({ ...box, width: 100, height: 40 }, 'note')).toMatch(/^M /);
  expect(extraShapePath({ ...box, width: 100, height: 40 }, 'cloud')).toContain('Q ');
});
