import { describe, expect, it, vi } from 'vitest';
import { createCodeEditor } from './code-editor';

vi.mock('@codemirror/view', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@codemirror/view')>();
  class MockEditorView {
    state: {
      doc: {
        toString: () => string;
        length: number;
        lineAt: () => { number: number; from: number };
        lines: number;
        line: (n: number) => { from: number };
      };
      selection: { main: { head: number } };
    };
    parent: unknown;
    dispatch = vi.fn((tr: { changes?: { insert: string }; effects?: unknown }) => {
      if (tr.changes) {
        const text = tr.changes.insert;
        this.state.doc = {
          toString: () => text,
          length: text.length,
          lineAt: () => ({ number: 1, from: 0 }),
          lines: 1,
          line: () => ({ from: 0 }),
        };
      }
    });
    destroy = vi.fn();
    focus = vi.fn();

    constructor(opts: { doc: string; parent: unknown }) {
      this.parent = opts.parent;
      this.state = {
        doc: {
          toString: () => opts.doc,
          length: opts.doc.length,
          lineAt: () => ({ number: 1, from: 0 }),
          lines: 1,
          line: () => ({ from: 0 }),
        },
        selection: { main: { head: 0 } },
      };
    }

    static lineWrapping = { extension: 'lineWrapping' };
    static contentAttributes = { of: vi.fn(() => []) };
    static domEventHandlers = vi.fn(() => []);
    static updateListener = { of: vi.fn(() => []) };
    static scrollIntoView = vi.fn(() => ({}));
  }

  return {
    ...actual,
    EditorView: MockEditorView,
    lineNumbers: vi.fn(() => []),
    drawSelection: vi.fn(() => []),
    highlightActiveLine: vi.fn(() => []),
    keymap: { of: vi.fn(() => []) },
  };
});

describe('code-editor', () => {
  it('creates an editor with initial text and toggles word wrap', () => {
    const parent = { replaceChildren: vi.fn() } as unknown as HTMLElement;
    const onChange = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onPaste = vi.fn((t: string) => t);

    const editor = createCodeEditor(parent, {
      initialText: 'graph TD\nA --> B',
      label: 'Test editor',
      wordWrap: false,
      onChange,
      onUndo,
      onRedo,
      onPaste,
    });

    expect(editor.getText()).toBe('graph TD\nA --> B');

    // Toggle word wrap
    expect(() => editor.setWordWrap(true)).not.toThrow();
    expect(editor.view.dispatch).toHaveBeenCalled();

    expect(() => editor.setWordWrap(false)).not.toThrow();
    expect(editor.getText()).toBe('graph TD\nA --> B');

    editor.destroy();
    expect(editor.view.destroy).toHaveBeenCalled();
  });

  it('initializes with wordWrap true without error', () => {
    const parent = { replaceChildren: vi.fn() } as unknown as HTMLElement;
    const editor = createCodeEditor(parent, {
      initialText: 'graph LR\nX --> Y',
      label: 'Wrapped editor',
      wordWrap: true,
      onChange: () => {},
      onUndo: () => {},
      onRedo: () => {},
      onPaste: (t) => t,
    });

    expect(editor.getText()).toBe('graph LR\nX --> Y');
    editor.setText('graph LR\nX --> Z', 'replace');
    expect(editor.getText()).toBe('graph LR\nX --> Z');

    editor.destroy();
  });
});
