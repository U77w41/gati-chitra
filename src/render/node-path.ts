import { LAYOUT } from '../core/constants';
import type { NodeBox, ShapeKind } from '../core/types';
import { shapePolygon } from '../layout/geometry';
import { traceDocument } from './shapes-extra';

export function traceNodePath(
  ctx: CanvasPath,
  box: NodeBox,
  shape: ShapeKind,
): void {
  const cx = box.center.x;
  const cy = box.center.y;
  const w = box.width;
  const h = box.height;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const t = cy - h / 2;
  const b = cy + h / 2;

  switch (shape) {
    case 'rect':
      ctx.roundRect(l, t, w, h, LAYOUT.rectRadius);
      break;
    case 'round':
      ctx.roundRect(l, t, w, h, LAYOUT.roundRadius);
      break;
    case 'stadium':
      ctx.roundRect(l, t, w, h, h / 2);
      break;
    case 'circle':
    case 'doubleCircle':
    case 'framedCircle':
    case 'smallCircle':
    case 'filledCircle':
      ctx.arc(cx, cy, w / 2, 0, 2 * Math.PI);
      break;
    case 'forkBar':
      ctx.rect(l, t, w, h);
      break;
    case 'document':
      traceDocument(ctx, box);
      break;
    case 'text':
      break;
    case 'diamond':
    case 'hexagon':
    case 'parallelogram':
    case 'parallelogramAlt':
    case 'trapezoid':
    case 'trapezoidAlt':
    case 'asymmetric': {
      const poly = shapePolygon(box, shape);
      if (poly && poly.length > 0) {
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
      }
      break;
    }
    case 'cylinder': {
      const rx = w / 2;
      const ry = 8;
      ctx.moveTo(l, t + ry);
      ctx.ellipse(cx, t + ry, rx, ry, 0, Math.PI, 2 * Math.PI);
      ctx.lineTo(r, b - ry);
      ctx.ellipse(cx, b - ry, rx, ry, 0, 0, Math.PI);
      ctx.closePath();
      break;
    }
    case 'subroutine':
    default:
      ctx.roundRect(l, t, w, h, LAYOUT.rectRadius);
      break;
  }
}
