import { describe, expect, it } from 'vitest';
import type { FlowShapeKind } from './types';
import { shapeFromName, SHAPE_NAMES, SHAPE_SHORT } from './shapes';

describe('shapes', () => {
  it('maps every alias to a shape', () => {
    expect(shapeFromName(' DB ')).toEqual({ shape: 'cylinder', approx: false });
    expect(shapeFromName('cloud')).toEqual({ shape: 'round', approx: true });
    expect(shapeFromName('banana')).toBeNull();
    for (const k of Object.keys(SHAPE_SHORT) as FlowShapeKind[]) {
      expect(shapeFromName(SHAPE_SHORT[k])?.shape).toBe(k);
    }
  });

  it('keeps the flowchart shape list at 20 entries', () => {
    expect(Object.keys(SHAPE_NAMES)).toHaveLength(20);
  });
});
