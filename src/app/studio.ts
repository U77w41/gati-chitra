import { worldToScreen } from '../editor/view';
import { resolveTheme } from '../render/themes';
import type { AppState } from './state';

export interface StudioEnv {
  getState: () => AppState;
  sourceEl: HTMLTextAreaElement;
  applyNewText: (t: string) => void;
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
      return box ? worldToScreen(state.view, box.center) : null;
    },
    getEdgeScreenMid: (id: string) => {
      const state = env.getState();
      const path = state.scene?.layout.edges[id];
      return path ? worldToScreen(state.view, path.labelPoint) : null;
    },
    getSelection: () => null,
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
