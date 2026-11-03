import { wheelFactor, zoomAt } from '../editor/view';
import type { EditorEvent, EditorState } from '../editor/controller';
import { screenToWorld } from '../editor/view';
import type { AppState } from './state';

export interface CanvasEventsEnv {
  canvasEl: HTMLCanvasElement;
  getState: () => AppState;
  dispatch: (event: EditorEvent) => void;
  updateView: (fn: (v: AppState['view']) => AppState['view']) => void;
}

export function setupCanvasEvents(env: CanvasEventsEnv): void {
  const { canvasEl, getState, dispatch, updateView } = env;

  let spaceHeld = false;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
      spaceHeld = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      spaceHeld = false;
    }
  });

  canvasEl.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const rect = canvasEl.getBoundingClientRect();
      const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const factor = wheelFactor(e.deltaY, e.deltaMode);
      updateView((v) => zoomAt(v, pt, factor));
    },
    { passive: false },
  );

  canvasEl.addEventListener('pointerdown', (e) => {
    try {
      canvasEl.setPointerCapture(e.pointerId);
    } catch {}
    const rect = canvasEl.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const world = screenToWorld(getState().view, screen);
    dispatch({
      type: 'pointerDown',
      world,
      screen,
      button: e.button,
      space: spaceHeld,
    });
  });

  canvasEl.addEventListener('pointermove', (e) => {
    const rect = canvasEl.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const world = screenToWorld(getState().view, screen);
    dispatch({
      type: 'pointerMove',
      world,
      screen,
    });
  });

  const onPointerUp = (e: PointerEvent) => {
    try {
      canvasEl.releasePointerCapture(e.pointerId);
    } catch {}
    const rect = canvasEl.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const world = screenToWorld(getState().view, screen);
    dispatch({
      type: 'pointerUp',
      world,
      screen,
    });
  };

  canvasEl.addEventListener('pointerup', onPointerUp);
  canvasEl.addEventListener('pointercancel', onPointerUp);
}
