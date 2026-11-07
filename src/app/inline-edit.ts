import { FONT_STACK_SANS, LAYOUT } from '../core/constants';
import { worldToScreen } from '../editor/view';
import { EDITOR, editorFontPx, editorWidth } from './inline-edit-box';
import type { AppState } from './state';

// The size each kind of label is drawn at on the canvas (group titles are 14 px in svg.ts and on canvas).
const LABEL_PX = { node: LAYOUT.fontSize, edge: LAYOUT.edgeLabelFontSize, group: 14 } as const;

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
  // Where the pill is pinned: its centre for node and arrow labels, its top-left for group titles.
  let anchor: { x: number; y: number; centred: boolean } | null = null;
  let measure: CanvasRenderingContext2D | null = null;

  function fit(): void {
    if (!anchor) return;
    measure ??= document.createElement('canvas').getContext('2d');
    const px = parseFloat(textarea.style.fontSize) || LAYOUT.fontSize;
    if (measure) measure.font = `${px}px ${FONT_STACK_SANS}`;
    const widths = textarea.value.split('\n').map((line) => measure?.measureText(line).width ?? line.length * px * 0.6);
    const w = editorWidth(widths);
    textarea.style.width = `${w}px`;
    textarea.style.height = 'auto';
    const h = textarea.scrollHeight + 2 * EDITOR.border;
    textarea.style.height = `${h}px`;
    textarea.style.left = `${anchor.centred ? anchor.x - w / 2 : anchor.x}px`;
    textarea.style.top = `${anchor.centred ? anchor.y - h / 2 : anchor.y}px`;
  }

  function commit(): void {
    if (!active) return;
    active = false;
    textarea.style.display = 'none';
    const cb = commitCallback;
    commitCallback = null;
    cancelCallback = null;
    cb?.(textarea.value);
    canvasEl.focus();
  }

  function cancel(): void {
    if (!active) return;
    active = false;
    textarea.style.display = 'none';
    const cb = cancelCallback;
    commitCallback = null;
    cancelCallback = null;
    cb?.();
    canvasEl.focus();
  }

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey && currentKind === 'node') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    }
  });

  textarea.addEventListener('blur', () => {
    commit();
  });

  textarea.addEventListener('input', fit);

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

      anchor = null;
      if (kind === 'node') {
        const box = state.scene?.layout.nodes[id];
        if (box) {
          const c = worldToScreen(view, box.center);
          anchor = { x: offsetX + c.x, y: offsetY + c.y, centred: true };
        }
      } else if (kind === 'edge') {
        const path = state.scene?.layout.edges[id];
        if (path) {
          const c = worldToScreen(view, path.labelPoint);
          anchor = { x: offsetX + c.x, y: offsetY + c.y, centred: true };
        }
      } else if (kind === 'group') {
        const gbox = state.scene?.layout.groups[id];
        if (gbox) {
          const tl = worldToScreen(view, { x: gbox.rect.x, y: gbox.rect.y });
          anchor = { x: offsetX + tl.x + 4, y: offsetY + tl.y + 2, centred: false };
        }
      }
      textarea.style.fontFamily = FONT_STACK_SANS;
      textarea.style.fontSize = `${editorFontPx(LABEL_PX[kind], view.zoom)}px`;
      textarea.style.textAlign = kind === 'group' ? 'left' : 'center';

      textarea.value = initial;
      textarea.style.display = 'block';
      fit();
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
