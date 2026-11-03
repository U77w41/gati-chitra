import { describe, expect, it } from 'vitest';
import { shouldDraw } from './render-loop';

describe('render-loop', () => {
  it('does not draw while idle', () => {
    expect(shouldDraw({ dirty: false, paused: true, style: 'pulse', presenting: false })).toBe(false);
    expect(shouldDraw({ dirty: false, paused: false, style: 'off', presenting: false })).toBe(false);
    expect(shouldDraw({ dirty: true, paused: true, style: 'off', presenting: false })).toBe(true);
  });
});
