import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import type { Decoration } from '../core/types';
import { THEMES } from './themes';
import { drawDecorations, svgDecorations } from './decorations';

const decs: Decoration[] = [
  { kind: 'line', role: 'lifeline', from: { x: 0, y: 0 }, to: { x: 0, y: 100 } },
  { kind: 'rect', role: 'frame', rect: { x: 0, y: 0, width: 100, height: 50 }, radius: 4, label: 'loop [Every minute]' },
  { kind: 'text', role: 'caption', at: { x: 5, y: 5 }, text: '1', align: 'center', bold: true },
];

it('draws lifelines dashed and frame labels on canvas', () => {
  const { ctx, calls } = createRecordingContext();
  drawDecorations(ctx, decs, THEMES.daylight);
  expect(calls).toContainEqual({ name: 'setLineDash', args: [[4, 4]] });
  expect(calls).toContainEqual({ name: 'fillText', args: ['loop [Every minute]', 8, 14] });
  expect(calls.filter((c) => c.name === 'save').length).toBe(calls.filter((c) => c.name === 'restore').length);
});

it('writes the same decorations in SVG', () => {
  const svg = svgDecorations(decs, THEMES.daylight);
  expect(svg).toContain('stroke-dasharray="4 4"');
  expect(svg).toContain('loop [Every minute]');
});
