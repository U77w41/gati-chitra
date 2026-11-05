import { LAYOUT } from '../core/constants';
import type { ExtraShapeKind, NodeBox } from '../core/types';
import { shapePolygon } from '../layout/polygon';
import { fmt } from './svg';

export function traceExtraShape(
  ctx: CanvasPath,
  box: NodeBox,
  shape: ExtraShapeKind,
): void {
  const cx = box.center.x;
  const cy = box.center.y;
  const w = box.width;
  const h = box.height;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const t = cy - h / 2;
  const b = cy + h / 2;
  const f = LAYOUT.noteFold;

  switch (shape) {
    case 'note':
      ctx.moveTo(l, t);
      ctx.lineTo(r - f, t);
      ctx.lineTo(r, t + f);
      ctx.lineTo(r, b);
      ctx.lineTo(l, b);
      ctx.closePath();
      break;
    case 'ellipse':
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI);
      break;
    case 'cloud': {
      const a = w / 2;
      const bRad = h / 2;
      ctx.moveTo(cx + a, cy);
      for (let k = 0; k < 10; k++) {
        const angleC = (k + 0.5) * ((2 * Math.PI) / 10);
        const Cx = cx + a * 1.25 * Math.cos(angleC);
        const Cy = cy + bRad * 1.25 * Math.sin(angleC);
        const angleNext = ((k + 1) % 10) * ((2 * Math.PI) / 10);
        const nextX = cx + a * Math.cos(angleNext);
        const nextY = cy + bRad * Math.sin(angleNext);
        ctx.quadraticCurveTo(Cx, Cy, nextX, nextY);
      }
      ctx.closePath();
      break;
    }
    case 'bang':
    case 'blockArrow': {
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
    default:
      break;
  }
}

export function extraShapePath(box: NodeBox, shape: ExtraShapeKind): string {
  const cx = box.center.x;
  const cy = box.center.y;
  const w = box.width;
  const h = box.height;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const t = cy - h / 2;
  const b = cy + h / 2;
  const f = LAYOUT.noteFold;

  switch (shape) {
    case 'note':
      return `M ${fmt(l)} ${fmt(t)} L ${fmt(r - f)} ${fmt(t)} L ${fmt(r)} ${fmt(t + f)} L ${fmt(r)} ${fmt(b)} L ${fmt(l)} ${fmt(b)} Z`;
    case 'ellipse': {
      const rx = w / 2;
      const ry = h / 2;
      return `M ${fmt(cx - rx)} ${fmt(cy)} A ${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx + rx)} ${fmt(cy)} A ${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx - rx)} ${fmt(cy)} Z`;
    }
    case 'cloud': {
      const a = w / 2;
      const bRad = h / 2;
      let d = `M ${fmt(cx + a)} ${fmt(cy)}`;
      for (let k = 0; k < 10; k++) {
        const angleC = (k + 0.5) * ((2 * Math.PI) / 10);
        const Cx = cx + a * 1.25 * Math.cos(angleC);
        const Cy = cy + bRad * 1.25 * Math.sin(angleC);
        const angleNext = ((k + 1) % 10) * ((2 * Math.PI) / 10);
        const nextX = cx + a * Math.cos(angleNext);
        const nextY = cy + bRad * Math.sin(angleNext);
        d += ` Q ${fmt(Cx)} ${fmt(Cy)} ${fmt(nextX)} ${fmt(nextY)}`;
      }
      return `${d} Z`;
    }
    case 'bang':
    case 'blockArrow': {
      const poly = shapePolygon(box, shape);
      if (!poly || poly.length === 0) return '';
      return (
        'M ' +
        poly.map((p, i) => `${i === 0 ? '' : 'L '}${fmt(p.x)} ${fmt(p.y)}`).join(' ') +
        ' Z'
      );
    }
    default:
      return '';
  }
}

export function drawActorFigure(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  color: string,
  width: number,
): void {
  const cx = box.center.x;
  const t = box.center.y - box.height / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(cx, t + 10, 8, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, t + 18);
  ctx.lineTo(cx, t + 36);
  ctx.moveTo(cx - 12, t + 24);
  ctx.lineTo(cx + 12, t + 24);
  ctx.moveTo(cx, t + 36);
  ctx.lineTo(cx - 10, t + 50);
  ctx.moveTo(cx, t + 36);
  ctx.lineTo(cx + 10, t + 50);
  ctx.stroke();
  ctx.restore();
}

export function svgActorFigure(box: NodeBox, color: string, width: number): string {
  const cx = box.center.x;
  const t = box.center.y - box.height / 2;
  return (
    `<circle cx="${fmt(cx)}" cy="${fmt(t + 10)}" r="8" fill="none" stroke="${color}" stroke-width="${fmt(width)}"/>` +
    `<path d="M ${fmt(cx)} ${fmt(t + 18)} L ${fmt(cx)} ${fmt(t + 36)} ` +
    `M ${fmt(cx - 12)} ${fmt(t + 24)} L ${fmt(cx + 12)} ${fmt(t + 24)} ` +
    `M ${fmt(cx)} ${fmt(t + 36)} L ${fmt(cx - 10)} ${fmt(t + 50)} ` +
    `M ${fmt(cx)} ${fmt(t + 36)} L ${fmt(cx + 10)} ${fmt(t + 50)}" fill="none" stroke="${color}" stroke-width="${fmt(width)}"/>`
  );
}

export function drawNoteFold(ctx: CanvasRenderingContext2D, box: NodeBox): void {
  const r = box.center.x + box.width / 2;
  const t = box.center.y - box.height / 2;
  const f = LAYOUT.noteFold;
  ctx.beginPath();
  ctx.moveTo(r - f, t);
  ctx.lineTo(r - f, t + f);
  ctx.lineTo(r, t + f);
  ctx.stroke();
}

export function svgNoteFold(box: NodeBox, color = 'currentColor', width = 2): string {
  const r = box.center.x + box.width / 2;
  const t = box.center.y - box.height / 2;
  const f = LAYOUT.noteFold;
  return `<path d="M ${fmt(r - f)} ${fmt(t)} L ${fmt(r - f)} ${fmt(t + f)} L ${fmt(r)} ${fmt(t + f)}" fill="none" stroke="${color}" stroke-width="${fmt(width)}"/>`;
}
