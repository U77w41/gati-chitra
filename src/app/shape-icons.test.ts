import { describe, it, expect } from 'vitest';
import { SHAPE_NAMES } from '../core/shapes';
import type { ExtraShapeKind, ShapeKind } from '../core/types';
import { shapeIcon } from './shape-icons';

const EXTRA: ExtraShapeKind[] = ['note', 'actor', 'ellipse', 'cloud', 'bang', 'blockArrow'];
const ALL: ShapeKind[] = [...(Object.keys(SHAPE_NAMES) as ShapeKind[]), ...EXTRA];

describe('shapeIcon', () => {
  it('draws a decorative, theme-coloured icon for every shape a diagram can add', () => {
    for (const shape of ALL) {
      const svg = shapeIcon(shape);
      expect(svg.startsWith('<svg'), shape).toBe(true);
      expect(svg, shape).toContain('aria-hidden="true"');
      expect(svg, shape).toContain('currentColor');
      expect(svg, shape).not.toContain('class="shape-icon-fallback"');
    }
  });

  it('gives each shape its own drawing', () => {
    const drawings = ALL.map((s) => shapeIcon(s));
    expect(new Set(drawings).size).toBe(ALL.length);
  });

  it('falls back to a plain box for a shape it does not know', () => {
    expect(shapeIcon('somethingNew')).toContain('class="shape-icon-fallback"');
  });
});
