import { FONT_STACK_SANS } from '../core/constants';
import type { NodeBox } from '../core/types';

export function drawWorkflowTile(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  label: string,
  isTrigger: boolean,
  fillColor: string,
  strokeColor: string,
  textColor: string,
  textProgress: number | undefined,
  baseAlpha: number,
): void {
  const cx = box.center.x;
  const cy = box.center.y;
  const size = 64;
  const radius = 16;
  const left = cx - size / 2;
  const top = cy - size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, size, size, radius);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  drawWorkflowIcon(ctx, cx, cy, label, strokeColor);

  if (isTrigger) {
    const badgeX = left + 8;
    const badgeY = top + 8;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('⚡', badgeX, badgeY);
  }

  const portX = left + size;
  const portY = cy;
  ctx.beginPath();
  ctx.arc(portX, portY, 4, 0, 2 * Math.PI);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

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

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (disp1) {
    ctx.font = `bold 12px ${FONT_STACK_SANS}`;
    ctx.fillStyle = textColor;
    ctx.fillText(disp1, cx, top + size + 14);
  }

  if (disp2) {
    ctx.save();
    ctx.globalAlpha = baseAlpha * 0.62;
    ctx.font = `10.5px ${FONT_STACK_SANS}`;
    ctx.fillStyle = textColor;
    ctx.fillText(disp2, cx, top + size + 28);
    ctx.restore();
  }

  ctx.restore();
}

function drawWorkflowIcon(
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
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (/drive|cloud|folder/i.test(l)) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx + 10, cy + 8);
    ctx.lineTo(cx - 10, cy + 8);
    ctx.closePath();
    ctx.stroke();
  } else if (/form|doc|file|template/i.test(l)) {
    ctx.beginPath();
    ctx.roundRect(cx - 9, cy - 12, 18, 24, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 4);
    ctx.lineTo(cx + 5, cy - 4);
    ctx.moveTo(cx - 5, cy + 2);
    ctx.lineTo(cx + 5, cy + 2);
    ctx.stroke();
  } else if (/approval|slack|message|chat/i.test(l)) {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 3);
    ctx.lineTo(cx + 10, cy - 3);
    ctx.moveTo(cx - 10, cy + 3);
    ctx.lineTo(cx + 10, cy + 3);
    ctx.moveTo(cx - 3, cy - 10);
    ctx.lineTo(cx - 3, cy + 10);
    ctx.moveTo(cx + 3, cy - 10);
    ctx.lineTo(cx + 3, cy + 10);
    ctx.stroke();
  } else if (/cond|branch|fork|decision|\?/i.test(l)) {
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 6, 2.5, 0, 2 * Math.PI);
    ctx.arc(cx - 5, cy - 6, 2.5, 0, 2 * Math.PI);
    ctx.arc(cx + 6, cy - 6, 2.5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 3.5);
    ctx.lineTo(cx - 5, cy - 3.5);
    ctx.moveTo(cx - 5, cy);
    ctx.quadraticCurveTo(cx, cy, cx + 6, cy - 3.5);
    ctx.stroke();
  } else if (/sheet|record|table|grid/i.test(l)) {
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy - 10, 20, 20, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.stroke();
  } else if (/mail|notify|email|alert|envelope/i.test(l)) {
    ctx.beginPath();
    ctx.roundRect(cx - 11, cy - 7, 22, 14, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 6);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx + 11, cy - 6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();
  }

  ctx.restore();
}
