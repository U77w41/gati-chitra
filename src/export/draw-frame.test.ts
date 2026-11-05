import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import { createRecordingContext } from '../../tests/support/recording-context';
import { THEMES } from '../render/themes';
import { DEFAULT_ANIM } from '../anim/anim';
import { drawExportFrame } from './draw-frame';
import type { ViewState } from '../core/types';

describe('drawExportFrame', () => {
  it('draws export frame with correct order: setTransform, background, transform, node text', () => {
    const scene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure);
    const view: ViewState = { zoom: 2, panX: 5, panY: 7 };
    const { ctx, calls } = createRecordingContext(800, 600);
    drawExportFrame(ctx, scene, THEMES.daylight, DEFAULT_ANIM, view, 0, 800, 600);

    expect(calls[0]).toEqual({ name: 'setTransform', args: [1, 0, 0, 1, 0, 0] });
    expect(calls).toContainEqual({ name: 'set:fillStyle', args: ['#ffffff'] });
    expect(calls).toContainEqual({ name: 'fillRect', args: [0, 0, 800, 600] });

    const firstTranslate = calls.findIndex(
      (c) => c.name === 'translate' && c.args[0] === 5 && c.args[1] === 7,
    );
    const firstScale = calls.findIndex(
      (c) => c.name === 'scale' && c.args[0] === 2 && c.args[1] === 2,
    );
    const firstFillText = calls.findIndex((c) => c.name === 'fillText');

    expect(firstTranslate).toBeGreaterThan(-1);
    expect(firstScale).toBeGreaterThan(-1);
    expect(firstTranslate).toBeLessThan(firstFillText);
    expect(firstScale).toBeLessThan(firstFillText);

    expect(calls).toContainEqual({ name: 'fillText', args: ['A', expect.any(Number), expect.any(Number)] });
    expect(calls).toContainEqual({ name: 'fillText', args: ['B', expect.any(Number), expect.any(Number)] });

    // Grid must never be drawn in export frame
    const gridStroke = calls.find(
      (c) => c.name === 'set:strokeStyle' && c.args[0] === THEMES.daylight.gridColor,
    );
    expect(gridStroke).toBeUndefined();
  });
});
