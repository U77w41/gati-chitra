import { frameState, phaseAt } from '../anim/anim';
import type { MeasureText } from '../layout/measure';
import { withNodeAt } from '../layout/scene';
import { drawBackground, drawScene } from '../render/draw';
import { THEMES, resolveTheme } from '../render/themes';
import type { AppState } from './state';

export interface RenderLoopEnv {
  canvasEl: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  getState: () => AppState;
  measure: MeasureText;
  startTime: number;
  getPausedPhase: () => number;
}

export function startRenderLoop(env: RenderLoopEnv): () => void {
  const { canvasEl, ctx, getState, measure, startTime, getPausedPhase } = env;
  let animId: number;

  function render(): void {
    const state = getState();
    const scheme =
      document.documentElement.getAttribute('data-scheme') === 'dark'
        ? 'dark'
        : 'light';
    const themeId = resolveTheme(state.settings.theme, scheme);
    const theme = THEMES[themeId];
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBackground(ctx, theme, canvasEl.width, canvasEl.height, false);

    let sceneToDraw = state.scene;
    if (state.scene && state.editor.drag && state.editor.drag.moved) {
      const { nodeId, current, grab } = state.editor.drag;
      const targetCenter = { x: current.x - grab.x, y: current.y - grab.y };
      sceneToDraw = withNodeAt(state.scene, nodeId, targetCenter, measure);
    }

    if (sceneToDraw) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const elapsed = (performance.now() - startTime) / 1000;
      const phase = state.paused
        ? getPausedPhase()
        : phaseAt(elapsed, state.settings.anim);
      const frame = frameState(sceneToDraw, state.settings.anim, phase);
      drawScene(ctx, sceneToDraw, theme, state.view, frame, {
        transparent: false,
        selection: state.editor.selection,
        handleNodeId: null,
        connectPreview: null,
        focus: null,
        showGlow: state.settings.anim.glow,
      });
    }

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);
  return () => cancelAnimationFrame(animId);
}
