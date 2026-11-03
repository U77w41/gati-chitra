import type { AnimStyle, Focus } from '../core/types';
import { frameState, phaseAt } from '../anim/anim';
import { handlePoint } from '../layout/geometry';
import type { MeasureText } from '../layout/measure';
import { withNodeAt } from '../layout/scene';
import { drawBackground, drawScene } from '../render/draw';
import { THEMES, resolveTheme } from '../render/themes';
import type { AppState } from './state';

let dirty = true;
let drawCount = 0;

export function shouldDraw(s: {
  dirty: boolean;
  paused: boolean;
  style: AnimStyle;
  presenting: boolean;
}): boolean {
  return s.dirty || (!s.paused && s.style !== 'off') || s.presenting;
}

export function requestRedraw(): void {
  dirty = true;
}

export function getDrawCount(): number {
  return drawCount;
}

export function resetDrawCount(): void {
  drawCount = 0;
}

export interface RenderLoopEnv {
  canvasEl: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  getState: () => AppState;
  measure: MeasureText;
  startTime: number;
  getPausedPhase: () => number;
  getFocus?: () => Focus | null;
  isPresenting?: () => boolean;
}

export function startRenderLoop(env: RenderLoopEnv): () => void {
  const {
    canvasEl,
    ctx,
    getState,
    measure,
    startTime,
    getPausedPhase,
    getFocus,
    isPresenting,
  } = env;
  let animId: number;

  function syncCanvasSize(): boolean {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const w = Math.round((canvasEl.clientWidth || 0) * dpr);
    const h = Math.round((canvasEl.clientHeight || 0) * dpr);
    if (w > 0 && h > 0 && (canvasEl.width !== w || canvasEl.height !== h)) {
      canvasEl.width = w;
      canvasEl.height = h;
      return true;
    }
    return false;
  }

  syncCanvasSize();

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          requestRedraw();
        })
      : null;
  if (ro && typeof canvasEl.addEventListener === 'function') {
    ro.observe(canvasEl);
  }

  function render(): void {
    const state = getState();
    const presenting = isPresenting ? isPresenting() : false;
    const style = state.settings.anim.style;
    const paused = state.paused;

    if (!shouldDraw({ dirty, paused, style, presenting })) {
      animId = requestAnimationFrame(render);
      return;
    }
    dirty = false;
    drawCount++;

    syncCanvasSize();

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
      const connectPreview =
        state.editor.connect && sceneToDraw.layout.nodes[state.editor.connect.fromId]
          ? {
              from: handlePoint(
                sceneToDraw.doc,
                sceneToDraw.layout.nodes[state.editor.connect.fromId],
              ),
              to: state.editor.connect.to,
            }
          : null;
      drawScene(ctx, sceneToDraw, theme, state.view, frame, {
        transparent: false,
        selection: state.editor.selection,
        handleNodeId:
          state.editor.selection?.kind === 'node'
            ? state.editor.selection.id
            : null,
        connectPreview,
        focus: getFocus ? getFocus() : null,
        showGlow: state.settings.anim.glow,
      });
    }

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);
  return () => {
    if (ro) ro.disconnect();
    cancelAnimationFrame(animId);
  };
}
