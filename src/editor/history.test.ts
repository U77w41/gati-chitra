import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  createHistory,
  pushText,
  redo,
  undo,
} from './history';

describe('history', () => {
  it('manages undo and redo stacks correctly', () => {
    let h = createHistory('a');
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);

    h = pushText(h, 'b');
    h = pushText(h, 'c');
    expect([h.past, h.present, h.future]).toEqual([['a', 'b'], 'c', []]);
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);

    h = undo(h);
    expect([h.present, h.future]).toEqual(['b', ['c']]);
    expect(canRedo(h)).toBe(true);

    h = redo(h);
    expect(h.present).toBe('c');

    expect(pushText(h, 'c')).toBe(h); // same text: unchanged object

    h = undo(undo(h));
    h = pushText(h, 'z');
    expect(h.future).toEqual([]); // new edit clears redo

    expect(undo(createHistory('a')).present).toBe('a');
  });

  it('drops oldest entries when exceeding undoDepth limit', () => {
    let big = createHistory('t0');
    for (let i = 1; i <= 205; i++) {
      big = pushText(big, 't' + i);
    }
    expect(big.past.length).toBe(200);
    expect(big.past[0]).toBe('t5');
  });

  it('coalesces bursts of typing when requested', () => {
    let d = pushText(createHistory('a'), 'x');
    d = pushText(d, 'xy', { coalesce: true });
    d = pushText(d, 'xyz', { coalesce: true });
    expect([d.past, d.present]).toEqual([['a'], 'xyz']);
  });
});
