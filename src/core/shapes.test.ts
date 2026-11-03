import { describe, expect, it } from 'vitest';
import type { ShapeKind } from './types';
import { shapeFromName, SHAPE_SHORT } from './shapes';

describe('shapes', () => {
  it('maps every alias to a shape', () => {
    expect(shapeFromName(' DB ')).toEqual({ shape: 'cylinder', approx: false });
    expect(shapeFromName('cloud')).toEqual({ shape: 'round', approx: true });
    expect(shapeFromName('banana')).toBeNull();
    for (const k of Object.keys(SHAPE_SHORT) as ShapeKind[]) {
      expect(shapeFromName(SHAPE_SHORT[k])?.shape).toBe(k);
    }
  });
});
