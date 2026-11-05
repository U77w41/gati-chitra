import { describe, expect, it, vi } from 'vitest';
import { setupAnimControls } from './anim-controls';
import { createState, type AppState } from './state';
import { loadSettings, type KeyValueStore } from './storage';

function memStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

interface FakeNode {
  id: string;
  className: string;
  type?: string;
  value?: string;
  checked?: boolean;
  textContent: string;
  dataset: Record<string, string>;
  children: FakeNode[];
  attrs: Map<string, string>;
  listeners: Map<string, Array<(e?: unknown) => void>>;
  style: Record<string, string>;
  setAttribute(k: string, v: string): void;
  getAttribute(k: string): string | null;
  removeAttribute(k: string): void;
  addEventListener(type: string, fn: (e?: unknown) => void): void;
  dispatchEvent(e: unknown): void;
  click(): void;
  replaceChildren(...nodes: FakeNode[]): void;
  appendChild(node: FakeNode): void;
  querySelector(selector: string): FakeNode | null;
  querySelectorAll(selector: string): FakeNode[];
}

function makeFake(id = '', _tag = 'div'): FakeNode {
  const node: FakeNode = {
    id,
    className: '',
    textContent: '',
    dataset: {},
    children: [],
    attrs: new Map(),
    listeners: new Map(),
    style: {},
    setAttribute(k, v) { node.attrs.set(k, v); },
    getAttribute(k) { return node.attrs.get(k) ?? null; },
    removeAttribute(k) { node.attrs.delete(k); },
    addEventListener(type, fn) {
      if (!node.listeners.has(type)) node.listeners.set(type, []);
      node.listeners.get(type)!.push(fn);
    },
    dispatchEvent(e) {
      const type = (e as { type?: string })?.type ?? '';
      for (const fn of node.listeners.get(type) ?? []) fn(e);
    },
    click() {
      for (const fn of node.listeners.get('click') ?? []) fn({ type: 'click' });
    },
    replaceChildren(...nodes) {
      node.children = [...nodes];
    },
    appendChild(child) {
      node.children.push(child);
    },
    querySelector(selector: string) {
      const match = node.querySelectorAll(selector);
      return match[0] ?? null;
    },
    querySelectorAll(selector: string): FakeNode[] {
      const res: FakeNode[] = [];
      const matchAttr = selector.match(/\[([^=]+)="([^"]+)"\]/);
      const matchClass = selector.match(/^\.([a-zA-Z0-9_-]+)/);

      function search(n: FakeNode) {
        let matches = true;
        if (matchAttr && n.dataset[matchAttr[1].replace('data-', '')] !== matchAttr[2]) {
          matches = false;
        }
        if (matchClass && !n.className.includes(matchClass[1])) {
          matches = false;
        }
        if (matches && (matchAttr || matchClass)) res.push(n);
        for (const c of n.children) search(c);
      }
      for (const c of node.children) search(c);
      return res;
    },
  };
  return node;
}

describe('anim-controls', () => {
  it('initializes and binds background lock and dropdown selections', () => {
    // Provide a minimal fake document for createElement
    const origDoc = (globalThis as unknown as { document: unknown }).document;
    (globalThis as unknown as { document: unknown }).document = {
      createElement: (tag: string) => {
        const node = makeFake('', tag);
        (node as unknown as { getContext: () => null }).getContext = () => null;
        return node;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      documentElement: makeFake('html'),
    };

    try {
      const animStyleEl = makeFake('anim-style', 'select') as unknown as HTMLSelectElement;
      const animSpeedEl = makeFake('anim-speed', 'input') as unknown as HTMLInputElement;
      const animDensityEl = makeFake('anim-density', 'input') as unknown as HTMLInputElement;
      const animGlowEl = makeFake('anim-glow', 'input') as unknown as HTMLInputElement;
      const animPauseEl = makeFake('anim-pause', 'button') as unknown as HTMLButtonElement;
      const themeEl = makeFake('theme', 'select') as unknown as HTMLSelectElement;
      const canvasGridEl = makeFake('canvas-grid', 'input') as unknown as HTMLInputElement;
      const bgThemeEl = makeFake('bg-theme', 'select') as unknown as HTMLSelectElement;
      const bgLockEl = makeFake('bg-lock', 'button') as unknown as HTMLButtonElement;

      const els = {
        animStyleEl,
        animSpeedEl,
        animDensityEl,
        animGlowEl,
        animPauseEl,
        themeEl,
        canvasGridEl,
        bgThemeEl,
        bgLockEl,
      };

      const store = memStore();
      const state: AppState = createState('graph TD\nA-->B', loadSettings(store));
      const onPauseToggle = vi.fn();

      setupAnimControls(els, () => state, store, onPauseToggle);

      expect(state.settings.theme).toBe('auto');
      expect(state.settings.bgTheme).toBe('match');
      expect(state.settings.bgLocked).toBe(false);

      // Grid toggle
      els.canvasGridEl.checked = true;
      (els.canvasGridEl as unknown as FakeNode).dispatchEvent({ type: 'change' });
      expect(state.settings.grid).toBe(true);

      // Click background lock button
      (els.bgLockEl as unknown as FakeNode).click();
      expect(state.settings.bgLocked).toBe(true);
      expect(state.settings.bgTheme).toBe('daylight');
      expect(els.bgLockEl.getAttribute('aria-pressed')).toBe('true');

      // Select diagram theme via dropdown
      els.themeEl.value = 'obsidian';
      (els.themeEl as unknown as FakeNode).dispatchEvent({ type: 'change' });
      expect(state.settings.theme).toBe('obsidian');
      // Background remains locked to daylight
      expect(state.settings.bgTheme).toBe('daylight');
      expect(state.settings.bgLocked).toBe(true);

      // Click unlock
      (els.bgLockEl as unknown as FakeNode).click();
      expect(state.settings.bgLocked).toBe(false);
      expect(state.settings.bgTheme).toBe('match');
      expect(els.bgLockEl.getAttribute('aria-pressed')).toBe('false');

      // Select background via dropdown
      els.bgThemeEl.value = 'paper';
      (els.bgThemeEl as unknown as FakeNode).dispatchEvent({ type: 'change' });
      expect(state.settings.bgTheme).toBe('paper');
      expect(state.settings.bgLocked).toBe(true);
      expect(els.bgLockEl.getAttribute('aria-pressed')).toBe('true');

      // Select match background via dropdown
      els.bgThemeEl.value = 'match';
      (els.bgThemeEl as unknown as FakeNode).dispatchEvent({ type: 'change' });
      expect(state.settings.bgTheme).toBe('match');
      expect(state.settings.bgLocked).toBe(false);
      expect(els.bgLockEl.getAttribute('aria-pressed')).toBe('false');
    } finally {
      (globalThis as unknown as { document: unknown }).document = origDoc;
    }
  });
});
