import { FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { EdgePath, FrameState, Point, Scene, Theme } from '../core/types';
import { tangentAt } from '../layout/geometry';
import { fmt } from './svg';
import { escapeXml } from './xml';

export function endLabelPoints(
  path: EdgePath,
  labels: { from?: string; to?: string },
): { at: Point; text: string }[] {
  const result: { at: Point; text: string }[] = [];
  if (labels.from) {
    const t0 = tangentAt(path, 0);
    const n0 = { x: -t0.y, y: t0.x };
    result.push({
      at: {
        x: path.from.x + LAYOUT.endLabelAlong * t0.x + LAYOUT.endLabelAcross * n0.x,
        y: path.from.y + LAYOUT.endLabelAlong * t0.y + LAYOUT.endLabelAcross * n0.y,
      },
      text: labels.from,
    });
  }
  if (labels.to) {
    const t1 = tangentAt(path, 1);
    const n1 = { x: -t1.y, y: t1.x };
    result.push({
      at: {
        x: path.to.x - LAYOUT.endLabelAlong * t1.x + LAYOUT.endLabelAcross * n1.x,
        y: path.to.y - LAYOUT.endLabelAlong * t1.y + LAYOUT.endLabelAcross * n1.y,
      },
      text: labels.to,
    });
  }
  return result;
}

export function drawEdgeEndLabels(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
  frame?: FrameState,
): void {
  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    const path = scene.layout.edges[edge.id];
    if (!path || !edge.endLabels) continue;
    const grow = frame?.edgeGrow?.[edge.id] ?? 1;
    if (grow < 1) continue;

    const points = endLabelPoints(path, edge.endLabels);
    if (points.length === 0) continue;

    ctx.save();
    ctx.font = `${LAYOUT.endLabelFontSize}px ${FONT_STACK_SANS}`;
    ctx.fillStyle = theme.edgeLabelText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of points) {
      ctx.fillText(p.text, p.at.x, p.at.y);
    }
    ctx.restore();
  }
}

export function svgEdgeEndLabels(scene: Scene, theme: Theme): string {
  let out = '';
  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    const path = scene.layout.edges[edge.id];
    if (!path || !edge.endLabels) continue;

    const points = endLabelPoints(path, edge.endLabels);
    for (const p of points) {
      out += `<text x="${fmt(p.at.x)}" y="${fmt(p.at.y)}" dy="0.35em" text-anchor="middle" font-size="${LAYOUT.endLabelFontSize}" fill="${theme.edgeLabelText}">${escapeXml(p.text)}</text>`;
    }
  }
  return out;
}
