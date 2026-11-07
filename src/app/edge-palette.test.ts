import { describe, expect, it, vi } from 'vitest';
import { setupEdgePalette } from './edge-palette';

function createFakeSelect(initialOptions: { value: string; text: string }[], initialValue: string) {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    value: initialValue,
    disabled: false,
    options: initialOptions as unknown as HTMLOptionsCollection,
    addEventListener(type: string, fn: () => void) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    dispatchEvent(e: Event) {
      listeners[e.type]?.forEach((fn) => fn());
      return true;
    },
  };
}

function createFakePalette() {
  const listeners: Record<string, Array<(e: Event) => void>> = {};
  const fakePalette = {
    innerHTML: '',
    addEventListener(type: string, fn: (e: Event) => void) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    querySelectorAll<T extends Element>(_sel: string): NodeListOf<T> {
      // Parse buttons from innerHTML
      const regex = /<button[^>]*data-value="([^"]*)"[^>]*data-index="([^"]*)"[^>]*>/g;
      const buttons: Array<{
        dataset: { value: string; index: string };
        tabIndex: number;
        disabled: boolean;
        classList: {
          contains: (cls: string) => boolean;
          add: (cls: string) => void;
          remove: (cls: string) => void;
        };
        setAttribute: (k: string, v: string) => void;
        closest: (selector: string) => unknown;
      }> = [];
      let match;
      while ((match = regex.exec(fakePalette.innerHTML)) !== null) {
        const val = match[1];
        const idx = match[2];
        const classes = new Set<string>();
        if (match[0].includes('active')) classes.add('active');
        const btn = {
          dataset: { value: val, index: idx },
          tabIndex: -1,
          disabled: false,
          classList: {
            contains: (cls: string) => classes.has(cls),
            add: (cls: string) => { classes.add(cls); },
            remove: (cls: string) => { classes.delete(cls); },
          },
          setAttribute: (_k: string, _v: string) => {},
          closest: () => btn,
        };
        buttons.push(btn);
      }
      return buttons as unknown as NodeListOf<T>;
    },
    triggerClick(target: unknown) {
      listeners['click']?.forEach((fn) => fn({ target } as unknown as Event));
    },
  };
  return fakePalette;
}

describe('edge-palette', () => {
  it('renders buttons from select options and synchronizes selection', () => {
    const fakeSelect = createFakeSelect(
      [
        { value: 'arrow', text: 'Arrow' },
        { value: 'dottedArrow', text: 'Dotted arrow' },
      ],
      'arrow',
    );
    const fakePalette = createFakePalette();

    const onSelect = vi.fn();
    const inst = setupEdgePalette({
      palette: fakePalette as unknown as HTMLElement,
      select: fakeSelect as unknown as HTMLSelectElement,
      onSelect,
    });

    expect(fakePalette.innerHTML).toContain('data-value="arrow"');
    expect(fakePalette.innerHTML).toContain('data-value="dottedArrow"');

    const btns = fakePalette.querySelectorAll<HTMLButtonElement>('button');
    expect(btns.length).toBe(2);
    expect(btns[0].classList.contains('active')).toBe(true);
    expect(btns[1].classList.contains('active')).toBe(false);

    // Clicking second button
    fakePalette.triggerClick(btns[1]);
    expect(fakeSelect.value).toBe('dottedArrow');
    expect(onSelect).toHaveBeenCalledWith('dottedArrow');

    // Programmatic change + sync
    fakeSelect.value = 'arrow';
    inst.sync();
    const updatedBtns = fakePalette.querySelectorAll<HTMLButtonElement>('button');
    expect(updatedBtns[0].classList.contains('active')).toBe(true);
    expect(updatedBtns[1].classList.contains('active')).toBe(false);
  });
});
