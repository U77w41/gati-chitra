import { TOUCH } from '../core/constants';
import type { Point } from '../core/types';
import {
  createGestureState,
  gestureStep,
  type GestureEvent,
  type GestureState,
} from '../editor/gestures';
import { panBy, screenToWorld, zoomAt } from '../editor/view';
import { hitTest } from '../layout/geometry';
import { capsOf } from './kind-ui';
import type { CanvasEventsEnv } from './canvas-events';

export interface TouchWiring {
  onPointerDown(e: PointerEvent): void;
  onPointerMove(e: PointerEvent): void;
  onPointerUp(e: PointerEvent): void;
  onPointerCancel(e: PointerEvent): void;
}

export function createTouchWiring(env: CanvasEventsEnv): TouchWiring {
  const { canvasEl, getState, dispatch, updateView } = env;

  let gestureState: GestureState = createGestureState();
  let tickInterval: ReturnType<typeof setInterval> | null = null;
  const activePointers = new Set<number>();
  let dragMode: 'controller' | 'pan' | null = null;
  let lastPanScreen: Point = { x: 0, y: 0 };

  function handleEvents(res: { state: GestureState; events: GestureEvent[] }): void {
    gestureState = res.state;
    for (const ev of res.events) {
      processEvent(ev);
    }
  }

  function processEvent(ev: GestureEvent): void {
    const state = getState();

    switch (ev.type) {
      case 'tap': {
        const world = screenToWorld(state.view, ev.at);
        const caps = capsOf(state.doc);
        const selNodeId =
          state.editor.selection?.kind === 'node' && caps.connect ? state.editor.selection.id : null;
        const hit = state.scene
          ? hitTest(state.scene, world, selNodeId, TOUCH.hitTolerance)
          : null;

        if (hit?.kind === 'node') {
          dispatch({ type: 'select', selection: { kind: 'node', id: hit.id } });
        } else if (hit?.kind === 'edge' || hit?.kind === 'group') {
          dispatch({ type: 'select', selection: { kind: hit.kind, id: hit.id } });
        } else {
          dispatch({ type: 'select', selection: null });
        }
        env.requestRedraw?.();
        break;
      }

      case 'dragStart': {
        const world = screenToWorld(state.view, ev.at);
        const caps = capsOf(state.doc);
        const selNodeId =
          state.editor.selection?.kind === 'node' && caps.connect ? state.editor.selection.id : null;
        const hit = state.scene
          ? hitTest(state.scene, world, selNodeId, TOUCH.hitTolerance)
          : null;

        if ((hit?.kind === 'node' && caps.move) || (hit?.kind === 'handle' && caps.connect)) {
          dragMode = 'controller';
          dispatch({
            type: 'pointerDown',
            world,
            screen: ev.at,
            button: 0,
            space: false,
          });
        } else {
          dragMode = 'pan';
          lastPanScreen = ev.at;
        }
        break;
      }

      case 'dragMove': {
        if (dragMode === 'controller') {
          const world = screenToWorld(state.view, ev.at);
          dispatch({ type: 'pointerMove', world, screen: ev.at });
        } else if (dragMode === 'pan') {
          const dx = ev.at.x - lastPanScreen.x;
          const dy = ev.at.y - lastPanScreen.y;
          lastPanScreen = ev.at;
          updateView((v) => panBy(v, dx, dy));
          env.requestRedraw?.();
        }
        break;
      }

      case 'dragEnd': {
        if (dragMode === 'controller') {
          const world = screenToWorld(state.view, ev.at);
          dispatch({ type: 'pointerUp', world, screen: ev.at });
        }
        dragMode = null;
        break;
      }

      case 'dragCancel': {
        if (dragMode === 'controller') {
          dispatch({ type: 'cancelEdit' });
          const curState = getState();
          curState.editor.drag = null;
          curState.editor.connect = null;
          curState.editor.pan = null;
          env.requestRedraw?.();
        }
        dragMode = null;
        break;
      }

      case 'pinch': {
        updateView((v) => {
          const zoomed = zoomAt(v, ev.center, ev.scale);
          return panBy(zoomed, ev.dx, ev.dy);
        });
        env.requestRedraw?.();
        break;
      }

      case 'pinchEnd': {
        break;
      }

      case 'longPress': {
        const world = screenToWorld(state.view, ev.at);
        const caps = capsOf(state.doc);
        const selNodeId =
          state.editor.selection?.kind === 'node' && caps.connect ? state.editor.selection.id : null;
        const hit = state.scene
          ? hitTest(state.scene, world, selNodeId, TOUCH.hitTolerance)
          : null;

        if (hit?.kind === 'node' || hit?.kind === 'edge') {
          const propsEl = document.querySelector<HTMLElement>('#props');
          if (propsEl) propsEl.hidden = false;
          dispatch({ type: 'select', selection: { kind: hit.kind, id: hit.id } });
          const firstInput = propsEl?.querySelector<HTMLInputElement>('#prop-label');
          if (caps.rename) {
            firstInput?.focus();
          }
          env.requestRedraw?.();
        }
        break;
      }

      case 'doubleTap': {
        const world = screenToWorld(state.view, ev.at);
        dispatch({ type: 'dblClick', world });
        break;
      }
    }
  }

  function getScreen(e: PointerEvent): Point {
    const rect = canvasEl.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function ensureTick(): void {
    if (tickInterval === null) {
      tickInterval = setInterval(() => {
        handleEvents(gestureStep(gestureState, { kind: 'tick', t: Date.now() }));
      }, 100);
    }
  }

  function stopTickIfEmpty(): void {
    if (activePointers.size === 0 && tickInterval !== null) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  return {
    onPointerDown(e: PointerEvent): void {
      try {
        canvasEl.setPointerCapture(e.pointerId);
      } catch {}
      activePointers.add(e.pointerId);
      ensureTick();
      const pt = getScreen(e);
      handleEvents(
        gestureStep(gestureState, {
          kind: 'down',
          id: e.pointerId,
          x: pt.x,
          y: pt.y,
          t: Date.now(),
        }),
      );
    },

    onPointerMove(e: PointerEvent): void {
      const pt = getScreen(e);
      handleEvents(
        gestureStep(gestureState, {
          kind: 'move',
          id: e.pointerId,
          x: pt.x,
          y: pt.y,
          t: Date.now(),
        }),
      );
    },

    onPointerUp(e: PointerEvent): void {
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {}
      activePointers.delete(e.pointerId);
      stopTickIfEmpty();
      const pt = getScreen(e);
      handleEvents(
        gestureStep(gestureState, {
          kind: 'up',
          id: e.pointerId,
          x: pt.x,
          y: pt.y,
          t: Date.now(),
        }),
      );
    },

    onPointerCancel(e: PointerEvent): void {
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {}
      activePointers.delete(e.pointerId);
      stopTickIfEmpty();
      const pt = getScreen(e);
      handleEvents(
        gestureStep(gestureState, {
          kind: 'cancel',
          id: e.pointerId,
          x: pt.x,
          y: pt.y,
          t: Date.now(),
        }),
      );
    },
  };
}
