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
    drawPipelineIcon(ctx, box.center.x - box.width / 2 + 16, box.center.y, label, st.stroke);
  }
  drawPipelineText(ctx, box, textProg, st.text, alpha, shape === 'diamond');
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

// The badge sits in the diamond's top corner, so the label block drops a little to clear it.
const DIAMOND_TEXT_SHIFT = 3;
const TITLE_ROW = 17;
const SUB_ROW = 14;
const CARD_TEXT_INSET = 32;
const CARD_TEXT_PAD_RIGHT = 8;
const DIAMOND_TEXT_PAD = 12;

function revealLines(lines: string[], textProgress: number | undefined): string[] {
  if (textProgress === undefined) return lines;
  const total = lines.reduce((acc, l) => acc + l.length, 0);
  let left = Math.floor(total * Math.max(0, Math.min(1, textProgress)));
  return lines.map((line) => {
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length;
    return shown;
  });
}

export function drawPipelineText(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  textProgress: number | undefined,
  textColor: string,
  baseAlpha: number,
  diamond = false,
): void {
  const lines = box.lines;
  if (lines.length === 0) return;
  const shown = revealLines(lines, textProgress);
  const blockH = TITLE_ROW + (lines.length - 1) * SUB_ROW;
  const left = box.center.x - box.width / 2;
  const right = box.center.x + box.width / 2;
  let rowTop = box.center.y - blockH / 2 + (diamond ? DIAMOND_TEXT_SHIFT : 0);

  ctx.save();
  ctx.textAlign = diamond ? 'center' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  for (let k = 0; k < lines.length; k++) {
    const rowH = k === 0 ? TITLE_ROW : SUB_ROW;
    const y = rowTop + rowH / 2;
    rowTop += rowH;
    const text = shown[k];
    if (!text) continue;
    ctx.font = k === 0 ? `bold 13.5px ${FONT_STACK_SANS}` : `11px ${FONT_STACK_SANS}`;
    ctx.globalAlpha = k === 0 ? baseAlpha : baseAlpha * 0.62;
    if (diamond) {
      // A diamond narrows away from its middle row, so each line gets the width available at its own y.
      const span = box.width * (1 - (2 * Math.abs(y - box.center.y)) / box.height);
      ctx.fillText(text, box.center.x, y, Math.max(10, span - 2 * DIAMOND_TEXT_PAD));
    } else {
      const x = left + CARD_TEXT_INSET;
      ctx.fillText(text, x, y, Math.max(10, right - CARD_TEXT_PAD_RIGHT - x));
    }
  }
  ctx.restore();
}
