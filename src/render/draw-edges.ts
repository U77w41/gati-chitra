import { ANIM, FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { DrawOptions, Scene, Theme } from '../core/types';
import { tangentAt } from '../layout/geometry';
import { edgeStyle } from './style';

export function drawEdges(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
  options: DrawOptions,
): void {
  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    const path = scene.layout.edges[edge.id];
    if (!path) continue;

    const st = edgeStyle(edge, theme);
    const isDimmed = options.focus !== null && !options.focus.edges.includes(edge.id);
    if (isDimmed) {
      ctx.globalAlpha = ANIM.dimAlpha;
    }

    ctx.beginPath();
    ctx.moveTo(path.from.x, path.from.y);
    if (path.kind === 'straight' || !path.control) {
      ctx.lineTo(path.to.x, path.to.y);
    } else {
      ctx.quadraticCurveTo(path.control.x, path.control.y, path.to.x, path.to.y);
    }

    ctx.lineWidth = st.width;
    ctx.strokeStyle = st.stroke;
    ctx.lineCap = 'round';
    ctx.setLineDash(st.dash ?? []);
    ctx.stroke();
    ctx.setLineDash([]);

    const t = tangentAt(path, 1);
    const n = { x: -t.y, y: t.x };
    const to = path.to;
    const arrowSize = LAYOUT.arrowSize;

    if (st.endMarker === 'arrow') {
      const p1 = {
        x: to.x - t.x * arrowSize + n.x * arrowSize * 0.4,
        y: to.y - t.y * arrowSize + n.y * arrowSize * 0.4,
      };
      const p2 = {
        x: to.x - t.x * arrowSize - n.x * arrowSize * 0.4,
        y: to.y - t.y * arrowSize - n.y * arrowSize * 0.4,
      };
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle = st.stroke;
      ctx.fill();
    } else if (st.endMarker === 'circle') {
      ctx.beginPath();
      ctx.arc(to.x - t.x * 5, to.y - t.y * 5, 5, 0, 2 * Math.PI);
      ctx.fillStyle = st.stroke;
      ctx.fill();
    } else if (st.endMarker === 'cross') {
      const cx = to.x - t.x * 6;
      const cy = to.y - t.y * 6;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 5);
      ctx.lineTo(cx + 5, cy + 5);
      ctx.moveTo(cx - 5, cy + 5);
      ctx.lineTo(cx + 5, cy - 5);
      ctx.lineWidth = 2;
      ctx.strokeStyle = st.stroke;
      ctx.stroke();
    }

    if (st.startMarker === 'arrow' || st.startArrow) {
      const t0 = tangentAt(path, 0);
      const n0 = { x: t0.y, y: -t0.x };
      const from = path.from;
      const p1 = {
        x: from.x + t0.x * arrowSize + n0.x * arrowSize * 0.4,
        y: from.y + t0.y * arrowSize + n0.y * arrowSize * 0.4,
      };
      const p2 = {
        x: from.x - t0.x * arrowSize - n0.x * arrowSize * 0.4,
        y: from.y - t0.y * arrowSize - n0.y * arrowSize * 0.4,
      };
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle = st.stroke;
      ctx.fill();
    } else if (st.startMarker === 'circle') {
      const t0 = tangentAt(path, 0);
      ctx.beginPath();
      ctx.arc(path.from.x + t0.x * 5, path.from.y + t0.y * 5, 5, 0, 2 * Math.PI);
      ctx.fillStyle = st.stroke;
      ctx.fill();
    } else if (st.startMarker === 'cross') {
      const t0 = tangentAt(path, 0);
      const cx = path.from.x + t0.x * 6;
      const cy = path.from.y + t0.y * 6;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 5);
      ctx.lineTo(cx + 5, cy + 5);
      ctx.moveTo(cx - 5, cy + 5);
      ctx.lineTo(cx + 5, cy - 5);
      ctx.lineWidth = 2;
      ctx.strokeStyle = st.stroke;
      ctx.stroke();
    }

    if (isDimmed) {
      ctx.globalAlpha = 1;
    }
  }
}

export function drawEdgeLabels(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
): void {
  for (const edge of scene.doc.edges) {
    if (edge.label && edge.label.length > 0) {
      const path = scene.layout.edges[edge.id];
      if (!path) continue;
      const w = ctx.measureText(edge.label).width + 2 * LAYOUT.edgeLabelPadX;
      const h = LAYOUT.edgeLabelH;
      ctx.beginPath();
      ctx.roundRect(path.labelPoint.x - w / 2, path.labelPoint.y - h / 2, w, h, 4);
      ctx.fillStyle = theme.edgeLabelBg;
      ctx.fill();

      ctx.font = `13px ${FONT_STACK_SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.edgeLabelText;
      ctx.fillText(edge.label, path.labelPoint.x, path.labelPoint.y);
    }
  }
}

export function drawEdgeDashOverlay(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
  dashOffset: number,
): void {
  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    const path = scene.layout.edges[edge.id];
    if (!path) continue;
    ctx.beginPath();
    ctx.moveTo(path.from.x, path.from.y);
    if (path.kind === 'straight' || !path.control) {
      ctx.lineTo(path.to.x, path.to.y);
    } else {
      ctx.quadraticCurveTo(path.control.x, path.control.y, path.to.x, path.to.y);
    }
    ctx.strokeStyle = theme.particle;
    ctx.lineWidth = LAYOUT.edgeWidth;
    ctx.setLineDash([...ANIM.dashPattern]);
    ctx.lineDashOffset = dashOffset;
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}
