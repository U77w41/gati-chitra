import { Compartment, Prec } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import type { Diagnostic } from '../core/types';
import { minimalChange } from '../editor/text-diff';

export interface CodeEditorEnv {
  initialText: string;
  label: string;
  wordWrap?: boolean;
  onChange(text: string): void;
  onUndo(): void;
  onRedo(): void;
  onPaste(text: string): string;
}

export interface CodeEditor {
  getText(): string;
  setText(text: string, how: 'replace' | 'patch'): void;
  setWordWrap(wrap: boolean): void;
  revealLine(line: number): void;
  focus(): void;
  destroy(): void;
  getCaret(): { line: number; col: number };
  setDiagnostics(d: Diagnostic[]): void;
  readonly view: EditorView;
}

export function createCodeEditor(
  parent: HTMLElement,
  env: CodeEditorEnv
): CodeEditor {
  parent.replaceChildren();
  let isProgrammatic = false;

  const highestKeymap = Prec.highest(
    keymap.of([
      {
        key: 'Mod-z',
        run: () => {
          env.onUndo();
          return true;
        },
      },
      {
        key: 'Mod-y',
        run: () => {
          env.onRedo();
          return true;
        },
      },
      {
        key: 'Mod-Shift-z',
        run: () => {
          env.onRedo();
          return true;
        },
      },
    ])
  );

  const wrapConf = new Compartment();
  const langConf = new Compartment();
  const lintConf = new Compartment();
  const keymapConf = new Compartment();
  let pendingDiagnostics: Diagnostic[] | null = null;
  let cmHelper: {
    setDiagnostics(view: EditorView, diags: Diagnostic[]): void;
  } | null = null;

  const view = new EditorView({
    doc: env.initialText,
    parent,
    extensions: [
      lineNumbers(),
      wrapConf.of(env.wordWrap ? EditorView.lineWrapping : []),
      lintConf.of([]),
      langConf.of([]),
      keymapConf.of([]),
      drawSelection(),
      highlightActiveLine(),
      highestKeymap,
      EditorView.contentAttributes.of({ 'aria-label': env.label }),
      EditorView.domEventHandlers({
        paste(event, v) {
          const clip = event.clipboardData?.getData('text/plain');
          if (clip !== undefined) {
            event.preventDefault();
            const text = env.onPaste(clip);
            v.dispatch(v.state.replaceSelection(text));
          }
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isProgrammatic) {
          env.onChange(update.state.doc.toString());
        }
      }),
    ],
  });

  import('./mermaid-lang').then((m) => {
    view.dispatch({
      effects: [
        langConf.reconfigure([m.mermaidLanguage, m.mermaidHighlighting]),
        lintConf.reconfigure([m.lintGutter()]),
        keymapConf.reconfigure([keymap.of(m.defaultKeymap)]),
      ],
    });
    cmHelper = {
      setDiagnostics(v, diags) {
        v.dispatch(m.setDiagnostics(v.state, m.toCmDiagnostics(v.state.doc, diags)));
      },
    };
    if (pendingDiagnostics) {
      cmHelper.setDiagnostics(view, pendingDiagnostics);
    }
  });

  return {
    view,
    getText() {
      return view.state.doc.toString();
    },
    setText(text: string, how: 'replace' | 'patch') {
      isProgrammatic = true;
      try {
        if (how === 'replace') {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: text },
          });
        } else {
          const current = view.state.doc.toString();
          const change = minimalChange(current, text);
          if (change) {
            view.dispatch({
              changes: {
                from: change.from,
                to: change.to,
                insert: change.insert,
              },
            });
          }
        }
      } finally {
        isProgrammatic = false;
      }
    },
    setWordWrap(wrap: boolean): void {
      view.dispatch({
        effects: wrapConf.reconfigure(wrap ? EditorView.lineWrapping : []),
      });
    },
    revealLine(line: number) {
      const l = Math.max(1, Math.min(line, view.state.doc.lines));
      const lineObj = view.state.doc.line(l);
      view.dispatch({
        effects: EditorView.scrollIntoView(lineObj.from, { y: 'center' }),
        selection: { anchor: lineObj.from },
      });
      view.focus();
    },
    focus() {
      view.focus();
    },
    destroy() {
      view.destroy();
    },
    getCaret() {
      const head = view.state.selection.main.head;
      const lineObj = view.state.doc.lineAt(head);
      return { line: lineObj.number, col: head - lineObj.from };
    },
    setDiagnostics(d: Diagnostic[]) {
      pendingDiagnostics = d;
      if (cmHelper) {
        cmHelper.setDiagnostics(view, d);
      }
    },
  };
}
