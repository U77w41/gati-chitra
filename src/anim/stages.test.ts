import { expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { computeDepths } from '../render/prepared';
import { animStages } from './stages';

it('uses topological depth when the doc has no stages', () => {
  const doc = parseMermaid('flowchart TD\nA-->B-->C\nA-->C');
  const st = animStages(doc);
  expect(st.node).toEqual(computeDepths(doc));
  expect(st.edge).toEqual({ e0: 0, e1: 1, e2: 0 });
  expect(st.count).toBe(3);
});

it('uses explicit stages when the doc has them', () => {
  const doc = {
    ...parseMermaid('flowchart LR\nA-->B\nB-->A'),
    stages: { nodes: { A: 0, B: 0 }, edges: { e0: 1, e1: 2 } },
  };
  expect(animStages(doc)).toEqual({
    node: { A: 0, B: 0 },
    edge: { e0: 1, e1: 2 },
    count: 3,
  });
});
