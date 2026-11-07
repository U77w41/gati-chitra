import { afterEach, expect, it, vi } from 'vitest';
import { EDGE_KIND_NAMES, SHAPE_NAMES } from '../core/shapes';
import { parseMermaid } from '../mermaid/parse';
import { loadEngine, setLoaderForTest } from '../diagrams/registry';
import { fakeEngine } from '../../tests/support/fake-engine';
import { kindControlModel, syncKindControls } from './kind-ui';

afterEach(() => {
  setLoaderForTest('sequence', null);
  setLoaderForTest('class', null);
  vi.unstubAllGlobals();
});

it('gives flowcharts their usual controls', () => {
  const m = kindControlModel(parseMermaid('flowchart TD\nA'));
  expect(m.addChoices.map((c) => c.value)).toEqual(Object.keys(SHAPE_NAMES));
  expect(m.edgeChoices.map((c) => c.value)).toEqual(Object.keys(EDGE_KIND_NAMES));
  expect(m.cardEnabled).toBe(true);
});

it('gives other types their engine controls', async () => {
  setLoaderForTest('sequence', async () => fakeEngine('sequence'));
  await loadEngine('sequence');
  const m = kindControlModel({ ...parseMermaid('flowchart TD\nA'), kind: 'sequence' });
  expect(m.addChoices.map((c) => c.value)).toEqual(['rect']);
  expect(m.cardEnabled).toBe(false);
});

it('refills the add list when a type\'s engine arrives after its first parse', async () => {
  // Before an engine loads, the controls fall back to the flowchart lists; once it loads, the
  // same diagram type must get its own lists, or "Add node" offers flowchart shapes.
  const add = { children: [] as { value: string }[], disabled: false,
    set innerHTML(_v: string) { this.children = []; },
    appendChild(o: { value: string }) { this.children.push(o); } };
  vi.stubGlobal('document', {
    querySelector: (sel: string) => (sel === '#add-shape' ? add : null),
    createElement: () => ({ value: '', textContent: '' }),
  });
  const doc = { ...parseMermaid('flowchart TD\nA'), kind: 'class' as const };

  syncKindControls(doc);
  expect(add.children.map((o) => o.value)).toEqual(Object.keys(SHAPE_NAMES));

  setLoaderForTest('class', async () => ({ ...fakeEngine('class'), addChoices: [{ value: 'rect', name: 'Class' }] }));
  await loadEngine('class');
  syncKindControls(doc);
  expect(add.children.map((o) => o.value)).toEqual(['rect']);
});
