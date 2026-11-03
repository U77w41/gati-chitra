import { frameState } from '../anim/anim';
import { handlePoint } from '../layout/geometry';
import { drawBackground, drawScene } from '../render/draw';
import { exportFrame } from '../render/frame';
import type { ExportMode } from '../core/types';
import type { EditorEvent } from '../editor/controller';
import { worldToScreen } from '../editor/view';
import { resolveTheme, THEMES } from '../render/themes';
import type { AppState } from './state';

export interface StudioEnv {
  getState: () => AppState;
  sourceEl: HTMLTextAreaElement;
  applyNewText: (t: string) => void;
  dispatch?: (event: EditorEvent) => void;
  getPresentStep?: () => number | null;
}

export function setupStudioApi(env: StudioEnv): void {
  if (
    typeof window === 'undefined' ||
    !new URLSearchParams(window.location.search).has('e2e')
  ) {
    return;
  }

  window.__studio = {
    getText: () => env.sourceEl.value,
    setText: (t: string) => {
      env.sourceEl.value = t;
      env.applyNewText(t);
    },
    getPresentStep: () => (env.getPresentStep ? env.getPresentStep() : null),
    getSummary: () => {
      const state = env.getState();
      return {
        nodes: state.doc.nodes.map((n) => n.id),
        edges: state.doc.edges.length,
        ok: state.doc.ok,
      };
    },
    getView: () => env.getState().view,
    getSettings: () => env.getState().settings,
    getNodeScreenCenter: (id: string) => {
      const state = env.getState();
      const box = state.scene?.layout.nodes[id];
      if (!box) return null;
      const pt = worldToScreen(state.view, box.center);
      const rect = document.querySelector('#canvas')?.getBoundingClientRect();
      return rect ? { x: pt.x + rect.left, y: pt.y + rect.top } : pt;
    },
    getEdgeScreenMid: (id: string) => {
      const state = env.getState();
      const path = state.scene?.layout.edges[id];
      if (!path) return null;
      const pt = worldToScreen(state.view, path.labelPoint);
      const rect = document.querySelector('#canvas')?.getBoundingClientRect();
      return rect ? { x: pt.x + rect.left, y: pt.y + rect.top } : pt;
    },
    getNodeHandleScreen: (id: string) => {
      const state = env.getState();
      const box = state.scene?.layout.nodes[id];
      if (!box || !state.scene) return null;
      const hp = handlePoint(state.scene.doc, box);
      const pt = worldToScreen(state.view, hp);
      const rect = document.querySelector('#canvas')?.getBoundingClientRect();
      return rect ? { x: pt.x + rect.left, y: pt.y + rect.top } : pt;
    },
    getGroupTitleScreen: (id: string) => {
      const state = env.getState();
      const gbox = state.scene?.layout.groups[id];
      if (!gbox || !state.scene) return null;
      const pt = worldToScreen(state.view, {
        x: gbox.rect.x + 20,
        y: gbox.rect.y + 14,
      });
      const rect = document.querySelector('#canvas')?.getBoundingClientRect();
      return rect ? { x: pt.x + rect.left, y: pt.y + rect.top } : pt;
    },
    dispatch: (event: EditorEvent) => {
      env.dispatch?.(event);
    },
    getSelection: () => env.getState().editor.selection,
    getExportSize: (mode: ExportMode, scale: number) => {
      const state = env.getState();
      const bounds = state.scene?.layout.bounds ?? { x: 0, y: 0, width: 0, height: 0 };
      const frame = exportFrame(bounds, mode, scale);
      return { width: frame.pixelWidth, height: frame.pixelHeight };
    },
    getResolvedTheme: () => {
      const state = env.getState();
      const scheme =
        document.documentElement.getAttribute('data-scheme') === 'dark'
          ? 'dark'
          : 'light';
      return resolveTheme(state.settings.theme, scheme);
    },
    measureFrames: (count: number) => {
      const state = env.getState();
      const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const ctx = canvas?.getContext('2d');
      if (!state.scene || !ctx || count <= 0) return 0;

      const scheme =
        document.documentElement.getAttribute('data-scheme') === 'dark'
          ? 'dark'
          : 'light';
      const themeId = resolveTheme(state.settings.theme, scheme);
      const theme = THEMES[themeId];
      const dpr = window.devicePixelRatio || 1;

      const t0 = performance.now();
      for (let i = 0; i < count; i++) {
        const phase = i / count;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        drawBackground(ctx, theme, canvas.width, canvas.height, false);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const frame = frameState(state.scene, state.settings.anim, phase);
        drawScene(ctx, state.scene, theme, state.view, frame, {
          transparent: false,
          selection: null,
          handleNodeId: null,
          connectPreview: null,
          focus: null,
          showGlow: state.settings.anim.glow,
        });
      }
      const t1 = performance.now();
      return (t1 - t0) / count;
    },
  };
}
