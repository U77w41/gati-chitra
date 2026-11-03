/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
  readonly VITE_SOURCE_URL: string;
}

interface StudioApi {
  getText: () => string;
  setText: (t: string) => void;
  getPresentStep: () => number | null;
  getSummary: () => { nodes: string[]; edges: number; ok: boolean };
  getView: () => import('./core/types').Viewport;
  getSettings: () => import('./app/storage').Settings;
  getNodeScreenCenter: (id: string) => { x: number; y: number } | null;
  getEdgeScreenMid: (id: string) => { x: number; y: number } | null;
  getNodeHandleScreen: (id: string) => { x: number; y: number } | null;
  getGroupTitleScreen: (id: string) => { x: number; y: number } | null;
  dispatch: (event: import('./editor/controller').EditorEvent) => void;
  getSelection: () => import('./editor/controller').Selection | null;
  getExportSize: (
    mode: import('./core/types').ExportMode,
    scale: number
  ) => { width: number; height: number };
  getResolvedTheme: () => import('./core/types').ThemeId;
  measureFrames: (count: number) => number;
  getDrawCount: () => number;
}

interface Window {
  __studio?: StudioApi;
}
