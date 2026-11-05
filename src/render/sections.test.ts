import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import { drawSections, svgSections } from './sections';

const box = {
  id: 'A',
  center: { x: 56, y: 45 },
  width: 112,
  height: 90,
  lines: [],
  sections: [
    { rows: [['Animal']], align: 'center' as const, weight: 'bold' as const, divider: false, top: 0, height: 30, colX: [12] },
    { rows: [['+int age']], align: 'left' as const, weight: 'normal' as const, divider: true, top: 30, height: 30, colX: [12] },
  ],
};

it('draws dividers and left-aligned rows on canvas', () => {
  const { ctx, calls } = createRecordingContext();
  drawSections(ctx, box, { stroke: '#111', text: '#222' }, undefined);
  expect(calls).toContainEqual({ name: 'fillText', args: ['Animal', 56, 15] });
  expect(calls).toContainEqual({ name: 'fillText', args: ['+int age', 12, 45] });
  expect(calls).toContainEqual({ name: 'moveTo', args: [0, 30] });
});

it('reveals rows progressively for the typewriter', () => {
  const { ctx, calls } = createRecordingContext();
  drawSections(ctx, box, { stroke: '#111', text: '#222' }, 0.5);
  expect(calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])).toEqual(['Animal']);
});

it('writes the same rows in SVG', () => {
  const svg = svgSections(box, { stroke: '#111', text: '#222' });
  expect(svg).toContain('>Animal</text>');
  expect(svg).toContain('<line');
});
