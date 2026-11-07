import { describe, expect, it } from 'vitest';
import { placeProps } from './props-dock';

interface Fake { name: string; parentElement: FakeParent | null }
interface FakeParent { name: string; kids: Fake[]; appendChild(c: Fake): void; insertBefore(c: Fake, ref: Fake | null): void }

function detach(c: Fake): void {
  if (c.parentElement) c.parentElement.kids.splice(c.parentElement.kids.indexOf(c), 1);
}

function parent(name: string): FakeParent {
  const p: FakeParent = {
    name,
    kids: [],
    appendChild(c) { detach(c); p.kids.push(c); c.parentElement = p; },
    insertBefore(c, ref) {
      detach(c);
      const at = ref ? p.kids.indexOf(ref) : -1;
      if (at === -1) p.kids.push(c); else p.kids.splice(at, 0, c);
      c.parentElement = p;
    },
  };
  return p;
}

function setup() {
  const formatSlot = parent('format');
  const canvasPanel = parent('canvas');
  const canvas: Fake = { name: 'canvas', parentElement: null };
  const props: Fake = { name: 'props', parentElement: null };
  const inlineEdit: Fake = { name: 'inline-edit', parentElement: null };
  canvasPanel.appendChild(canvas);
  canvasPanel.appendChild(props);
  canvasPanel.appendChild(inlineEdit);
  const env = { props, wideParent: formatSlot, canvasPanel, anchor: inlineEdit } as unknown as Parameters<typeof placeProps>[0];
  return { env, formatSlot, canvasPanel };
}

describe('placeProps', () => {
  it('moves the properties panel into the Nodes tab\'s format section on wide screens', () => {
    const { env, formatSlot, canvasPanel } = setup();
    placeProps(env, true);
    expect(formatSlot.kids.map((k) => k.name)).toEqual(['props']);
    expect(canvasPanel.kids.map((k) => k.name)).toEqual(['canvas', 'inline-edit']);
  });

  it('puts it back in its original place in the canvas panel on narrow screens', () => {
    const { env, formatSlot, canvasPanel } = setup();
    placeProps(env, true);
    placeProps(env, false);
    expect(formatSlot.kids).toEqual([]);
    expect(canvasPanel.kids.map((k) => k.name)).toEqual(['canvas', 'props', 'inline-edit']);
  });

  it('leaves the panel alone when it is already in the right place', () => {
    const { env, canvasPanel } = setup();
    placeProps(env, false);
    expect(canvasPanel.kids.map((k) => k.name)).toEqual(['canvas', 'props', 'inline-edit']);
  });
});
