import type { ParsedDoc, Scene, ViewState } from '../core/types';
import type { Settings } from './storage';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import type { MeasureText } from '../layout/measure';
import { canvasMeasure } from '../layout/measure';

export interface AppState {
  text: string;
  doc: ParsedDoc;
  scene: Scene | null;
  view: ViewState;
  settings: Settings;
  paused: boolean;
}

export function createState(text: string, settings: Settings): AppState {
  const doc = parseMermaid(text);
  const measure = canvasMeasure();
  const scene = doc.ok ? buildScene(doc, measure) : null;
  const view: ViewState = { zoom: 1, panX: 0, panY: 0 };

  return {
    text,
    doc,
    scene,
    view,
    settings,
    paused: false,
  };
}

export function applyText(
  state: AppState,
  text: string,
  measure: MeasureText,
): AppState {
  const doc = parseMermaid(text);
  const scene = doc.ok ? buildScene(doc, measure) : state.scene;

  return {
    ...state,
    text,
    doc,
    scene,
  };
}
