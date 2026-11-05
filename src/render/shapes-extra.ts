import { LAYOUT } from '../core/constants';
import type { NodeBox } from '../core/types';

export function documentPathData(box: NodeBox, wave: number = LAYOUT.documentWave) {
  const l = box.center.x - box.width / 2;
  const r = box.center.x + box.width / 2;
  const t = box.center.y - box.height / 2;
  const b = box.center.y + box.height / 2;
  const w = box.width;
  const cx = box.center.x;

  return {
    l, r, t, b,
    start: { x: l, y: t },
    topRight: { x: r, y: t },
    rightBottom: { x: r, y: b - wave },
    curve1: {
      cp1: { x: r - w * 0.25, y: b },
      cp2: { x: cx + w * 0.25, y: b },
      to: { x: cx, y: b - wave / 2 },
    },
    curve2: {
      cp1: { x: cx - w * 0.25, y: b - wave },
      cp2: { x: l + w * 0.25, y: b - wave },
      to: { x: l, y: b - wave },
    },
  };
}

export function traceDocument(ctx: CanvasPath, box: NodeBox, wave: number = LAYOUT.documentWave): void {
  const p = documentPathData(box, wave);
  ctx.moveTo(p.start.x, p.start.y);
  ctx.lineTo(p.topRight.x, p.topRight.y);
  ctx.lineTo(p.rightBottom.x, p.rightBottom.y);
  ctx.bezierCurveTo(
    p.curve1.cp1.x, p.curve1.cp1.y,
    p.curve1.cp2.x, p.curve1.cp2.y,
    p.curve1.to.x, p.curve1.to.y,
  );
  ctx.bezierCurveTo(
    p.curve2.cp1.x, p.curve2.cp1.y,
    p.curve2.cp2.x, p.curve2.cp2.y,
    p.curve2.to.x, p.curve2.to.y,
  );
  ctx.closePath();
}

export function ringRadii(box: NodeBox, gap: number = LAYOUT.doubleCircleGap): { outer: number; inner: number } {
  const outer = box.width / 2;
  const inner = Math.max(0, outer - gap);
  return { outer, inner };
}

export function drawNodeInnerLines(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  shape: string,
): void {
  if (shape === 'cylinder') {
    const rx = box.width / 2;
    const ry = 8;
    const t = box.center.y - box.height / 2;
    ctx.beginPath();
    ctx.ellipse(box.center.x, t + ry, rx, ry, 0, 0, Math.PI);
    ctx.stroke();
  } else if (shape === 'subroutine') {
    const l = box.center.x - box.width / 2;
    const r = box.center.x + box.width / 2;
    const t = box.center.y - box.height / 2;
    const b = box.center.y + box.height / 2;
    ctx.beginPath();
    ctx.moveTo(l + 8, t);
    ctx.lineTo(l + 8, b);
    ctx.moveTo(r - 8, t);
    ctx.lineTo(r - 8, b);
    ctx.stroke();
  } else if (shape === 'doubleCircle' || shape === 'framedCircle') {
    const rInner = Math.max(0, box.width / 2 - LAYOUT.doubleCircleGap);
    ctx.beginPath();
    ctx.arc(box.center.x, box.center.y, rInner, 0, 2 * Math.PI);
    ctx.stroke();
  }
}
