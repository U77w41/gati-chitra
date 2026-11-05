import type { Point, TextRun } from '../core/types';
import { fontString } from '../layout/measure';

export function drawRuns(
  ctx: CanvasRenderingContext2D,
  lines: TextRun[][],
  center: Point,
  fontSize: number,
  lineHeight: number,
): void {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k];
    let totalW = 0;
    for (const r of line) {
      ctx.font = fontString(fontSize, r);
      totalW += ctx.measureText(r.text).width;
    }
    let curX = center.x - totalW / 2;
    const y = center.y + (k - (lines.length - 1) / 2) * lineHeight;
    for (const r of line) {
      ctx.font = fontString(fontSize, r);
      ctx.fillText(r.text, curX, y);
      curX += ctx.measureText(r.text).width;
    }
  }
}
