import { describe, it, expect } from 'vitest';
import { rovingStep } from './node-palette';

describe('rovingStep', () => {
  it('moves forward with Right or Down and back with Left or Up, wrapping at both ends', () => {
    expect(rovingStep(0, 'ArrowRight', 5)).toBe(1);
    expect(rovingStep(0, 'ArrowDown', 5)).toBe(1);
    expect(rovingStep(4, 'ArrowRight', 5)).toBe(0);
    expect(rovingStep(0, 'ArrowLeft', 5)).toBe(4);
    expect(rovingStep(3, 'ArrowUp', 5)).toBe(2);
  });

  it('jumps to the first and last items', () => {
    expect(rovingStep(3, 'Home', 5)).toBe(0);
    expect(rovingStep(1, 'End', 5)).toBe(4);
  });

  it('starts from the first or last item when none has focus', () => {
    expect(rovingStep(-1, 'ArrowRight', 5)).toBe(0);
    expect(rovingStep(-1, 'ArrowLeft', 5)).toBe(4);
  });

  it('switches between two tabs with either arrow', () => {
    expect(rovingStep(0, 'ArrowRight', 2)).toBe(1);
    expect(rovingStep(1, 'ArrowRight', 2)).toBe(0);
    expect(rovingStep(1, 'ArrowLeft', 2)).toBe(0);
  });

  it('ignores other keys and empty lists', () => {
    expect(rovingStep(2, 'a', 5)).toBeNull();
    expect(rovingStep(0, 'ArrowRight', 0)).toBeNull();
  });
});
