import { describe, expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import type { NodeBox, ShapeKind } from '../core/types';
import { THEMES } from './themes';
import { drawPipelineNode } from './pipeline-cards';

const ST = { fill: '#fff', stroke: '#333', strokeWidth: 2, text: '#111' };

function drawNode(box: NodeBox, shape: ShapeKind, textProg?: number) {
  const { ctx, calls } = createRecordingContext();
  drawPipelineNode(ctx, box, shape, box.lines.join(' '), ST, false, 0, THEMES.daylight, textProg, 1);
  return calls;
}

// Pairs each label fillText with the textAlign that was in effect when it ran.
function labelTexts(calls: { name: string; args: unknown[] }[], lines: string[]) {
  let align = 'start';
  const out: { text: string; x: number; y: number; maxWidth?: number; align: string }[] = [];
  for (const c of calls) {
    if (c.name === 'set:textAlign') align = c.args[0] as string;
    if (c.name === 'fillText' && lines.some((l) => l.startsWith(c.args[0] as string))) {
      out.push({
        text: c.args[0] as string,
        x: c.args[1] as number,
        y: c.args[2] as number,
        maxWidth: c.args[3] as number | undefined,
        align,
      });
    }
  }
  return out;
}

describe('pipeline card text alignment', () => {
  it('centres every diamond label line on the diamond and keeps it inside the slanted edges', () => {
    const lines = ['MuleHunter alert in', 'Combined Alert Table', 'before complaint?'];
    const box: NodeBox = { id: 'D', center: { x: 300, y: 200 }, width: 340, height: 166, lines };
    const texts = labelTexts(drawNode(box, 'diamond'), lines);

    expect(texts.map((t) => t.text)).toEqual(lines);
    for (const t of texts) {
      expect(t.align).toBe('center');
      expect(t.x).toBe(300);
      const dy = Math.abs(t.y - box.center.y);
      const widthAtY = box.width * (1 - (2 * dy) / box.height);
      expect(t.maxWidth).toBeDefined();
      expect(t.maxWidth!).toBeLessThan(widthAtY);
    }
    const midY = (texts[0].y + texts[texts.length - 1].y) / 2;
    expect(midY).toBeGreaterThanOrEqual(box.center.y);
    expect(midY).toBeLessThan(box.center.y + 10);
  });

  it('draws each wrapped line of a card on its own row, inside the card, vertically centred', () => {
    const lines = ['F. Alerted, but Bank', 'marked it FP before', 'the complaint'];
    const box: NodeBox = { id: 'F', center: { x: 500, y: 300 }, width: 216, height: 84, lines };
    const texts = labelTexts(drawNode(box, 'rect'), lines);

    expect(texts.map((t) => t.text)).toEqual(lines);
    const left = box.center.x - box.width / 2;
    const right = box.center.x + box.width / 2;
    for (const t of texts) {
      expect(t.align).toBe('left');
      expect(t.x).toBeGreaterThan(left + 24);
      expect(t.maxWidth).toBeDefined();
      expect(t.x + t.maxWidth!).toBeLessThanOrEqual(right - 6);
    }
    const ys = texts.map((t) => t.y);
    expect(new Set(ys).size).toBe(3);
    expect(Math.abs((ys[0] + ys[2]) / 2 - box.center.y)).toBeLessThan(2);
    expect(ys[2] + 7).toBeLessThan(box.center.y + box.height / 2);
  });

  it('reveals typewriter text line by line', () => {
    const lines = ['Alpha', 'Beta'];
    const box: NodeBox = { id: 'A', center: { x: 100, y: 100 }, width: 120, height: 64, lines };
    const texts = labelTexts(drawNode(box, 'rect', 7 / 9), lines);
    expect(texts.map((t) => t.text)).toEqual(['Alpha', 'Be']);
  });
});
