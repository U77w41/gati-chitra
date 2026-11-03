import { worldToScreen } from '../editor/view';
import type { AppState } from './state';

export interface InlineEditManager {
  start: (
    kind: 'node' | 'edge' | 'group',
    id: string,
    initial: string,
    onCommit: (text: string) => void,
    onCancel: () => void,
  ) => void;
  hide: () => void;
}

export function setupInlineEditor(
  textarea: HTMLTextAreaElement,
  getState: () => AppState,
  _canvasEl: HTMLCanvasElement,
): InlineEditManager {
  let active = false;
  let currentKind: 'node' | 'edge' | 'group' = 'node';
  let commitCallback: ((t: string) => void) | null = null;
  let cancelCallback: (() => void) | null = null;

  function commit(): void {
    if (!active) return;
    active = false;
    textarea.style.display = 'none';
    const cb = commitCallback;
    commitCallback = null;
    cancelCallback = null;
    cb?.(textarea.value);
  }

  function cancel(): void {
    if (!active) return;
    active = false;
    textarea.style.display = 'none';
    const cb = cancelCallback;
    commitCallback = null;
    cancelCallback = null;
    cb?.();
  }

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey && currentKind === 'node') {
        return;
      }
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  });

  textarea.addEventListener('blur', () => {
    commit();
  });

  return {
    start(kind, id, initial, onCommit, onCancel) {
      active = true;
      currentKind = kind;
      commitCallback = onCommit;
      cancelCallback = onCancel;

      const state = getState();
      const view = state.view;

      if (kind === 'node') {
        const box = state.scene?.layout.nodes[id];
        if (box) {
          const tl = worldToScreen(view, {
            x: box.center.x - box.width / 2,
            y: box.center.y - box.height / 2,
          });
          const br = worldToScreen(view, {
            x: box.center.x + box.width / 2,
            y: box.center.y + box.height / 2,
          });
          textarea.style.left = `${tl.x}px`;
          textarea.style.top = `${tl.y}px`;
          textarea.style.width = `${Math.max(80, br.x - tl.x)}px`;
          textarea.style.height = `${Math.max(30, br.y - tl.y)}px`;
        }
      } else if (kind === 'edge') {
        const path = state.scene?.layout.edges[id];
        if (path) {
          const pt = worldToScreen(view, path.labelPoint);
          textarea.style.left = `${pt.x - 40}px`;
          textarea.style.top = `${pt.y - 15}px`;
          textarea.style.width = '100px';
          textarea.style.height = '30px';
        }
      } else if (kind === 'group') {
        const gbox = state.scene?.layout.groups[id];
        if (gbox) {
          const tl = worldToScreen(view, { x: gbox.rect.x, y: gbox.rect.y });
          textarea.style.left = `${tl.x}px`;
          textarea.style.top = `${tl.y}px`;
          textarea.style.width = `${Math.max(120, gbox.rect.width * view.zoom)}px`;
          textarea.style.height = '30px';
        }
      }

      textarea.value = initial;
      textarea.style.display = 'block';
      textarea.focus();
      textarea.select();
    },

    hide() {
      if (active) {
        active = false;
        textarea.style.display = 'none';
        commitCallback = null;
        cancelCallback = null;
      }
    },
  };
}
