import { describe, expect, it, vi } from 'vitest';
import { isNarrow, setupNarrowLayout } from './narrow';

describe('narrow', () => {
  it('uses the breakpoint', () => {
    expect([isNarrow(767), isNarrow(768)]).toEqual([true, false]);
  });

  it('sets up narrow layout with tabs and panels', () => {
    const makeElement = (text = '', id = '') => {
      const attrs = new Map<string, string>();
      const listeners = new Map<string, Array<(e?: unknown) => void>>();
      return {
        id,
        textContent: text,
        hidden: false,
        setAttribute: (k: string, v: string) => attrs.set(k, v),
        getAttribute: (k: string) => attrs.get(k) ?? null,
        addEventListener: (type: string, fn: (e?: unknown) => void) => {
          if (!listeners.has(type)) listeners.set(type, []);
          listeners.get(type)!.push(fn);
        },
        removeEventListener: (type: string, fn: (e?: unknown) => void) => {
          const arr = listeners.get(type) ?? [];
          const idx = arr.indexOf(fn);
          if (idx !== -1) arr.splice(idx, 1);
        },
        click: () => {
          const clickFns = listeners.get('click') ?? [];
          clickFns.forEach((fn) => fn());
        },
        triggerKeydown: (key: string) => {
          const keyFns = listeners.get('keydown') ?? [];
          keyFns.forEach((fn) => fn({ key, preventDefault() {} }));
        },
        focus: vi.fn(),
      };
    };

    const tabText = makeElement('Text', 'tab-text');
    const tabDiagram = makeElement('Diagram', 'tab-diagram');
    const tabs = makeElement();
    const allTabs = [tabText, tabDiagram];
    (tabs as unknown as HTMLElement).querySelector = (sel: string) => {
      if (sel === '#tab-diagram') return tabDiagram as unknown as HTMLElement;
      if (sel === '#tab-text') return tabText as unknown as HTMLElement;
      return null;
    };
    (tabs as unknown as HTMLElement).querySelectorAll = () => allTabs as unknown as NodeListOf<Element>;

    const textPanel = makeElement('', 'text-panel');
    const canvasPanel = makeElement('', 'canvas-panel');
    const onShowDiagram = vi.fn();

    // Mock matchMedia returning matches: true
    const originalMatchMedia = (globalThis as unknown as { matchMedia?: unknown }).matchMedia;
    (globalThis as unknown as { matchMedia: unknown }).matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const cleanup = setupNarrowLayout({
      tabs: tabs as unknown as HTMLElement,
      textPanel: textPanel as unknown as HTMLElement,
      canvasPanel: canvasPanel as unknown as HTMLElement,
      onShowDiagram,
    });

    // In narrow mode, Diagram is selected first
    expect(tabDiagram.getAttribute('aria-selected')).toBe('true');
    expect(tabText.getAttribute('aria-selected')).toBe('false');
    expect(canvasPanel.hidden).toBe(false);
    expect(textPanel.hidden).toBe(true);

    // Tapping text tab
    tabText.click();
    expect(tabText.getAttribute('aria-selected')).toBe('true');
    expect(tabDiagram.getAttribute('aria-selected')).toBe('false');
    expect(textPanel.hidden).toBe(false);
    expect(canvasPanel.hidden).toBe(true);

    // Tapping diagram tab calls onShowDiagram
    tabDiagram.click();
    expect(tabDiagram.getAttribute('aria-selected')).toBe('true');
    expect(canvasPanel.hidden).toBe(false);
    expect(textPanel.hidden).toBe(true);
    expect(onShowDiagram).toHaveBeenCalled();

    // Keyboard navigation (ArrowLeft / ArrowRight)
    tabs.triggerKeydown('ArrowLeft');
    expect(tabText.getAttribute('aria-selected')).toBe('true');
    expect(textPanel.hidden).toBe(false);

    cleanup();
    (globalThis as unknown as { matchMedia: unknown }).matchMedia = originalMatchMedia;
  });
});
