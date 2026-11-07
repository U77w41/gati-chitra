import { describe, it, expect } from 'vitest';
import { EDITOR, editorFontPx, editorWidth } from './inline-edit-box';

describe('editorFontPx', () => {
  it('matches the label size on the canvas at the current zoom', () => {
    expect(editorFontPx(16, 1)).toBe(16);
    expect(editorFontPx(13, 1.2)).toBe(16);
  });

  it('stays readable when zoomed far out and compact when zoomed far in', () => {
    expect(editorFontPx(16, 0.3)).toBe(EDITOR.minFont);
    expect(editorFontPx(16, 3)).toBe(EDITOR.maxFont);
  });
});

describe('editorWidth', () => {
  it('fits the widest line plus padding, border and room for the caret', () => {
    const chrome = 2 * EDITOR.padX + 2 * EDITOR.border + EDITOR.caret;
    expect(editorWidth([120, 80])).toBe(120 + chrome);
  });

  it('never gets narrower than the minimum, even when empty', () => {
    expect(editorWidth([5])).toBe(EDITOR.minWidth);
    expect(editorWidth([])).toBe(EDITOR.minWidth);
  });

  it('stops growing at the maximum width, where the text wraps instead', () => {
    expect(editorWidth([2000])).toBe(EDITOR.maxWidth);
  });
});
