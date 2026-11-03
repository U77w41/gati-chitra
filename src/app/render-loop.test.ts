import { describe, expect, it } from 'vitest';
import { shouldDraw, startRenderLoop } from './render-loop';
import { createState } from './state';
import { DEFAULT_ANIM } from '../anim/anim';

describe('render-loop', () => {
  it('does not draw while idle', () => {
    expect(shouldDraw({ dirty: false, paused: true, style: 'pulse', presenting: false })).toBe(false);
    expect(shouldDraw({ dirty: false, paused: false, style: 'off', presenting: false })).toBe(false);
    expect(shouldDraw({ dirty: true, paused: true, style: 'off', presenting: false })).toBe(true);
  });

  it('syncs canvas dimensions synchronously upon start', () => {
    const fakeCanvas = {
      width: 0,
      height: 0,
      clientWidth: 640,
      clientHeight: 480,
    } as unknown as HTMLCanvasElement;

    // mock requestAnimationFrame
    const originalRaf = globalThis.requestAnimationFrame;
    const originalCaf = globalThis.cancelAnimationFrame;
    const scope = globalThis as unknown as Record<string, unknown>;
    scope.requestAnimationFrame = () => 1;
    scope.cancelAnimationFrame = () => {};

    try {
      const stop = startRenderLoop({
        canvasEl: fakeCanvas,
        ctx: {} as unknown as CanvasRenderingContext2D,
        getState: () => createState('flowchart TD\nA-->B', { theme: 'auto', anim: DEFAULT_ANIM, split: 0.33 }),
        measure: () => 10,
        startTime: 0,
        getPausedPhase: () => 0,
      });

      expect(fakeCanvas.width).toBe(640);
      expect(fakeCanvas.height).toBe(480);
      stop();
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
      globalThis.cancelAnimationFrame = originalCaf;
    }
  });
});
