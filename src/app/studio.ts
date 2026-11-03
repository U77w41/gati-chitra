import { handlePoint } from '../layout/geometry';
import { exportFrame } from '../render/frame';
import type { ExportMode } from '../core/types';
import { worldToScreen } from '../editor/view';
import { resolveTheme } from '../render/themes';
import type { AppState } from './state';

export interface StudioEnv {
  getState: () => AppState;
  sourceEl: HTMLTextAreaElement;
  applyNewText: (t: string) => void;
  dispatch?: (event: any) => void;
}

export function setupStudioApi(env: StudioEnv): void {
  if (
    typeof window === 'undefined' ||
    !new URLSearchParams(window.location.search).has('e2e')
  ) {
    return;
  }

  (window as any).__studio = {
    getText: () => env.sourceEl.value,
    setText: (t: string) => {
      env.sourceEl.value = t;
      env.applyNewText(t);
    },
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
    dispatch: (event: any) => {
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
  };
}
