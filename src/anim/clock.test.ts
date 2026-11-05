import { describe, expect, it } from 'vitest';
import { createAnimClock } from './clock';

function fakeNow(start = 1000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => { t += ms; } };
}

describe('createAnimClock', () => {
  it('counts elapsed seconds while running', () => {
    const n = fakeNow();
    const clock = createAnimClock(n.now);
    n.advance(1500);
    expect(clock.elapsed()).toBeCloseTo(1.5);
  });

  it('freezes while paused', () => {
    const n = fakeNow();
    const clock = createAnimClock(n.now);
    n.advance(1000);
    clock.pause();
    n.advance(5000);
    expect(clock.elapsed()).toBeCloseTo(1);
  });

  it('resumes from where it paused instead of jumping ahead', () => {
    const n = fakeNow();
    const clock = createAnimClock(n.now);
    n.advance(1000);
    clock.pause();
    n.advance(3000);
    clock.resume();
    expect(clock.elapsed()).toBeCloseTo(1);
    n.advance(250);
    expect(clock.elapsed()).toBeCloseTo(1.25);
  });

  it('ignores repeated pause and resume calls', () => {
    const n = fakeNow();
    const clock = createAnimClock(n.now);
    n.advance(1000);
    clock.pause();
    n.advance(1000);
    clock.pause();
    clock.resume();
    clock.resume();
    n.advance(500);
    expect(clock.elapsed()).toBeCloseTo(1.5);
  });
});
