import type { ParsedDoc, Scene, ViewState } from '../core/types';
import type { Settings } from './storage';
import { parseDocument } from '../diagrams/parse-any';
import { tryBuildScene } from '../layout/scene';
import type { MeasureText } from '../layout/measure';
import { canvasMeasure } from '../layout/measure';
import { MESSAGES } from '../core/constants';
import {
  createHistory,
  pushText,
  redo,
  undo,
  type History,
} from '../editor/history';
import {
  createEditorState,
  reduce,
  type EditorEnv,
  type EditorState,
} from '../editor/controller';

export type CommitSource =
  | 'typing'
  | 'op'
  | 'undo'
  | 'redo'
  | 'open'
  | 'template'
  | 'share';

export interface AppState {
  text: string;
  doc: ParsedDoc;
  scene: Scene | null;
  view: ViewState;
  settings: Settings;
  paused: boolean;
  history: History;
  editor: EditorState;
  lastTypingTime: number;
}

export function createState(text: string, settings: Settings): AppState {
  const doc = parseDocument(text);
  const measure = canvasMeasure();
  let scene: Scene | null = null;
  if (doc.ok) {
    scene = tryBuildScene(doc, measure);
    if (!scene) {
      doc.diagnostics.push({ line: 1, severity: 'error', message: MESSAGES.layoutFailed });
      doc.ok = false;
    }
  }
  const view: ViewState = { zoom: 1, panX: 0, panY: 0 };
  const history = createHistory(text);
  const editor = createEditorState();

  return {
    text,
    doc,
    scene,
    view,
    settings,
    paused: false,
    history,
    editor,
    lastTypingTime: 0,
  };
}

export function applyText(
  state: AppState,
  text: string,
  measure: MeasureText,
): AppState {
  const doc = parseDocument(text);
  let scene = state.scene;
  if (doc.ok) {
    const nextScene = tryBuildScene(doc, measure);
    if (nextScene) {
      scene = nextScene;
    } else {
      doc.diagnostics.push({ line: 1, severity: 'error', message: MESSAGES.layoutFailed });
      doc.ok = false;
    }
  }

  return {
    ...state,
    text,
    doc,
    scene,
  };
}

export function commitText(
  state: AppState,
  text: string,
  source: CommitSource,
  measure: MeasureText,
  opts?: { coalesce?: boolean },
): AppState {
  const now = Date.now();
  let history = state.history;
  let targetText = text;

  if (source === 'undo') {
    history = undo(state.history);
    targetText = history.present;
  } else if (source === 'redo') {
    history = redo(state.history);
    targetText = history.present;
  } else {
    const coalesce =
      opts?.coalesce ??
      (source === 'typing' && now - state.lastTypingTime < 1000);
    history = pushText(state.history, targetText, { coalesce });
  }

  const newState = applyText(state, targetText, measure);

  let editor = newState.editor;
  if (source !== 'op') {
    const env: EditorEnv = {
      scene: newState.scene ?? {
        doc: newState.doc,
        layout: {
          nodes: {},
          groups: {},
          edges: {},
          bounds: { x: 0, y: 0, width: 0, height: 0 },
          title: null,
        },
      },
      ok: newState.doc.ok,
      measure,
    };
    editor = reduce(editor, { type: 'textChanged' }, env).state;
  }

  return {
    ...newState,
    history,
    editor,
    lastTypingTime: source === 'typing' ? now : 0,
  };
}

export function reparseCurrent(state: AppState, measure: MeasureText): AppState {
  return applyText(state, state.text, measure);
}

