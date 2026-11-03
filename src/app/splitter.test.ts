import { describe, expect, it } from 'vitest';
import { clampSplit, setupSplitter } from './splitter';

describe('splitter', () => {
  it('clamps the split', () => {
    expect([clampSplit(0), clampSplit(0.5), clampSplit(1)]).toEqual([
      0.2, 0.5, 0.8,
    ]);
  });

  it('updates split on ArrowRight and ArrowLeft keydown', () => {
    let currentSplit = 0.33;
    const attrs = new Map<string, string>();
    const listeners = new Map<string, Array<(e: unknown) => void>>();
    const styleMap = new Map<string, string>();

    const handle = {
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      getAttribute: (k: string) => attrs.get(k) ?? null,
      addEventListener: (type: string, fn: (e: unknown) => void) => {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type)!.push(fn);
      },
      removeEventListener: (type: string, fn: (e: unknown) => void) => {
        const arr = listeners.get(type) ?? [];
        const idx = arr.indexOf(fn);
        if (idx !== -1) arr.splice(idx, 1);
      },
    } as unknown as HTMLElement;

    const workspace = {
      style: {
        setProperty: (k: string, v: string) => styleMap.set(k, v),
      },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 600 }),
    } as unknown as HTMLElement;

    const cleanup = setupSplitter({
      handle,
      workspace,
      get: () => currentSplit,
      set: (v) => {
        currentSplit = v;
      },
    });

    expect(handle.getAttribute('aria-valuenow')).toBe('33');

    const keyListeners = listeners.get('keydown') ?? [];
    keyListeners.forEach((fn) => fn({ key: 'ArrowRight', preventDefault() {} }));
    expect(Number(currentSplit.toFixed(2))).toBe(0.38);
    expect(handle.getAttribute('aria-valuenow')).toBe('38');

    keyListeners.forEach((fn) => fn({ key: 'ArrowLeft', preventDefault() {} }));
    expect(Number(currentSplit.toFixed(2))).toBe(0.33);
    expect(handle.getAttribute('aria-valuenow')).toBe('33');

    cleanup();
  });
});
