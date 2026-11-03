import { describe, expect, it } from 'vitest';
import { shortcutFor, type KeyInfo } from './shortcuts';

function k(partial: Partial<KeyInfo> & { key: string }): KeyInfo {
  return {
    ctrl: false,
    meta: false,
    shift: false,
    alt: false,
    targetTag: 'CANVAS',
    ...partial,
  };
}

describe('shortcutFor', () => {
  it('maps undo and redo shortcuts correctly', () => {
    expect(shortcutFor(k({ key: 'z', ctrl: true }))).toBe('undo');
    expect(shortcutFor(k({ key: 'z', ctrl: true, shift: true }))).toBe('redo');
    expect(shortcutFor(k({ key: 'Z', meta: true, shift: true }))).toBe('redo');
    expect(shortcutFor(k({ key: 'y', ctrl: true }))).toBe('redo');
    expect(shortcutFor(k({ key: 'y', meta: true }))).toBeNull();
  });

  it('maps view controls and present mode', () => {
    expect(shortcutFor(k({ key: '0', meta: true }))).toBe('fit');
    expect(shortcutFor(k({ key: '+' }))).toBe('zoomIn');
    expect(shortcutFor(k({ key: '=' }))).toBe('zoomIn');
    expect(shortcutFor(k({ key: '-' }))).toBe('zoomOut');
    expect(shortcutFor(k({ key: 'p' }))).toBe('present');
    expect(shortcutFor(k({ key: 'k' }))).toBe('togglePause');
  });

  it('maps editing and cancellation shortcuts', () => {
    expect(shortcutFor(k({ key: 'Delete' }))).toBe('delete');
    expect(shortcutFor(k({ key: 'Backspace' }))).toBe('delete');
    expect(shortcutFor(k({ key: 'Enter' }))).toBe('rename');
    expect(shortcutFor(k({ key: 'Escape' }))).toBe('escape');
  });

  it('ignores shortcuts when alt is pressed or for unrecognized keys', () => {
    expect(shortcutFor(k({ key: 'p', alt: true }))).toBeNull();
    expect(shortcutFor(k({ key: 'q' }))).toBeNull();
  });

  it('respects input field boundaries', () => {
    expect(shortcutFor(k({ key: 'z', ctrl: true, targetTag: 'TEXTAREA' }))).toBeNull();
    expect(shortcutFor(k({ key: 'Escape', targetTag: 'TEXTAREA' }))).toBe('escape');
    expect(shortcutFor(k({ key: 'p', targetTag: 'INPUT' }))).toBeNull();
  });

  it.each(['BUTTON', 'A', 'SUMMARY', 'SELECT'])('Enter on %s is left to the browser', (tag) => {
    expect(shortcutFor({ key: 'Enter', ctrl: false, meta: false, shift: false, alt: false, targetTag: tag })).toBeNull();
  });

  it.each(['BODY', 'MAIN', 'CANVAS'])('Enter on %s renames', (tag) => {
    expect(shortcutFor({ key: 'Enter', ctrl: false, meta: false, shift: false, alt: false, targetTag: tag })).toBe('rename');
  });

  it('leaves keys inside the editor to the editor', () => {
    expect(shortcutFor({ key: 'z', ctrl: true, meta: false, shift: false, alt: false, targetTag: 'DIV', inEditor: true })).toBeNull();
  });
});
