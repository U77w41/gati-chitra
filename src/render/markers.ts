import { LAYOUT } from '../core/constants';
import type { MarkerKind, Point } from '../core/types';
import { fmt } from './svg';

export type MarkerPrim =
  | { type: 'poly'; points: Point[]; closed: boolean; fill: 'none' | 'stroke' | 'background' }
  | { type: 'circle'; c: Point; r: number; fill: 'stroke' | 'background' };

export function markerPrims(
  kind: MarkerKind,
  tip: Point,
  u: Point,
  size?: number,
): MarkerPrim[] {
  const s = size ?? LAYOUT.arrowSize;
  const n = { x: -u.y, y: u.x };
  const T = tip;

  switch (kind) {
    case 'openArrow':
      return [
        {
          type: 'poly',
          points: [
            { x: T.x - s * u.x + 0.5 * s * n.x, y: T.y - s * u.y + 0.5 * s * n.y },
            T,
            { x: T.x - s * u.x - 0.5 * s * n.x, y: T.y - s * u.y - 0.5 * s * n.y },
          ],
          closed: false,
          fill: 'none',
        },
      ];
    case 'triangle':
      return [
        {
          type: 'poly',
          points: [
            T,
            { x: T.x - 1.4 * s * u.x + 0.7 * s * n.x, y: T.y - 1.4 * s * u.y + 0.7 * s * n.y },
            { x: T.x - 1.4 * s * u.x - 0.7 * s * n.x, y: T.y - 1.4 * s * u.y - 0.7 * s * n.y },
          ],
          closed: true,
          fill: 'background',
        },
      ];
    case 'diamond':
      return [
        {
          type: 'poly',
          points: [
            T,
            { x: T.x - s * u.x + 0.5 * s * n.x, y: T.y - s * u.y + 0.5 * s * n.y },
            { x: T.x - 2 * s * u.x, y: T.y - 2 * s * u.y },
            { x: T.x - s * u.x - 0.5 * s * n.x, y: T.y - s * u.y - 0.5 * s * n.y },
          ],
          closed: true,
          fill: 'background',
        },
      ];
    case 'diamondFilled':
      return [
        {
          type: 'poly',
          points: [
            T,
            { x: T.x - s * u.x + 0.5 * s * n.x, y: T.y - s * u.y + 0.5 * s * n.y },
            { x: T.x - 2 * s * u.x, y: T.y - 2 * s * u.y },
            { x: T.x - s * u.x - 0.5 * s * n.x, y: T.y - s * u.y - 0.5 * s * n.y },
          ],
          closed: true,
          fill: 'stroke',
        },
      ];
    case 'erOne':
      return [
        {
          type: 'poly',
          points: [
            { x: T.x - 6 * u.x + 0.7 * s * n.x, y: T.y - 6 * u.y + 0.7 * s * n.y },
            { x: T.x - 6 * u.x - 0.7 * s * n.x, y: T.y - 6 * u.y - 0.7 * s * n.y },
          ],
          closed: false,
          fill: 'none',
        },
        {
          type: 'poly',
          points: [
            { x: T.x - 11 * u.x + 0.7 * s * n.x, y: T.y - 11 * u.y + 0.7 * s * n.y },
            { x: T.x - 11 * u.x - 0.7 * s * n.x, y: T.y - 11 * u.y - 0.7 * s * n.y },
          ],
          closed: false,
          fill: 'none',
        },
      ];
    case 'erZeroOrOne':
      return [
        {
          type: 'poly',
          points: [
            { x: T.x - 6 * u.x + 0.7 * s * n.x, y: T.y - 6 * u.y + 0.7 * s * n.y },
            { x: T.x - 6 * u.x - 0.7 * s * n.x, y: T.y - 6 * u.y - 0.7 * s * n.y },
          ],
          closed: false,
          fill: 'none',
        },
        {
          type: 'circle',
          c: { x: T.x - 15 * u.x, y: T.y - 15 * u.y },
          r: 4,
          fill: 'background',
        },
      ];
    case 'erOneOrMore': {
      const B = { x: T.x - 12 * u.x, y: T.y - 12 * u.y };
      return [
        {
          type: 'poly',
          points: [B, { x: T.x + 0.7 * s * n.x, y: T.y + 0.7 * s * n.y }],
          closed: false,
          fill: 'none',
        },
        {
          type: 'poly',
          points: [B, T],
          closed: false,
          fill: 'none',
        },
        {
          type: 'poly',
          points: [B, { x: T.x - 0.7 * s * n.x, y: T.y - 0.7 * s * n.y }],
          closed: false,
          fill: 'none',
        },
        {
          type: 'poly',
          points: [
            { x: T.x - 15 * u.x + 0.7 * s * n.x, y: T.y - 15 * u.y + 0.7 * s * n.y },
            { x: T.x - 15 * u.x - 0.7 * s * n.x, y: T.y - 15 * u.y - 0.7 * s * n.y },
          ],
          closed: false,
          fill: 'none',
        },
      ];
    }
    case 'erZeroOrMore': {
      const B = { x: T.x - 12 * u.x, y: T.y - 12 * u.y };
      return [
        {
          type: 'poly',
          points: [B, { x: T.x + 0.7 * s * n.x, y: T.y + 0.7 * s * n.y }],
          closed: false,
          fill: 'none',
        },
        {
          type: 'poly',
          points: [B, T],
          closed: false,
          fill: 'none',
        },
        {
          type: 'poly',
          points: [B, { x: T.x - 0.7 * s * n.x, y: T.y - 0.7 * s * n.y }],
          closed: false,
          fill: 'none',
        },
        {
          type: 'circle',
          c: { x: T.x - 18 * u.x, y: T.y - 18 * u.y },
          r: 4,
          fill: 'background',
        },
      ];
    }
    default:
      return [];
  }
}

export function drawMarker(
  ctx: CanvasRenderingContext2D,
  prims: MarkerPrim[],
  stroke: string,
  background: string,
  width: number,
): void {
  ctx.save();
  for (const prim of prims) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    if (prim.type === 'poly') {
      ctx.beginPath();
      ctx.moveTo(prim.points[0].x, prim.points[0].y);
      for (let i = 1; i < prim.points.length; i++) {
        ctx.lineTo(prim.points[i].x, prim.points[i].y);
      }
      if (prim.closed) {
        ctx.closePath();
        if (prim.fill === 'background') {
          ctx.fillStyle = background;
          ctx.fill();
        } else if (prim.fill === 'stroke') {
          ctx.fillStyle = stroke;
          ctx.fill();
        }
      }
      ctx.stroke();
    } else if (prim.type === 'circle') {
      ctx.beginPath();
      ctx.arc(prim.c.x, prim.c.y, prim.r, 0, 2 * Math.PI);
      if (prim.fill === 'background') {
        ctx.fillStyle = background;
        ctx.fill();
      } else if (prim.fill === 'stroke') {
        ctx.fillStyle = stroke;
        ctx.fill();
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function svgMarker(
  prims: MarkerPrim[],
  stroke: string,
  background: string,
  width: number,
): string {
  let out = '';
  for (const prim of prims) {
    const fill =
      prim.fill === 'background'
        ? background
        : prim.fill === 'stroke'
          ? stroke
          : 'none';
    if (prim.type === 'poly') {
      const pts = prim.points.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
      if (prim.closed) {
        out += `<polygon class="marker-extra" points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${fmt(width)}"/>`;
      } else {
        out += `<polyline class="marker-extra" points="${pts}" fill="none" stroke="${stroke}" stroke-width="${fmt(width)}"/>`;
      }
    } else if (prim.type === 'circle') {
      out += `<circle class="marker-extra" cx="${fmt(prim.c.x)}" cy="${fmt(prim.c.y)}" r="${fmt(prim.r)}" fill="${fill}" stroke="${stroke}" stroke-width="${fmt(width)}"/>`;
    }
  }
  return out;
}
