import { ANIM, FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { DrawOptions, FrameState, Scene, Theme } from '../core/types';
import { tangentAt } from '../layout/geometry';
import { fontString } from '../layout/measure';
import { parseInlineMarkdown } from '../layout/rich-text';
import { drawMarker, markerPrims } from './markers';
import { edgeStyle } from './style';

export function drawEdges(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
  options: DrawOptions,
  frame?: FrameState,
): void {
  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    const path = scene.layout.edges[edge.id];
    if (!path) continue;

    const grow =
      frame?.edgeGrow?.[edge.id] !== undefined
        ? Math.max(0, Math.min(1, frame.edgeGrow[edge.id]))
        : 1;
    if (grow <= 0) continue;

    const st = edgeStyle(edge, theme);
    const isDimmed = options.focus !== null && !options.focus.edges.includes(edge.id);
    if (isDimmed) {
      ctx.globalAlpha = ANIM.dimAlpha;
    }

    ctx.beginPath();
    ctx.moveTo(path.from.x, path.from.y);

    let to = path.to;
    let t = tangentAt(path, 1);

    if (path.kind === 'straight' || !path.control) {
      if (grow < 1) {
        to = {
          x: path.from.x + (path.to.x - path.from.x) * grow,
          y: path.from.y + (path.to.y - path.from.y) * grow,
        };
      }
      ctx.lineTo(to.x, to.y);
    } else {
      if (grow < 1) {
        const u = grow;
        const p0 = path.from;
        const p1 = path.control;
        const p2 = path.to;
        const q1 = { x: (1 - u) * p0.x + u * p1.x, y: (1 - u) * p0.y + u * p1.y };
        const q2 = {
          x: (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x,
          y: (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y,
        };
        ctx.quadraticCurveTo(q1.x, q1.y, q2.x, q2.y);
        to = q2;
        t = tangentAt(path, u);
      } else {
        ctx.quadraticCurveTo(path.control.x, path.control.y, path.to.x, path.to.y);
      }
    }

    ctx.lineWidth = st.width;
    ctx.strokeStyle = st.stroke;
    ctx.lineCap = 'round';
    ctx.setLineDash(st.dash ?? []);
    ctx.stroke();
    ctx.setLineDash([]);

    const n = { x: -t.y, y: t.x };
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
    } else if (st.endMarker !== 'none') {
      const prims = markerPrims(st.endMarker, to, t);
      drawMarker(ctx, prims, st.stroke, theme.background, st.width);
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
    } else if (st.startMarker !== 'none') {
      const t0 = tangentAt(path, 0);
      const u0 = { x: -t0.x, y: -t0.y };
      const prims = markerPrims(st.startMarker, path.from, u0);
      drawMarker(ctx, prims, st.stroke, theme.background, st.width);
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
  frame?: FrameState,
): void {
  for (const edge of scene.doc.edges) {
    if (edge.label && edge.label.length > 0) {
      if (frame?.edgeTextProgress?.[edge.id] !== undefined) {
        const prog = Math.max(0, Math.min(1, frame.edgeTextProgress[edge.id]));
        if (prog <= 0) continue;
      }
      const path = scene.layout.edges[edge.id];
      if (!path) continue;

      let labelText = edge.label;
      if (frame?.edgeTextProgress?.[edge.id] !== undefined) {
        const prog = Math.max(0, Math.min(1, frame.edgeTextProgress[edge.id]));
        const count = Math.floor(edge.label.length * prog);
        if (count <= 0) continue;
        labelText = edge.label.slice(0, count);
      }

      let w = 0;
      if (edge.markdown) {
        const runs = parseInlineMarkdown(labelText);
        for (const r of runs) {
          ctx.font = fontString(13, r);
          w += ctx.measureText(r.text).width;
        }
        w += 2 * LAYOUT.edgeLabelPadX;
      } else {
        ctx.font = `13px ${FONT_STACK_SANS}`;
        w = ctx.measureText(labelText).width + 2 * LAYOUT.edgeLabelPadX;
      }
      const h = LAYOUT.edgeLabelH;
      ctx.beginPath();
      ctx.roundRect(path.labelPoint.x - w / 2, path.labelPoint.y - h / 2, w, h, LAYOUT.edgeLabelRadius);
      ctx.fillStyle = theme.edgeLabelBg;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = theme.edge;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = theme.edgeLabelText;
      if (edge.markdown) {
        const runs = parseInlineMarkdown(labelText);
        let curX = path.labelPoint.x - (w - 2 * LAYOUT.edgeLabelPadX) / 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (const r of runs) {
          ctx.font = fontString(13, r);
          ctx.fillText(r.text, curX, path.labelPoint.y);
          curX += ctx.measureText(r.text).width;
        }
      } else {
        ctx.font = `13px ${FONT_STACK_SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, path.labelPoint.x, path.labelPoint.y);
      }
    }
  }
}

export function drawEdgeDashOverlay(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
  dashOffset: number,
  edgeGrow?: Record<string, number>,
): void {
  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    // A full-length dashed stroke over a half-grown edge would reveal it before the build reaches it.
    const grow = edgeGrow?.[edge.id];
    if (grow !== undefined && grow < 1) continue;
    const path = scene.layout.edges[edge.id];
    if (!path) continue;
    ctx.beginPath();
    ctx.moveTo(path.from.x, path.from.y);
    if (path.kind === 'straight' || !path.control) {
      ctx.lineTo(path.to.x, path.to.y);
    } else {
      ctx.quadraticCurveTo(path.control.x, path.control.y, path.to.x, path.to.y);
    }
    const st = edgeStyle(edge, theme);
    ctx.strokeStyle = st.stroke !== theme.edge ? st.stroke : theme.particle;
    ctx.lineWidth = st.width || LAYOUT.edgeWidth;
    ctx.setLineDash([...ANIM.dashPattern]);
    ctx.lineDashOffset = dashOffset;
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}
