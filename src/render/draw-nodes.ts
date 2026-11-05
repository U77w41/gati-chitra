import { ANIM, LAYOUT } from '../core/constants';
import type { DrawOptions, FrameState, Scene, Theme } from '../core/types';
import { drawNodeLines, drawRuns } from './draw-runs';
import { drawIcon } from './icons';
import { labelCenter } from './label-pos';
import { traceNodePath } from './node-path';
import { drawPipelineNode, traceRoundedDiamond } from './pipeline-cards';
import { drawSections } from './sections';
import { drawNodeInnerLines } from './shapes-extra';
import { nodeStyle } from './style';
import { drawWorkflowTile } from './workflow-cards';

export function drawNodes(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
  frame: FrameState,
  options: DrawOptions,
): void {
  for (const node of scene.doc.nodes) {
    const box = scene.layout.nodes[node.id];
    if (!box) continue;

    const alpha = frame.nodeAlpha?.[node.id] ?? 1;
    if (alpha <= 0) continue;

    const isDimmed = options.focus !== null && !options.focus.nodes.includes(node.id);
    const baseAlpha = isDimmed ? ANIM.dimAlpha : 1;
    ctx.globalAlpha = baseAlpha * alpha;

    const st = nodeStyle(node, theme);
    const glow = frame.nodeGlow[node.id] ?? 0;
    const hasGlow = options.showGlow && glow > 0;
    const textProg = frame.nodeTextProgress?.[node.id];

    if (options.cardMode === 'workflow') {
      const isTrigger = !scene.doc.edges.some((e) => e.to === node.id);
      drawWorkflowTile(
        ctx,
        box,
        node.label,
        isTrigger,
        st.fill,
        st.stroke,
        st.text,
        textProg,
        ctx.globalAlpha,
      );
    } else if (options.cardMode === 'pipeline') {
      drawPipelineNode(
        ctx,
        box,
        node.shape,
        node.label,
        st,
        hasGlow,
        glow,
        theme,
        textProg,
        ctx.globalAlpha,
      );
    } else {
      if (node.shape !== 'text') {
        ctx.beginPath();
        traceNodePath(ctx, box, node.shape);
        if (hasGlow) {
          ctx.shadowColor = theme.glow;
          ctx.shadowBlur = ANIM.glowBlur * glow;
        }
        ctx.fillStyle =
          node.shape === 'filledCircle' || node.shape === 'forkBar' ? st.stroke : st.fill;
        ctx.fill();
        if (hasGlow) ctx.shadowBlur = 0;
        ctx.lineWidth = st.strokeWidth;
        ctx.strokeStyle = st.stroke;
        ctx.stroke();
        drawNodeInnerLines(ctx, box, node.shape);
      }

      if (box.sections && box.sections.length > 0) {
        drawSections(ctx, box, st, textProg);
      } else if (node.icon) {
        const iconSize = Math.min(LAYOUT.iconSize, box.width * 0.6);
        const top = box.center.y - box.height / 2;
        const iconCenterY =
          node.label.length === 0
            ? box.center.y
            : top + LAYOUT.nodePadY + iconSize / 2;
        const iconColor = node.shape === 'filledCircle' ? st.fill : st.stroke;
        drawIcon(ctx, node.icon, box.center.x, iconCenterY, iconSize, iconColor);
        if (node.label.length > 0) {
          ctx.fillStyle = st.text;
          const center = labelCenter(node, box);
          if (box.runs) {
            drawRuns(ctx, box.runs, center, LAYOUT.fontSize, LAYOUT.lineHeight);
          } else {
            drawNodeLines(ctx, box, textProg, center);
          }
        }
      } else if (
        node.shape !== 'smallCircle' &&
        node.shape !== 'filledCircle' &&
        node.shape !== 'forkBar'
      ) {
        ctx.fillStyle = st.text;
        if (box.runs) {
          drawRuns(ctx, box.runs, box.center, LAYOUT.fontSize, LAYOUT.lineHeight);
        } else {
          drawNodeLines(ctx, box, textProg);
        }
      }
    }

    if (options.selection?.kind === 'node' && options.selection.id === node.id) {
      ctx.beginPath();
      if (options.cardMode === 'workflow') {
        ctx.roundRect(box.center.x - 32, box.center.y - 32, 64, 64, 16);
      } else if (options.cardMode === 'pipeline' && node.shape === 'diamond') {
        traceRoundedDiamond(ctx, box, 10);
      } else {
        traceNodePath(ctx, box, node.shape);
      }
      ctx.strokeStyle = theme.selection;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}
