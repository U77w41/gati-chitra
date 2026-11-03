import { LAYOUT } from '../core/constants';
import type { NodeBox, ParsedDoc, Point, ShapeKind } from '../core/types';

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function shapePolygon(box: NodeBox, shape: ShapeKind): Point[] | null {
  const cx = box.center.x;
  const cy = box.center.y;
  const w = box.width;
  const h = box.height;
  const i = LAYOUT.hexagonInset;
  const s = LAYOUT.parallelogramSkew;

  switch (shape) {
    case 'diamond':
      return [
        { x: cx, y: cy - h / 2 },
        { x: cx + w / 2, y: cy },
        { x: cx, y: cy + h / 2 },
        { x: cx - w / 2, y: cy },
      ];
    case 'hexagon':
      return [
        { x: cx - w / 2 + i, y: cy - h / 2 },
        { x: cx + w / 2 - i, y: cy - h / 2 },
        { x: cx + w / 2, y: cy },
        { x: cx + w / 2 - i, y: cy + h / 2 },
        { x: cx - w / 2 + i, y: cy + h / 2 },
        { x: cx - w / 2, y: cy },
      ];
    case 'parallelogram':
      return [
        { x: cx - w / 2 + s, y: cy - h / 2 },
        { x: cx + w / 2, y: cy - h / 2 },
        { x: cx + w / 2 - s, y: cy + h / 2 },
        { x: cx - w / 2, y: cy + h / 2 },
      ];
    case 'parallelogramAlt':
      return [
        { x: cx - w / 2, y: cy - h / 2 },
        { x: cx + w / 2 - s, y: cy - h / 2 },
        { x: cx + w / 2, y: cy + h / 2 },
        { x: cx - w / 2 + s, y: cy + h / 2 },
      ];
    case 'trapezoid': {
      const ti = LAYOUT.trapezoidInset;
      return [
        { x: cx - w / 2 + ti, y: cy - h / 2 },
        { x: cx + w / 2 - ti, y: cy - h / 2 },
        { x: cx + w / 2, y: cy + h / 2 },
        { x: cx - w / 2, y: cy + h / 2 },
      ];
    }
    case 'trapezoidAlt': {
      const ti = LAYOUT.trapezoidInset;
      return [
        { x: cx - w / 2, y: cy - h / 2 },
        { x: cx + w / 2, y: cy - h / 2 },
        { x: cx + w / 2 - ti, y: cy + h / 2 },
        { x: cx - w / 2 + ti, y: cy + h / 2 },
      ];
    }
    case 'asymmetric': {
      const notch = LAYOUT.asymmetricNotch;
      return [
        { x: cx - w / 2, y: cy - h / 2 },
        { x: cx + w / 2, y: cy - h / 2 },
        { x: cx + w / 2, y: cy + h / 2 },
        { x: cx - w / 2, y: cy + h / 2 },
        { x: cx - w / 2 + notch, y: cy },
      ];
    }
    default:
      return null;
  }
}

export function borderPoint(box: NodeBox, shape: ShapeKind, toward: Point): Point {
  const c = box.center;
  const d = { x: toward.x - c.x, y: toward.y - c.y };
  if (d.x === 0 && d.y === 0) {
    return { x: c.x, y: c.y };
  }

  if (
    shape === 'circle' ||
    shape === 'doubleCircle' ||
    shape === 'smallCircle' ||
    shape === 'filledCircle' ||
    shape === 'framedCircle'
  ) {
    const len = Math.hypot(d.x, d.y);
    return {
      x: c.x + (d.x / len) * (box.width / 2),
      y: c.y + (d.y / len) * (box.width / 2),
    };
  }

  const poly = shapePolygon(box, shape);
  if (poly !== null) {
    let bestT = Infinity;
    for (let k = 0; k < poly.length; k++) {
      const v1 = poly[k];
      const v2 = poly[(k + 1) % poly.length];
      const e = { x: v2.x - v1.x, y: v2.y - v1.y };
      const den = cross(d, e);
      if (den === 0) continue;
      const v1MinusC = { x: v1.x - c.x, y: v1.y - c.y };
      const t = cross(v1MinusC, e) / den;
      const s = cross(v1MinusC, d) / den;
      if (t > 0 && s >= 0 && s <= 1 && t < bestT) {
        bestT = t;
      }
    }
    if (bestT !== Infinity) {
      return { x: c.x + d.x * bestT, y: c.y + d.y * bestT };
    }
  }

  let t = Infinity;
  if (d.x !== 0) {
    t = Math.min(t, box.width / 2 / Math.abs(d.x));
  }
  if (d.y !== 0) {
    t = Math.min(t, box.height / 2 / Math.abs(d.y));
  }
  return { x: c.x + d.x * t, y: c.y + d.y * t };
}

export function handlePoint(doc: ParsedDoc, box: NodeBox): Point {
  const cx = box.center.x;
  const cy = box.center.y;
  const w = box.width;
  const h = box.height;

  switch (doc.direction) {
    case 'TB':
      return { x: cx, y: cy + h / 2 };
    case 'BT':
      return { x: cx, y: cy - h / 2 };
    case 'LR':
      return { x: cx + w / 2, y: cy };
    case 'RL':
      return { x: cx - w / 2, y: cy };
  }
}
