import { TOUCH } from '../core/constants';
import type { Point } from '../core/types';

export type PointerSample = {
  kind: 'down' | 'move' | 'up' | 'cancel';
  id: number;
  x: number;
  y: number;
  t: number;
};

export type GestureInput = PointerSample | { kind: 'tick'; t: number };

export type GestureEvent =
  | { type: 'tap'; at: Point }
  | { type: 'doubleTap'; at: Point }
  | { type: 'longPress'; at: Point }
  | { type: 'dragStart'; at: Point }
  | { type: 'dragMove'; at: Point }
  | { type: 'dragEnd'; at: Point }
  | { type: 'dragCancel' }
  | { type: 'pinch'; center: Point; scale: number; dx: number; dy: number }
  | { type: 'pinchEnd' };

interface PointerInfo {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

type Mode =
  | { kind: 'idle' }
  | { kind: 'pending'; pointer: PointerInfo }
  | { kind: 'dragging'; pointer: PointerInfo }
  | { kind: 'longPressed'; pointer: PointerInfo }
  | {
      kind: 'pinch';
      p1: PointerInfo;
      p2: PointerInfo;
      prevDist: number;
      prevCenter: Point;
    }
  | { kind: 'pinchEnding'; activePointerId: number };

export interface GestureState {
  readonly _brand: 'GestureState';
  readonly mode: Mode;
  readonly lastTap?: { at: Point; t: number };
}

export function createGestureState(): GestureState {
  return {
    _brand: 'GestureState',
    mode: { kind: 'idle' },
  };
}

export function gestureStep(
  s: GestureState,
  input: GestureInput,
): { state: GestureState; events: GestureEvent[] } {
  const events: GestureEvent[] = [];

  if (input.kind === 'tick') {
    if (s.mode.kind === 'pending') {
      if (input.t - s.mode.pointer.startTime >= TOUCH.longPressMs) {
        events.push({
          type: 'longPress',
          at: { x: s.mode.pointer.startX, y: s.mode.pointer.startY },
        });
        return {
          state: {
            ...s,
            mode: { kind: 'longPressed', pointer: s.mode.pointer },
          },
          events,
        };
      }
    }
    return { state: s, events };
  }

  if (input.kind === 'cancel') {
    if (s.mode.kind === 'dragging') {
      events.push({ type: 'dragCancel' });
    }
    return {
      state: {
        _brand: 'GestureState',
        mode: { kind: 'idle' },
      },
      events,
    };
  }

  if (input.kind === 'down') {
    const newPtr: PointerInfo = {
      id: input.id,
      startX: input.x,
      startY: input.y,
      currentX: input.x,
      currentY: input.y,
      startTime: input.t,
    };

    if (s.mode.kind === 'idle') {
      return {
        state: { ...s, mode: { kind: 'pending', pointer: newPtr } },
        events,
      };
    }

    if (s.mode.kind === 'pending' || s.mode.kind === 'dragging') {
      if (s.mode.kind === 'dragging') {
        events.push({ type: 'dragCancel' });
      }
      const p1 = s.mode.pointer;
      const p2 = newPtr;
      const dist = Math.hypot(p2.currentX - p1.currentX, p2.currentY - p1.currentY);
      const center = {
        x: (p1.currentX + p2.currentX) / 2,
        y: (p1.currentY + p2.currentY) / 2,
      };
      return {
        state: {
          ...s,
          mode: { kind: 'pinch', p1, p2, prevDist: dist, prevCenter: center },
        },
        events,
      };
    }

    return { state: s, events };
  }

  if (input.kind === 'move') {
    if (s.mode.kind === 'pending') {
      if (input.id === s.mode.pointer.id) {
        const d = Math.hypot(input.x - s.mode.pointer.startX, input.y - s.mode.pointer.startY);
        if (d > TOUCH.slop) {
          events.push({
            type: 'dragStart',
            at: { x: s.mode.pointer.startX, y: s.mode.pointer.startY },
          });
          events.push({
            type: 'dragMove',
            at: { x: input.x, y: input.y },
          });
          return {
            state: {
              ...s,
              mode: {
                kind: 'dragging',
                pointer: { ...s.mode.pointer, currentX: input.x, currentY: input.y },
              },
            },
            events,
          };
        }
        return {
          state: {
            ...s,
            mode: {
              kind: 'pending',
              pointer: { ...s.mode.pointer, currentX: input.x, currentY: input.y },
            },
          },
          events,
        };
      }
    } else if (s.mode.kind === 'dragging') {
      if (input.id === s.mode.pointer.id) {
        events.push({ type: 'dragMove', at: { x: input.x, y: input.y } });
        return {
          state: {
            ...s,
            mode: {
              kind: 'dragging',
              pointer: { ...s.mode.pointer, currentX: input.x, currentY: input.y },
            },
          },
          events,
        };
      }
    } else if (s.mode.kind === 'pinch') {
      if (input.id === s.mode.p1.id || input.id === s.mode.p2.id) {
        const p1 =
          input.id === s.mode.p1.id
            ? { ...s.mode.p1, currentX: input.x, currentY: input.y }
            : s.mode.p1;
        const p2 =
          input.id === s.mode.p2.id
            ? { ...s.mode.p2, currentX: input.x, currentY: input.y }
            : s.mode.p2;
        const dist = Math.hypot(p2.currentX - p1.currentX, p2.currentY - p1.currentY);
        const center = {
          x: (p1.currentX + p2.currentX) / 2,
          y: (p1.currentY + p2.currentY) / 2,
        };
        const scale = s.mode.prevDist > 0 ? dist / s.mode.prevDist : 1;
        const dx = center.x - s.mode.prevCenter.x;
        const dy = center.y - s.mode.prevCenter.y;
        events.push({ type: 'pinch', center, scale, dx, dy });
        return {
          state: {
            ...s,
            mode: { kind: 'pinch', p1, p2, prevDist: dist, prevCenter: center },
          },
          events,
        };
      }
    }
    return { state: s, events };
  }

  if (input.kind === 'up') {
    if (s.mode.kind === 'pending') {
      if (input.id === s.mode.pointer.id) {
        const at = { x: s.mode.pointer.startX, y: s.mode.pointer.startY };
        const isDoubleTap =
          s.lastTap &&
          input.t - s.lastTap.t <= TOUCH.doubleTapMs &&
          Math.hypot(at.x - s.lastTap.at.x, at.y - s.lastTap.at.y) <= TOUCH.slop;
        if (isDoubleTap) {
          events.push({ type: 'doubleTap', at });
          return {
            state: { _brand: 'GestureState', mode: { kind: 'idle' }, lastTap: undefined },
            events,
          };
        }
        events.push({ type: 'tap', at });
        return {
          state: {
            _brand: 'GestureState',
            mode: { kind: 'idle' },
            lastTap: { at, t: input.t },
          },
          events,
        };
      }
    } else if (s.mode.kind === 'dragging') {
      if (input.id === s.mode.pointer.id) {
        events.push({ type: 'dragEnd', at: { x: input.x, y: input.y } });
        return {
          state: { _brand: 'GestureState', mode: { kind: 'idle' } },
          events,
        };
      }
    } else if (s.mode.kind === 'longPressed') {
      if (input.id === s.mode.pointer.id) {
        return {
          state: { _brand: 'GestureState', mode: { kind: 'idle' } },
          events,
        };
      }
    } else if (s.mode.kind === 'pinch') {
      if (input.id === s.mode.p1.id || input.id === s.mode.p2.id) {
        const activePointerId = input.id === s.mode.p1.id ? s.mode.p2.id : s.mode.p1.id;
        events.push({ type: 'pinchEnd' });
        return {
          state: {
            ...s,
            mode: { kind: 'pinchEnding', activePointerId },
          },
          events,
        };
      }
    } else if (s.mode.kind === 'pinchEnding') {
      if (input.id === s.mode.activePointerId) {
        return {
          state: { _brand: 'GestureState', mode: { kind: 'idle' } },
          events,
        };
      }
    }
  }

  return { state: s, events };
}
