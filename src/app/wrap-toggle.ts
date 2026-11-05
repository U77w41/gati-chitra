import type { CodeEditor } from './code-editor';
import type { Settings } from './storage';

export function setupWrapToggle(env: {
  el: HTMLInputElement | null;
  getSettings: () => Settings;
  editor: CodeEditor;
  save: () => void;
}): void {
  const { el, getSettings, editor, save } = env;
  if (!el) return;
  const settings = getSettings();
  el.checked = Boolean(settings.wordWrap);
  el.addEventListener('change', () => {
    settings.wordWrap = el.checked;
    editor.setWordWrap(el.checked);
    save();
  });
}
