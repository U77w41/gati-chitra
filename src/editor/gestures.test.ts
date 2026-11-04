import { describe, it, expect } from 'vitest';
import {
  createGestureState,
  gestureStep,
  type GestureInput,
  type GestureEvent,
} from './gestures';
import { TOUCH } from '../core/constants';
import { sceneOf, offsetFromEdgeMid } from '../../tests/support/scene';
import { hitTest } from '../layout/geometry';

const down = (id: number, x: number, y: number, t: number) => ({ kind: 'down', id, x, y, t }) as const;
const move = (id: number, x: number, y: number, t: number) => ({ kind: 'move', id, x, y, t }) as const;
const up = (id: number, x: number, y: number, t: number) => ({ kind: 'up', id, x, y, t }) as const;
const tick = (t: number) => ({ kind: 'tick', t }) as const;
const run = (inputs: GestureInput[]) => {
  let s = createGestureState(); const out: GestureEvent[] = [];
  for (const i of inputs) { const r = gestureStep(s, i); s = r.state; out.push(...r.events); }
  return out;
};
const types = (inputs: GestureInput[]) => run(inputs).map(e => e.type);

describe('Touch gestures', () => {
  it('taps and double taps', () => {
    expect(run([down(1, 0, 0, 0), up(1, 0, 0, 100)])).toEqual([{ type: 'tap', at: { x: 0, y: 0 } }]);
    expect(types([down(1, 0, 0, 0), up(1, 0, 0, 80), down(1, 2, 2, 200), up(1, 2, 2, 260)])).toEqual(['tap', 'doubleTap']);
  });
  it('long press does not drag', () => {
    expect(types([down(1, 0, 0, 0), tick(600), move(1, 30, 0, 700), up(1, 30, 0, 800)])).toEqual(['longPress']);
  });
  it('drags past the slop', () => {
    expect(types([down(1, 0, 0, 0), move(1, 20, 0, 50), move(1, 40, 0, 80), up(1, 40, 0, 100)]))
      .toEqual(['dragStart', 'dragMove', 'dragMove', 'dragEnd']);
  });
  it('a second finger cancels the drag and pinches', () => {
    expect(types([down(1, 0, 0, 0), move(1, 20, 0, 50), down(2, 100, 0, 60), move(2, 120, 0, 80)]))
      .toEqual(['dragStart', 'dragMove', 'dragCancel', 'pinch']);
  });
  it('pinch reports scale, centre and movement', () => {
    expect(run([down(1, 0, 0, 0), down(2, 100, 0, 10), move(2, 200, 0, 20)]).at(-1))
      .toEqual({ type: 'pinch', center: { x: 100, y: 0 }, scale: 2, dx: 50, dy: 0 });
  });
  it('lifting one finger ends the pinch without a jump', () => {
    expect(types([down(1, 0, 0, 0), down(2, 100, 0, 10), up(2, 100, 0, 20), move(1, 50, 0, 30), up(1, 50, 0, 40)])).toEqual(['pinchEnd']);
  });
  it('touch hit-testing is more forgiving', () => {
    const s = sceneOf('flowchart LR\nA --> B');
    const nearEdge = offsetFromEdgeMid(s, 'e0', 10);    // 10 world units off the arrow
    expect(hitTest(s, nearEdge, null)).toBeNull();
    expect(hitTest(s, nearEdge, null, TOUCH.hitTolerance)).toMatchObject({ kind: 'edge' });
  });
});
