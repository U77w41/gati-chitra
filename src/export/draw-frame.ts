import type { AnimSettings, CardStyleMode, Scene, Theme, ViewState } from '../core/types';
import { frameState } from '../anim/anim';
import { drawBackground, drawScene } from '../render/draw';

export function drawExportFrame(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  theme: Theme,
  anim: AnimSettings,
  view: ViewState,
  phase: number,
  width: number,
  height: number,
  cardMode?: CardStyleMode,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBackground(ctx, theme, width, height, false);
  drawScene(ctx, scene, theme, view, frameState(scene, anim, phase), {
    transparent: false,
    selection: null,
    handleNodeId: null,
    connectPreview: null,
    focus: null,
    showGlow: anim.glow,
    showGrid: false,
    cardMode,
  });
}
