import { describe, it, expect } from 'vitest';
import { setupEditorTabs } from './editor-tabs';

function fakeElement(initialHidden = false) {
  const attrs = new Map<string, string>();
  const listeners: Record<string, Array<(e?: any) => void>> = {};
  return {
    attrs,
    hidden: initialHidden,
    tabIndex: -1,
    parentElement: null as any,
    setAttribute(k: string, v: string) { attrs.set(k, v); },
    getAttribute(k: string) { return attrs.get(k) ?? null; },
    addEventListener(type: string, fn: (e?: any) => void) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    click() {
      listeners['click']?.forEach((fn) => fn());
    },
    focus() {},
  };
}

describe('editor-tabs', () => {
  it('selects script tab initially and toggles on click', () => {
    const tabScript = fakeElement();
    const tabNodes = fakeElement();
    const parent = fakeElement();
    tabScript.parentElement = parent;
    tabNodes.parentElement = parent;

    const scriptPane = fakeElement(false);
    const nodesPane = fakeElement(true);

    const doc = {
      getElementById(id: string) {
        if (id === 'tab-script') return tabScript;
        if (id === 'tab-nodes') return tabNodes;
        if (id === 'script-pane') return scriptPane;
        if (id === 'nodes-pane') return nodesPane;
        return null;
      },
    };

    setupEditorTabs(doc as any);

    expect(tabScript.getAttribute('aria-selected')).toBe('true');
    expect(tabNodes.getAttribute('aria-selected')).toBe('false');
    expect(scriptPane.hidden).toBe(false);
    expect(nodesPane.hidden).toBe(true);

    tabNodes.click();
    expect(tabScript.getAttribute('aria-selected')).toBe('false');
    expect(tabNodes.getAttribute('aria-selected')).toBe('true');
    expect(scriptPane.hidden).toBe(true);
    expect(nodesPane.hidden).toBe(false);

    tabScript.click();
    expect(tabScript.getAttribute('aria-selected')).toBe('true');
    expect(tabNodes.getAttribute('aria-selected')).toBe('false');
    expect(scriptPane.hidden).toBe(false);
    expect(nodesPane.hidden).toBe(true);
  });
});
