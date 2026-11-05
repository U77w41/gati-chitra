import type { IconName } from '../core/types';

export type IconPrim =
  | { op: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { op: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { op: 'poly'; pts: [number, number][]; closed?: boolean }
  | { op: 'arc'; cx: number; cy: number; r: number; a0: number; a1: number };

export const ICON_PRIMS: Record<IconName, IconPrim[]> = {
  server: [
    { op: 'poly', pts: [[3, 3], [21, 3], [21, 10], [3, 10]], closed: true },
    { op: 'poly', pts: [[3, 14], [21, 14], [21, 21], [3, 21]], closed: true },
    { op: 'circle', cx: 6.5, cy: 6.5, r: 1, fill: true },
    { op: 'circle', cx: 6.5, cy: 17.5, r: 1, fill: true },
  ],
  database: [
    { op: 'ellipse', cx: 12, cy: 5, rx: 8, ry: 3 },
    { op: 'poly', pts: [[4, 5], [4, 19]] },
    { op: 'poly', pts: [[20, 5], [20, 19]] },
    { op: 'ellipse', cx: 12, cy: 19, rx: 8, ry: 3 },
  ],
  disk: [
    { op: 'circle', cx: 12, cy: 12, r: 9 },
    { op: 'circle', cx: 12, cy: 12, r: 2.5, fill: true },
  ],
  internet: [
    { op: 'circle', cx: 12, cy: 12, r: 9 },
    { op: 'ellipse', cx: 12, cy: 12, rx: 4, ry: 9 },
    { op: 'poly', pts: [[3, 12], [21, 12]] },
    { op: 'poly', pts: [[5, 7], [19, 7]] },
    { op: 'poly', pts: [[5, 17], [19, 17]] },
  ],
  cloud: [
    { op: 'circle', cx: 8, cy: 14, r: 4 },
    { op: 'circle', cx: 13, cy: 10, r: 5 },
    { op: 'circle', cx: 17, cy: 14, r: 4 },
    { op: 'poly', pts: [[6, 18], [19, 18]] },
  ],
  faceHappy: [
    { op: 'circle', cx: 12, cy: 12, r: 9 },
    { op: 'circle', cx: 9, cy: 10, r: 1, fill: true },
    { op: 'circle', cx: 15, cy: 10, r: 1, fill: true },
    { op: 'arc', cx: 12, cy: 13, r: 4, a0: 0.15 * Math.PI, a1: 0.85 * Math.PI },
  ],
  faceNeutral: [
    { op: 'circle', cx: 12, cy: 12, r: 9 },
    { op: 'circle', cx: 9, cy: 10, r: 1, fill: true },
    { op: 'circle', cx: 15, cy: 10, r: 1, fill: true },
    { op: 'poly', pts: [[8.5, 16], [15.5, 16]] },
  ],
  faceSad: [
    { op: 'circle', cx: 12, cy: 12, r: 9 },
    { op: 'circle', cx: 9, cy: 10, r: 1, fill: true },
    { op: 'circle', cx: 15, cy: 10, r: 1, fill: true },
    { op: 'arc', cx: 12, cy: 18, r: 4, a0: 1.15 * Math.PI, a1: 1.85 * Math.PI },
  ],
  cross: [
    { op: 'poly', pts: [[7, 7], [17, 17]] },
    { op: 'poly', pts: [[17, 7], [7, 17]] },
  ],
};

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  const prims = ICON_PRIMS[name];
  if (!prims) return;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  for (const p of prims) {
    ctx.beginPath();
    if (p.op === 'circle') {
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      if (p.fill) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else if (p.op === 'ellipse') {
      ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.op === 'poly') {
      ctx.moveTo(p.pts[0][0], p.pts[0][1]);
      for (let i = 1; i < p.pts.length; i++) {
        ctx.lineTo(p.pts[i][0], p.pts[i][1]);
      }
      if (p.closed) ctx.closePath();
      ctx.stroke();
    } else if (p.op === 'arc') {
      ctx.arc(p.cx, p.cy, p.r, p.a0, p.a1);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function svgIcon(
  name: IconName,
  cx: number,
  cy: number,
  size: number,
  color: string,
): string {
  const prims = ICON_PRIMS[name];
  if (!prims) return '';
  const tx = cx - size / 2;
  const ty = cy - size / 2;
  const scale = (size / 24).toFixed(4);

  let inner = '';
  for (const p of prims) {
    if (p.op === 'circle') {
      if (p.fill) {
        inner += `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${color}" stroke="none"/>`;
      } else {
        inner += `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"/>`;
      }
    } else if (p.op === 'ellipse') {
      inner += `<ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}"/>`;
    } else if (p.op === 'poly') {
      const d = p.pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`).join(' ') + (p.closed ? ' Z' : '');
      inner += `<path d="${d}"/>`;
    } else if (p.op === 'arc') {
      const x0 = (p.cx + p.r * Math.cos(p.a0)).toFixed(2);
      const y0 = (p.cy + p.r * Math.sin(p.a0)).toFixed(2);
      const x1 = (p.cx + p.r * Math.cos(p.a1)).toFixed(2);
      const y1 = (p.cy + p.r * Math.sin(p.a1)).toFixed(2);
      const large = p.a1 - p.a0 > Math.PI ? 1 : 0;
      inner += `<path d="M ${x0} ${y0} A ${p.r} ${p.r} 0 ${large} 1 ${x1} ${y1}"/>`;
    }
  }

  return `<g transform="translate(${tx}, ${ty}) scale(${scale})" stroke="${color}" fill="none" stroke-width="1.5">${inner}</g>`;
}
