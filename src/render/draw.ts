import { ANIM, FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type {
  DrawOptions,
  FrameState,
  Scene,
  Theme,
  ViewState,
} from '../core/types';
import { handlePoint, pointOnPath } from '../layout/geometry';
import { drawEdgeDashOverlay, drawEdgeLabels, drawEdges } from './draw-edges';
import { traceNodePath } from './node-path';
import { prepare } from './prepared';
import { edgeStyle, nodeStyle } from './style';

export type Ctx2D = CanvasRenderingContext2D;

export { edgeStyle, nodeStyle };

export function emptyFrame(): FrameState {
  return { particles: [], dashOffset: null, nodeGlow: {} };
}

export function drawBackground(
  ctx: Ctx2D,
  theme: Theme,
  width: number,
  height: number,
  transparent: boolean,
): void {
  if (transparent) {
    ctx.clearRect(0, 0, width, height);
  } else if (theme.backgroundGradient) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, theme.backgroundGradient[0]);
    grad.addColorStop(1, theme.backgroundGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);
  }
}

export function drawScene(
  ctx: Ctx2D,
  scene: Scene,
  theme: Theme,
  view: ViewState,
  frame: FrameState,
  options: DrawOptions,
): void {
  ctx.save();
  ctx.translate(view.panX, view.panY);
  ctx.scale(view.zoom, view.zoom);

  // 2. Groups
  const prep = prepare(scene);
  for (const gid of prep.groupOrder) {
    const g = scene.layout.groups[gid];
    if (!g) continue;
    ctx.beginPath();
    ctx.roundRect(g.rect.x, g.rect.y, g.rect.width, g.rect.height, 10);
    ctx.fillStyle = theme.groupFill;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.groupStroke;
    ctx.stroke();

    ctx.font = `bold 14px ${FONT_STACK_SANS}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.groupTitle;
    ctx.fillText(g.title, g.rect.x + 12, g.rect.y + LAYOUT.groupTitleH / 2);
  }

  // 3. Edges
  drawEdges(ctx, scene, theme, options);

  // 4. Edge labels
  drawEdgeLabels(ctx, scene, theme);

  // 5. Dash overlay
  if (frame.dashOffset !== null) {
    drawEdgeDashOverlay(ctx, scene, theme, frame.dashOffset);
  }

  // 6. Particles
  for (const particle of frame.particles) {
    const path = scene.layout.edges[particle.edgeId];
    if (!path) continue;
    const p = pointOnPath(path, particle.u);
    const isDimmed = options.focus !== null && !options.focus.edges.includes(particle.edgeId);
    ctx.globalAlpha = particle.alpha * (isDimmed ? ANIM.dimAlpha : 1);
    ctx.beginPath();
    ctx.arc(p.x, p.y, ANIM.particleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = theme.particle;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 7. Nodes
  for (const node of scene.doc.nodes) {
    const box = scene.layout.nodes[node.id];
    if (!box) continue;

    const isDimmed = options.focus !== null && !options.focus.nodes.includes(node.id);
    if (isDimmed) {
      ctx.globalAlpha = ANIM.dimAlpha;
    }

    const st = nodeStyle(node, theme);
    const glow = frame.nodeGlow[node.id] ?? 0;
    const hasGlow = options.showGlow && glow > 0;

    if (node.shape !== 'text') {
      ctx.beginPath();
      traceNodePath(ctx, box, node.shape);

      if (hasGlow) {
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = ANIM.glowBlur * glow;
      }

      ctx.fillStyle =
        node.shape === 'filledCircle' || node.shape === 'forkBar'
          ? st.stroke
          : st.fill;
      ctx.fill();

      if (hasGlow) {
        ctx.shadowBlur = 0;
      }

      ctx.lineWidth = st.strokeWidth;
      ctx.strokeStyle = st.stroke;
      ctx.stroke();

      if (node.shape === 'cylinder') {
        const rx = box.width / 2;
        const ry = 8;
        const t = box.center.y - box.height / 2;
        ctx.beginPath();
        ctx.ellipse(box.center.x, t + ry, rx, ry, 0, 0, Math.PI);
        ctx.stroke();
      } else if (node.shape === 'subroutine') {
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
      } else if (node.shape === 'doubleCircle' || node.shape === 'framedCircle') {
        const rInner = Math.max(0, box.width / 2 - LAYOUT.doubleCircleGap);
        ctx.beginPath();
        ctx.arc(box.center.x, box.center.y, rInner, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    if (
      node.shape !== 'smallCircle' &&
      node.shape !== 'filledCircle' &&
      node.shape !== 'forkBar'
    ) {
      ctx.font = `16px ${FONT_STACK_SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = st.text;
      for (let k = 0; k < box.lines.length; k++) {
        const y =
          box.center.y + (k - (box.lines.length - 1) / 2) * LAYOUT.lineHeight;
        ctx.fillText(box.lines[k], box.center.x, y);
      }
    }

    if (options.selection?.kind === 'node' && options.selection.id === node.id) {
      ctx.beginPath();
      traceNodePath(ctx, box, node.shape);
      ctx.strokeStyle = theme.selection;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (isDimmed) {
      ctx.globalAlpha = 1;
    }
  }

  // 8. Selection of edge or group
  if (options.selection?.kind === 'edge') {
    const edge = scene.doc.edges.find((e) => e.id === options.selection?.id);
    const path = scene.layout.edges[options.selection.id];
    if (edge && path) {
      const st = edgeStyle(edge, theme);
      ctx.beginPath();
      ctx.moveTo(path.from.x, path.from.y);
      if (path.kind === 'straight' || !path.control) {
        ctx.lineTo(path.to.x, path.to.y);
      } else {
        ctx.quadraticCurveTo(path.control.x, path.control.y, path.to.x, path.to.y);
      }
      ctx.strokeStyle = theme.selection;
      ctx.lineWidth = st.width + 2;
      ctx.stroke();
    }
  } else if (options.selection?.kind === 'group') {
    const g = scene.layout.groups[options.selection.id];
    if (g) {
      ctx.beginPath();
      ctx.roundRect(g.rect.x, g.rect.y, g.rect.width, g.rect.height, 10);
      ctx.strokeStyle = theme.selection;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // 9. Handle
  if (options.handleNodeId && scene.layout.nodes[options.handleNodeId]) {
    const box = scene.layout.nodes[options.handleNodeId];
    const hp = handlePoint(scene.doc, box);
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, LAYOUT.handleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = theme.selection;
    ctx.fill();
  }

  // 10. Connect preview
  if (options.connectPreview) {
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = theme.selection;
    ctx.beginPath();
    ctx.moveTo(options.connectPreview.from.x, options.connectPreview.from.y);
    ctx.lineTo(options.connectPreview.to.x, options.connectPreview.to.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 11. Restore
  ctx.restore();
}
