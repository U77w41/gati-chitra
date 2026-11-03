import { describe, expect, it } from 'vitest';
import {
  chooseScale,
  exportFrame,
  fitToPixels,
  isEmptyBounds,
  viewForFrame,
} from './frame';

describe('frame', () => {
  it('computes exportFrame for content mode', () => {
    const f1 = exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'content', 1);
    expect(f1).toEqual({
      world: { x: -32, y: -32, width: 464, height: 264 },
      pixelWidth: 464,
      pixelHeight: 264,
      zoom: 1,
    });

    const f2 = exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'content', 2);
    expect(f2.pixelWidth).toBe(928);
    expect(f2.pixelHeight).toBe(528);
    expect(f2.zoom).toBe(2);
  });

  it('computes exportFrame for slide mode', () => {
    const sl = exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'slide', 1);
    expect(sl.pixelWidth).toBe(1280);
    expect(sl.pixelHeight).toBe(720);
    expect(sl.zoom).toBeCloseTo(2.7273, 3);
    expect(sl.world.height).toBe(264);
    expect(sl.world.width).toBeCloseTo(469.33, 1);
    expect(sl.world.x).toBeCloseTo(-34.67, 1);
    expect(sl.world.y).toBe(-32);

    const sl2 = exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'slide', 2);
    expect(sl2.pixelWidth).toBe(2560);
    expect(sl2.pixelHeight).toBe(1440);
  });

  it('computes viewForFrame', () => {
    const v = viewForFrame(
      exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'content', 2),
    );
    expect(v).toEqual({ zoom: 2, panX: 64, panY: 64 });
  });

  it('checks isEmptyBounds', () => {
    expect(isEmptyBounds({ x: 0, y: 0, width: 0, height: 0 })).toBe(true);
    expect(isEmptyBounds({ x: 0, y: 0, width: 10, height: 0 })).toBe(false);
  });

  it('computes fitToPixels', () => {
    expect(fitToPixels(3000, 2000, 2073600)).toBeCloseTo(0.5879, 4);
    expect(fitToPixels(100, 100, 2073600)).toBe(1);
  });

  it('chooses scale within limits', () => {
    expect(
      chooseScale({ x: 0, y: 0, width: 400, height: 200 }, 'content', 3),
    ).toEqual({ scale: 3, reduced: false });

    expect(
      chooseScale({ x: 0, y: 0, width: 6000, height: 6000 }, 'content', 3),
    ).toEqual({ scale: 1, reduced: true });

    const wide = chooseScale({ x: 0, y: 0, width: 9000, height: 100 }, 'content', 1);
    expect(wide.scale).toBeCloseTo(0.9, 1);
    expect(wide.reduced).toBe(true);

    expect(
      chooseScale({ x: 0, y: 0, width: 400, height: 200 }, 'slide', 3).scale,
    ).toBe(3);
  });
});
