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
  canvasEl: HTMLCanvasElement,
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

      textarea.value = initial;
      textarea.style.display = 'block';

      const state = getState();
      const view = state.view;
      const canvasRect = canvasEl.getBoundingClientRect();
      const parentRect =
        (textarea.offsetParent as HTMLElement | null)?.getBoundingClientRect() ??
        textarea.parentElement?.getBoundingClientRect() ??
        canvasRect;
      const offsetX = canvasRect.left - parentRect.left;
      const offsetY = canvasRect.top - parentRect.top;

      if (kind === 'node') {
        const box = state.scene?.layout.nodes[id];
        if (box) {
          const center = worldToScreen(view, box.center);
          const tl = worldToScreen(view, {
            x: box.center.x - box.width / 2,
            y: box.center.y - box.height / 2,
          });
          const br = worldToScreen(view, {
            x: box.center.x + box.width / 2,
            y: box.center.y + box.height / 2,
          });
          const w = Math.max(80, br.x - tl.x);
          const h = Math.max(30, br.y - tl.y);
          textarea.style.width = `${w}px`;
          textarea.style.height = `${h}px`;
          textarea.style.left = `${offsetX + center.x - w / 2}px`;
          textarea.style.top = `${offsetY + center.y - h / 2}px`;
        }
      } else if (kind === 'edge') {
        const path = state.scene?.layout.edges[id];
        if (path) {
          const pt = worldToScreen(view, path.labelPoint);
          textarea.style.width = '100px';
          textarea.style.height = '30px';
          textarea.style.left = `${offsetX + pt.x - 50}px`;
          textarea.style.top = `${offsetY + pt.y - 15}px`;
        }
      } else if (kind === 'group') {
        const gbox = state.scene?.layout.groups[id];
        if (gbox) {
          const tl = worldToScreen(view, { x: gbox.rect.x, y: gbox.rect.y });
          textarea.style.width = `${Math.max(120, gbox.rect.width * view.zoom)}px`;
          textarea.style.height = '30px';
          textarea.style.left = `${offsetX + tl.x}px`;
          textarea.style.top = `${offsetY + tl.y}px`;
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
