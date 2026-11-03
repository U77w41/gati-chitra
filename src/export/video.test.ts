import { describe, expect, it } from 'vitest';
import { DEFAULT_ANIM } from '../anim/anim';
import {
  probeEncoder,
  videoBitrate,
  videoPlan,
} from './video';

describe('video export planning', () => {
  it('computes video plan correctly for standard content', () => {
    const b = { x: 0, y: 0, width: 400, height: 200 }; // content frame 464 by 264
    expect(videoPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 2)).toEqual({
      width: 464,
      height: 264,
      totalFrames: 240,
      fps: 30,
      seconds: 8,
      loopsUsed: 2,
      reduced: false,
    });

    const odd = videoPlan({ x: 0, y: 0, width: 401, height: 199 }, 'content', DEFAULT_ANIM, 1);
    expect(odd.width).toBe(464);
    expect(odd.height).toBe(262);

    const huge = videoPlan({ x: 0, y: 0, width: 2936, height: 1936 }, 'content', DEFAULT_ANIM, 1);
    expect(huge.reduced).toBe(true);
    expect(huge.width % 2).toBe(0);
    expect(huge.height % 2).toBe(0);
    expect(huge.width * huge.height).toBeLessThanOrEqual(2073600);

    const longAnim = videoPlan(b, 'content', { ...DEFAULT_ANIM, speed: 0.25 }, 5);
    expect(longAnim.loopsUsed).toBe(1);
    expect(longAnim.seconds).toBe(16);
  });

  it('computes video bitrates within bounds', () => {
    expect(videoBitrate(464, 264, 30)).toBe(1000000);
    expect(videoBitrate(1920, 1080, 30)).toBe(6220800);
    expect(videoBitrate(3840, 2160, 30)).toBe(8000000);
  });

  it('probes encoder support correctly', async () => {
    // In Node: VideoEncoder does not exist
    expect(await probeEncoder(100, 100)).toBeNull();

    const only = (ok: string[]) => async (c: { codec: string }) => ({
      supported: ok.includes(c.codec),
    });

    expect(await probeEncoder(100, 100, only(['avc1.640028']))).toEqual({
      codec: 'avc',
      container: 'mp4',
    });
    expect(await probeEncoder(100, 100, only(['avc1.42001f']))).toEqual({
      codec: 'avc',
      container: 'mp4',
    });
    expect(await probeEncoder(100, 100, only(['vp09.00.40.08']))).toEqual({
      codec: 'vp9',
      container: 'webm',
    });
    expect(await probeEncoder(100, 100, only([]))).toBeNull();
    expect(
      await probeEncoder(100, 100, async () => {
        throw new Error('x');
      }),
    ).toBeNull();
  });
});
