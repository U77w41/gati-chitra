import { afterEach, expect, it } from 'vitest';
import { EDGE_KIND_NAMES, SHAPE_NAMES } from '../core/shapes';
import { parseMermaid } from '../mermaid/parse';
import { loadEngine, setLoaderForTest } from '../diagrams/registry';
import { fakeEngine } from '../../tests/support/fake-engine';
import { kindControlModel } from './kind-ui';

afterEach(() => setLoaderForTest('sequence', null));

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
