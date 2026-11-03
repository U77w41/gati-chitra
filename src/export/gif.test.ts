import { describe, expect, it } from 'vitest';
import { GIFEncoder } from 'gifenc';
import { DEFAULT_ANIM } from '../anim/anim';
import { parseGif } from '../../tests/support/parse-gif';
import { gifPlan, yieldToEventLoop } from './gif';

describe('GIF export', () => {
  const b = { x: 0, y: 0, width: 400, height: 200 };

  it('computes gifPlan for various frame rates and speeds', () => {
    expect(gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 20)).toEqual({
      frames: 80,
      delayCs: 5,
      width: 464,
      height: 264,
      zoom: 1,
      reduced: false,
    });

    const p25 = gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 25);
    expect(p25.frames).toBe(100);
    expect(p25.delayCs).toBe(4);

    const p10 = gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 10);
    expect(p10.frames).toBe(40);
    expect(p10.delayCs).toBe(10);

    const pSlow = gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 0.25 }, 25);
    expect(pSlow.frames).toBe(300);
    expect(pSlow.delayCs).toBe(5);
  });

  it('reduces dimensions when bounds exceed gifMaxPixels', () => {
    const big = gifPlan({ x: 0, y: 0, width: 2936, height: 1936 }, 'content', DEFAULT_ANIM, 20);
    expect(big.reduced).toBe(true);
    expect(big.width * big.height).toBeLessThanOrEqual(2073600);
  });

  it('yields to event loop via MessageChannel', async () => {
    await expect(yieldToEventLoop()).resolves.toBeUndefined();
  });

  it('proves gifenc delay unit using parseGif', () => {
    const g = GIFEncoder();
    const palette = [
      [0, 0, 0],
      [255, 255, 255],
    ];
    const idx = new Uint8Array(16);
    g.writeFrame(idx, 4, 4, { palette, delay: 50, repeat: 0 });
    g.writeFrame(idx, 4, 4, { delay: 50 });
    g.finish();
    expect(parseGif(g.bytes())).toEqual({
      width: 4,
      height: 4,
      frames: 2,
      delays: [5, 5],
      loop: true,
    });
  });
});
