import { frameState } from '../anim/anim';
import { EXPORT } from '../core/constants';
import { handlePoint } from '../layout/geometry';
import { drawBackground, drawScene } from '../render/draw';
import { exportFrame } from '../render/frame';
import type { ExportMode } from '../core/types';
import type { EditorEvent } from '../editor/controller';
import { fitView, worldToScreen } from '../editor/view';
import { resolveTheme, THEMES } from '../render/themes';
import { getDrawCount } from './render-loop';
import type { AppState } from './state';
import type { CodeEditor } from './code-editor';

export interface StudioEnv {
  getState: () => AppState;
  editor: CodeEditor;
  applyNewText: (t: string) => void;
  dispatch?: (event: EditorEvent) => void;
  getPresentStep?: () => number | null;
}

const drawOpts = (showGlow: boolean) => ({
  transparent: false,
  selection: null,
  handleNodeId: null,
  connectPreview: null,
  focus: null,
  showGlow,
});

const toScreen = (pt: { x: number; y: number }) => {
  const r = document.querySelector('#canvas')?.getBoundingClientRect();
  return r ? { x: pt.x + r.left, y: pt.y + r.top } : pt;
};

const currentScheme = () =>
  document.documentElement.getAttribute('data-scheme') === 'dark' ? 'dark' : 'light';

export function setupStudioApi(env: StudioEnv): void {
  if (
    typeof window === 'undefined' ||
    !new URLSearchParams(window.location.search).has('e2e')
  ) {
    return;
  }

  (window as unknown as { __studioEditor: unknown }).__studioEditor = env.editor.view;

  window.__studio = {
    getText: () => env.editor.getText(),
    setText: (t: string) => {
      env.editor.setText(t, 'replace');
      env.applyNewText(t);
    },
    getCaret: () => env.editor.getCaret(),
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
      const box = env.getState().scene?.layout.nodes[id];
      return box ? toScreen(worldToScreen(env.getState().view, box.center)) : null;
    },
    getEdgeScreenMid: (id: string) => {
      const path = env.getState().scene?.layout.edges[id];
      return path ? toScreen(worldToScreen(env.getState().view, path.labelPoint)) : null;
    },
    getNodeHandleScreen: (id: string) => {
      const state = env.getState();
      const box = state.scene?.layout.nodes[id];
      if (!box || !state.scene) return null;
      return toScreen(worldToScreen(state.view, handlePoint(state.scene.doc, box)));
    },
    getGroupTitleScreen: (id: string) => {
      const state = env.getState();
      const gbox = state.scene?.layout.groups[id];
      if (!gbox || !state.scene) return null;
      return toScreen(worldToScreen(state.view, { x: gbox.rect.x + 20, y: gbox.rect.y + 14 }));
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
    getResolvedTheme: () => resolveTheme(env.getState().settings.theme, currentScheme()),
    ogImage: async () => {
      const state = env.getState();
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT.ogWidth;
      canvas.height = EXPORT.ogHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx || !state.scene) return canvas.toDataURL('image/png');
      const theme = THEMES.daylight;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawBackground(ctx, theme, EXPORT.ogWidth, EXPORT.ogHeight, false);
      const view = fitView(state.scene.layout.bounds, {
        width: EXPORT.ogWidth,
        height: EXPORT.ogHeight,
      });
      const frame = frameState(state.scene, state.settings.anim, 0.25);
      drawScene(ctx, state.scene, theme, view, frame, drawOpts(state.settings.anim.glow));
      return canvas.toDataURL('image/png');
    },
    measureFrames: (count: number) => {
      const state = env.getState();
      const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const ctx = canvas?.getContext('2d');
      if (!state.scene || !ctx || count <= 0) return 0;
      const theme = THEMES[resolveTheme(state.settings.theme, currentScheme())];
      const dpr = window.devicePixelRatio || 1;
      const opts = drawOpts(state.settings.anim.glow);

      const t0 = performance.now();
      for (let i = 0; i < count; i++) {
        const phase = i / count;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        drawBackground(ctx, theme, canvas.width, canvas.height, false);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const frame = frameState(state.scene, state.settings.anim, phase);
        drawScene(ctx, state.scene, theme, state.view, frame, opts);
      }
      const t1 = performance.now();
      return (t1 - t0) / count;
    },
    getDrawCount: () => getDrawCount(),
  };
}
