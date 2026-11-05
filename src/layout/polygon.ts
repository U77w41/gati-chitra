import { LAYOUT } from '../core/constants';
import type { NodeBox, ParsedDoc, Point, Rect, ShapeKind } from '../core/types';

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function rectBorderPoint(rect: Rect, toward: Point): Point {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy };
  }
  let t = Infinity;
  if (dx !== 0) {
    t = Math.min(t, rect.width / 2 / Math.abs(dx));
  }
  if (dy !== 0) {
    t = Math.min(t, rect.height / 2 / Math.abs(dy));
  }
  return { x: cx + dx * t, y: cy + dy * t };
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
    case 'bang': {
      const pts: Point[] = [];
      const rx = w / 2;
      const ry = h / 2;
      for (let k = 0; k < 16; k++) {
        const angle = (k * 2 * Math.PI) / 16;
        const factor = k % 2 === 0 ? 1 : 0.75;
        pts.push({
          x: cx + Math.cos(angle) * rx * factor,
          y: cy + Math.sin(angle) * ry * factor,
        });
      }
      return pts;
    }
    case 'blockArrow': {
      const dir = box.arrowDir ?? 'right';
      const l = cx - w / 2;
      const r = cx + w / 2;
      const t = cy - h / 2;
      const b = cy + h / 2;
      if (dir === 'left') {
        return [
          { x: r, y: cy - h / 4 },
          { x: l + h / 2, y: cy - h / 4 },
          { x: l + h / 2, y: t },
          { x: l, y: cy },
          { x: l + h / 2, y: b },
          { x: l + h / 2, y: cy + h / 4 },
          { x: r, y: cy + h / 4 },
        ];
      }
      if (dir === 'down') {
        return [
          { x: cx - w / 4, y: t },
          { x: cx - w / 4, y: b - w / 2 },
          { x: l, y: b - w / 2 },
          { x: cx, y: b },
          { x: r, y: b - w / 2 },
          { x: cx + w / 4, y: b - w / 2 },
          { x: cx + w / 4, y: t },
        ];
      }
      if (dir === 'up') {
        return [
          { x: cx - w / 4, y: b },
          { x: cx - w / 4, y: t + w / 2 },
          { x: l, y: t + w / 2 },
          { x: cx, y: t },
          { x: r, y: t + w / 2 },
          { x: cx + w / 4, y: t + w / 2 },
          { x: cx + w / 4, y: b },
        ];
      }
      if (dir === 'x') {
        return [
          { x: l, y: cy },
          { x: l + h / 2, y: t },
          { x: l + h / 2, y: cy - h / 4 },
          { x: r - h / 2, y: cy - h / 4 },
          { x: r - h / 2, y: t },
          { x: r, y: cy },
          { x: r - h / 2, y: b },
          { x: r - h / 2, y: cy + h / 4 },
          { x: l + h / 2, y: cy + h / 4 },
          { x: l + h / 2, y: b },
        ];
      }
      if (dir === 'y') {
        return [
          { x: cx, y: t },
          { x: r, y: t + w / 2 },
          { x: cx + w / 4, y: t + w / 2 },
          { x: cx + w / 4, y: b - w / 2 },
          { x: r, y: b - w / 2 },
          { x: cx, y: b },
          { x: l, y: b - w / 2 },
          { x: cx - w / 4, y: b - w / 2 },
          { x: cx - w / 4, y: t + w / 2 },
          { x: l, y: t + w / 2 },
        ];
      }
      return [
        { x: l, y: cy - h / 4 },
        { x: r - h / 2, y: cy - h / 4 },
        { x: r - h / 2, y: t },
        { x: r, y: cy },
        { x: r - h / 2, y: b },
        { x: r - h / 2, y: cy + h / 4 },
        { x: l, y: cy + h / 4 },
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

  if (shape === 'ellipse' || shape === 'cloud') {
    const a = box.width / 2;
    const b = box.height / 2;
    const s = 1 / Math.sqrt((d.x / a) ** 2 + (d.y / b) ** 2);
    return { x: c.x + d.x * s, y: c.y + d.y * s };
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
