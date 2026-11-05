import { FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { NodeBox, Point, TextRun } from '../core/types';
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

export function drawNodeLines(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  textProg: number | undefined,
  center: Point = box.center,
): void {
  ctx.font = `16px ${FONT_STACK_SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const totalChars = box.lines.reduce((acc, l) => acc + l.length, 0);
  const visibleChars =
    textProg !== undefined
      ? Math.floor(totalChars * Math.max(0, Math.min(1, textProg)))
      : totalChars;
  let charAcc = 0;
  for (let k = 0; k < box.lines.length; k++) {
    const line = box.lines[k];
    let dispLine = line;
    if (textProg !== undefined) {
      const start = charAcc;
      const end = charAcc + line.length;
      if (visibleChars <= start) dispLine = '';
      else if (visibleChars < end) dispLine = line.slice(0, visibleChars - start);
      charAcc += line.length;
    }
    if (dispLine) {
      const y = center.y + (k - (box.lines.length - 1) / 2) * LAYOUT.lineHeight;
      ctx.fillText(dispLine, center.x, y);
    }
  }
}
