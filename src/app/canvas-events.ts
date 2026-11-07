import { wheelFactor, zoomAt } from '../editor/view';
import type { EditorEvent } from '../editor/controller';
import { screenToWorld } from '../editor/view';
import type { AppState } from './state';
import type { TextOp } from '../core/types';
import { KEYBOARD } from '../core/constants';
import { edgeCycle, nextNodeInDirection, type Dir } from '../editor/keyboard-nav';
import { capsOf } from './kind-ui';
import type { TouchWiring } from './touch-wiring';
import { panToolOn, setupPanTool } from './pan-tool';

/** The zoom buttons step like the + and - keys. */
const ZOOM_STEP = 1.25;

export interface CanvasEventsEnv {
  canvasEl: HTMLCanvasElement;
  getState: () => AppState;
  dispatch: (event: EditorEvent) => void;
  updateView: (fn: (v: AppState['view']) => AppState['view']) => void;
  isPresenting?: () => boolean;
  executeOp?: (op: TextOp, opts?: { coalesce?: boolean }) => void;
  isInlineEditing?: () => boolean;
  requestRedraw?: () => void;
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

  // Zoom out, zoom in and Move in the canvas's bottom-right corner (index.html #canvas-zoom).
  const centre = () => ({ x: canvasEl.clientWidth / 2, y: canvasEl.clientHeight / 2 });
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => updateView((v) => zoomAt(v, centre(), ZOOM_STEP)));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => updateView((v) => zoomAt(v, centre(), 1 / ZOOM_STEP)));
  setupPanTool();

  let touchWiring: TouchWiring | null = null;
  const touchPromise = import('./touch-wiring').then(({ createTouchWiring }) => {
    touchWiring = createTouchWiring(env);
    return touchWiring;
  });

  canvasEl.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      try {
        canvasEl.setPointerCapture(e.pointerId);
      } catch {}
      if (touchWiring) touchWiring.onPointerDown(e);
      else {
        const sample = { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
        touchPromise.then((w) => w.onPointerDown(sample as PointerEvent));
      }
      return;
    }
    try {
      canvasEl.setPointerCapture(e.pointerId);
    } catch {}
    const rect = canvasEl.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const world = screenToWorld(getState().view, screen);

    if (env.isPresenting?.()) {
      dispatch({
        type: 'pointerDown',
        world,
        screen,
        button: 1,
        space: true,
      });
      return;
    }

    dispatch({
      type: 'pointerDown',
      world,
      screen,
      button: e.button,
      space: spaceHeld || panToolOn(),
    });
  });

  canvasEl.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      if (touchWiring) touchWiring.onPointerMove(e);
      else {
        const sample = { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
        touchPromise.then((w) => w.onPointerMove(sample as PointerEvent));
      }
      return;
    }
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
    if (e.pointerType === 'touch') {
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {}
      if (touchWiring) touchWiring.onPointerUp(e);
      else {
        const sample = { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
        touchPromise.then((w) => w.onPointerUp(sample as PointerEvent));
      }
      return;
    }
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
  canvasEl.addEventListener('pointercancel', (e) => {
    if (e.pointerType === 'touch') {
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {}
      if (touchWiring) touchWiring.onPointerCancel(e);
      else {
        const sample = { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
        touchPromise.then((w) => w.onPointerCancel(sample as PointerEvent));
      }
      return;
    }
    onPointerUp(e);
  });

  canvasEl.addEventListener('dblclick', (e) => {
    if (env.isPresenting?.()) return;
    const rect = canvasEl.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const world = screenToWorld(getState().view, screen);
    dispatch({
      type: 'dblClick',
      world,
    });
  });

  let lastNudgeTime = 0;
  let lastSelectedNodeId: string | null = null;

  canvasEl.addEventListener('keydown', (e) => {
    if (env.isInlineEditing?.() || env.isPresenting?.()) return;
    const state = getState();

    if (e.key === 'Enter') {
      e.preventDefault();
      dispatch({ type: 'keyDown', key: 'Enter' });
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      dispatch({ type: 'keyDown', key: 'Delete' });
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      dispatch({ type: 'keyDown', key: 'Escape' });
      return;
    }

    if (e.key === '[' || e.key === ']') {
      e.preventDefault();
      const sel = state.editor.selection;
      let nodeId: string | null = null;
      let currentEdgeIdx: number | null = null;
      if (sel?.kind === 'node') {
        nodeId = sel.id;
        lastSelectedNodeId = sel.id;
      } else if (sel?.kind === 'edge') {
        currentEdgeIdx = Number(sel.id.slice(1));
        const edge = state.doc.edges[currentEdgeIdx];
        if (edge) nodeId = lastSelectedNodeId ?? edge.from;
      }
      if (nodeId && state.doc.ok) {
        const step = e.key === ']' ? 1 : -1;
        const nextEdge = edgeCycle(state.doc, nodeId, currentEdgeIdx, step);
        if (nextEdge !== null) {
          dispatch({ type: 'select', selection: { kind: 'edge', id: `e${nextEdge}` } });
          env.requestRedraw?.();
        }
      }
      return;
    }

    if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const sel = state.editor.selection;
      if (sel?.kind === 'node' && state.doc.ok && state.scene && env.executeOp && capsOf(state.doc).move) {
        const nodeBox = state.scene.layout.nodes[sel.id];
        if (nodeBox) {
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -KEYBOARD.nudge;
          else if (e.key === 'ArrowDown') dy = KEYBOARD.nudge;
          else if (e.key === 'ArrowLeft') dx = -KEYBOARD.nudge;
          else if (e.key === 'ArrowRight') dx = KEYBOARD.nudge;
          const now = Date.now();
          const coalesce = now - lastNudgeTime < 1000;
          lastNudgeTime = now;
          const newPos = { x: nodeBox.center.x + dx, y: nodeBox.center.y + dy };
          env.executeOp({ type: 'setPin', id: sel.id, x: newPos.x, y: newPos.y }, { coalesce });
        }
      }
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      if (!state.scene || !state.doc.ok) return;
      const dirMap: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      const dir = dirMap[e.key];
      const currentId = state.editor.selection?.kind === 'node' ? state.editor.selection.id : null;
      const order = state.doc.nodes.map((n) => n.id);
      const nextId = nextNodeInDirection(state.scene.layout, order, currentId, dir);
      if (nextId) {
        lastSelectedNodeId = nextId;
        dispatch({ type: 'select', selection: { kind: 'node', id: nextId } });
        env.requestRedraw?.();
      }
      return;
    }
  });
}
