import { describe, expect, it } from 'vitest';
import {
  fitView,
  panBy,
  screenToWorld,
  wheelFactor,
  worldToScreen,
  zoomAt,
} from './view';
import type { Point, ViewState } from '../core/types';

describe('view', () => {
  it('computes fitView for various bounds and viewports', () => {
    const fit1 = fitView({ x: 0, y: 0, width: 400, height: 200 }, { width: 1000, height: 600 }, 48);
    expect(fit1.zoom).toBeCloseTo(2.26, 2);
    expect(fit1.panX).toBeCloseTo(48, 1);
    expect(fit1.panY).toBeCloseTo(74, 1);

    const fitClamped = fitView({ x: 0, y: 0, width: 10000, height: 10000 }, { width: 1000, height: 600 });
    expect(fitClamped.zoom).toBe(0.1);

    const fitEmpty = fitView({ x: 0, y: 0, width: 0, height: 0 }, { width: 1000, height: 600 });
    expect(fitEmpty).toEqual({ zoom: 1, panX: 500, panY: 300 });
  });

  it('computes zoomAt keeping mouse point fixed in world space', () => {
    const z1 = zoomAt({ zoom: 1, panX: 0, panY: 0 }, { x: 100, y: 100 }, 2);
    expect(z1).toEqual({ zoom: 2, panX: -100, panY: -100 });

    const zMax = zoomAt({ zoom: 1, panX: 0, panY: 0 }, { x: 100, y: 100 }, 100);
    expect(zMax.zoom).toBe(4);
  });

  it('panBy translates the view correctly', () => {
    const p = panBy({ zoom: 1, panX: 10, panY: 20 }, 5, -15);
    expect(p).toEqual({ zoom: 1, panX: 15, panY: 5 });
  });

  it('inverts screen and world coordinates', () => {
    const v: ViewState = { zoom: 2.5, panX: 30, panY: -12 };
    const p: Point = { x: 77, y: 9 };
    const res = worldToScreen(v, screenToWorld(v, p));
    expect(res.x).toBeCloseTo(p.x);
    expect(res.y).toBeCloseTo(p.y);
  });

  it('computes wheelFactor correctly across delta modes', () => {
    expect(wheelFactor(100, 0)).toBeCloseTo(Math.exp(-0.2), 4);
    expect(wheelFactor(-100, 0)).toBeCloseTo(Math.exp(0.2), 4);
    expect(wheelFactor(3, 1)).toBeCloseTo(Math.exp(-48 * 0.002), 4);
    expect(wheelFactor(1, 2)).toBeCloseTo(Math.exp(-100 * 0.002), 4);
  });
});
