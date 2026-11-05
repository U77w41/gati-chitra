import { ANIM, FONT_STACK_SANS } from '../core/constants';
import type { NodeBox, ShapeKind, Theme } from '../core/types';
import { traceNodePath } from './node-path';

export function traceRoundedDiamond(
  ctx: CanvasPath,
  box: NodeBox,
  radius = 10,
): void {
  const cx = box.center.x;
  const cy = box.center.y;
  const w = box.width;
  const h = box.height;
  const t = { x: cx, y: cy - h / 2 };
  const r = { x: cx + w / 2, y: cy };
  const b = { x: cx, y: cy + h / 2 };
  const l = { x: cx - w / 2, y: cy };

  ctx.moveTo((t.x + l.x) / 2, (t.y + l.y) / 2);
  ctx.arcTo(t.x, t.y, r.x, r.y, radius);
  ctx.arcTo(r.x, r.y, b.x, b.y, radius);
  ctx.arcTo(b.x, b.y, l.x, l.y, radius);
  ctx.arcTo(l.x, l.y, t.x, t.y, radius);
  ctx.closePath();
}

export function drawPipelineNode(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  shape: ShapeKind,
  label: string,
  st: { fill: string; stroke: string; strokeWidth: number; text: string },
  hasGlow: boolean,
  glow: number,
  theme: Theme,
  textProg: number | undefined,
  alpha: number,
): void {
  ctx.beginPath();
  if (shape === 'diamond') {
    traceRoundedDiamond(ctx, box, 10);
  } else {
    traceNodePath(ctx, box, shape);
  }
  if (hasGlow) {
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = ANIM.glowBlur * glow;
  }
  ctx.fillStyle = st.fill;
  ctx.fill();
  if (hasGlow) ctx.shadowBlur = 0;
  ctx.lineWidth = st.strokeWidth;
  ctx.strokeStyle = st.stroke;
  ctx.stroke();

  if (shape === 'diamond') {
    drawDiamondQuestionBadge(ctx, box, st.stroke);
  } else {
    drawPipelineIcon(ctx, box.center.x - box.width / 2 + 18, box.center.y, label, st.stroke);
  }
  drawPipelineText(ctx, box, textProg, st.text, alpha);
}

export function drawDiamondQuestionBadge(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  color: string,
): void {
  const cx = box.center.x;
  const topY = box.center.y - box.height / 2 + 15;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, topY, 7.5, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_STACK_SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText('?', cx, topY);
  ctx.restore();
}

export function drawPipelineIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  color: string,
): void {
  const l = label.toLowerCase();
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (/order|placed|cart|bag/i.test(l)) {
    ctx.beginPath();
    ctx.roundRect(cx - 7, cy - 4, 14, 12, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 3.5, Math.PI, 0);
    ctx.stroke();
  } else if (/payment|auth|stripe|card/i.test(l)) {
    ctx.beginPath();
    ctx.roundRect(cx - 8, cy - 5, 16, 11, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 1);
    ctx.lineTo(cx + 8, cy - 1);
    ctx.stroke();
  } else if (/kitchen|prep|restaurant|food/i.test(l)) {
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 6);
    ctx.lineTo(cx - 4, cy + 6);
    ctx.moveTo(cx - 6, cy - 6);
    ctx.lineTo(cx - 6, cy - 2);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.lineTo(cx - 2, cy - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 6);
    ctx.lineTo(cx + 4, cy + 6);
    ctx.moveTo(cx + 4, cy - 6);
    ctx.arc(cx + 4, cy - 1, 5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else if (/courier|dispatch|delivery|truck/i.test(l)) {
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 4);
    ctx.lineTo(cx + 2, cy - 4);
    ctx.lineTo(cx + 5, cy - 1);
    ctx.lineTo(cx + 8, cy - 1);
    ctx.lineTo(cx + 8, cy + 4);
    ctx.lineTo(cx - 8, cy + 4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 5, 2, 0, 2 * Math.PI);
    ctx.arc(cx + 5, cy + 5, 2, 0, 2 * Math.PI);
    ctx.fill();
  } else if (/declin|fail|cancel|error|reject|timeout|issue/i.test(l)) {
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 3);
    ctx.lineTo(cx + 3, cy + 3);
    ctx.moveTo(cx + 3, cy - 3);
    ctx.lineTo(cx - 3, cy + 3);
    ctx.stroke();
  } else if (/deliver|success|complet|approv|done|pass/i.test(l)) {
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 3.5, cy);
    ctx.lineTo(cx - 1, cy + 3);
    ctx.lineTo(cx + 4, cy - 2.5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(cx - 6, cy - 6, 12, 12, 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPipelineText(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  textProgress: number | undefined,
  textColor: string,
  baseAlpha: number,
): void {
  const line1 = box.lines[0] ?? '';
  const line2 = box.lines.length > 1 ? box.lines.slice(1).join(' ') : '';
  const totalChars = line1.length + line2.length;

  let disp1 = line1;
  let disp2 = line2;

  if (textProgress !== undefined) {
    const p = Math.max(0, Math.min(1, textProgress));
    const visibleChars = Math.floor(totalChars * p);
    disp1 = line1.slice(0, Math.min(line1.length, visibleChars));
    disp2 = visibleChars > line1.length ? line2.slice(0, visibleChars - line1.length) : '';
  }

  const startX = box.center.x - box.width / 2 + 36;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  if (disp1) {
    ctx.save();
    ctx.font = `bold 13.5px ${FONT_STACK_SANS}`;
    ctx.fillStyle = textColor;
    ctx.fillText(disp1, startX, line2 ? box.center.y - 7 : box.center.y);
    ctx.restore();
  }

  if (disp2) {
    ctx.save();
    ctx.globalAlpha = baseAlpha * 0.62;
    ctx.font = `11px ${FONT_STACK_SANS}`;
    ctx.fillStyle = textColor;
    ctx.fillText(disp2, startX, box.center.y + 9);
    ctx.restore();
  }
}
