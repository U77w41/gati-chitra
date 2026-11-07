import { describe, expect, it } from 'vitest';
import { STORAGE } from '../core/constants';
import { setupDockToggle } from './dock-toggle';

function fakeButton() {
  const attrs = new Map<string, string>();
  const listeners: Array<() => void> = [];
  return {
    attrs,
    setAttribute: (k: string, v: string) => { attrs.set(k, v); },
    addEventListener: (_type: string, fn: () => void) => { listeners.push(fn); },
    click: () => listeners.forEach((fn) => fn()),
  };
}

function memoryStore(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return { map, getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); } };
}

const brokenStore = {
  getItem: (): string | null => { throw new Error('denied'); },
  setItem: (): void => { throw new Error('denied'); },
};

describe('setupDockToggle', () => {
  it('starts open when nothing is stored', () => {
    const button = fakeButton();
    const body = { hidden: false };
    setupDockToggle({ button, body, storage: memoryStore() });
    expect(body.hidden).toBe(false);
    expect(button.attrs.get('aria-expanded')).toBe('true');
  });

  it('starts hidden when the stored choice is hidden', () => {
    const button = fakeButton();
    const body = { hidden: false };
    setupDockToggle({ button, body, storage: memoryStore({ [STORAGE.dockKey]: 'hidden' }) });
    expect(body.hidden).toBe(true);
    expect(button.attrs.get('aria-expanded')).toBe('false');
  });

  it('toggles on click and stores the choice', () => {
    const button = fakeButton();
    const body = { hidden: false };
    const store = memoryStore();
    setupDockToggle({ button, body, storage: store });

    button.click();
    expect(body.hidden).toBe(true);
    expect(button.attrs.get('aria-expanded')).toBe('false');
    expect(store.map.get(STORAGE.dockKey)).toBe('hidden');

    button.click();
    expect(body.hidden).toBe(false);
    expect(button.attrs.get('aria-expanded')).toBe('true');
    expect(store.map.get(STORAGE.dockKey)).toBe('open');
  });

  it('still toggles when storage throws or is missing', () => {
    for (const storage of [brokenStore, null]) {
      const button = fakeButton();
      const body = { hidden: false };
      setupDockToggle({ button, body, storage });
      expect(body.hidden).toBe(false);
      button.click();
      expect(body.hidden).toBe(true);
    }
  });
});
