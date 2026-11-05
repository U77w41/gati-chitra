import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { buildSteps, focusAt } from './steps';

describe('buildSteps and focusAt', () => {
  it('builds linear steps for simple chain', () => {
    const doc = parseMermaid('flowchart TD\nA-->B\nB-->C');
    const steps = buildSteps(doc);
    expect(steps).toEqual([
      { nodes: ['A'], edges: [] },
      { nodes: ['B'], edges: ['e0'] },
      { nodes: ['C'], edges: ['e1'] },
    ]);

    expect(focusAt(steps, 1)).toEqual({
      nodes: ['A', 'B'],
      edges: ['e0'],
    });
    expect(focusAt(steps, 99)).toEqual({
      nodes: ['A', 'B', 'C'],
      edges: ['e0', 'e1'],
    });
  });

  it('builds branching steps correctly', () => {
    const doc = parseMermaid('flowchart TD\nA-->B\nA-->C\nB-->D\nC-->D');
    expect(buildSteps(doc)).toEqual([
      { nodes: ['A'], edges: [] },
      { nodes: ['B', 'C'], edges: ['e0', 'e1'] },
      { nodes: ['D'], edges: ['e2', 'e3'] },
    ]);
  });

  it('builds cyclic graph steps without infinite loop', () => {
    const doc = parseMermaid('flowchart TD\nA-->B\nB-->C\nC-->A');
    expect(buildSteps(doc)).toEqual([
      { nodes: ['A'], edges: [] },
      { nodes: ['B'], edges: ['e0'] },
      { nodes: ['C'], edges: ['e1', 'e2'] },
    ]);
  });

  it('builds disconnected components steps', () => {
    const doc = parseMermaid('flowchart TD\nA-->B\nC-->D');
    expect(buildSteps(doc)).toEqual([
      { nodes: ['A', 'C'], edges: [] },
      { nodes: ['B', 'D'], edges: ['e0', 'e1'] },
    ]);
  });

  it('handles single node and empty diagrams', () => {
    expect(buildSteps(parseMermaid('flowchart TD\nA'))).toEqual([
      { nodes: ['A'], edges: [] },
    ]);
    expect(buildSteps(parseMermaid('flowchart TD'))).toEqual([]);
  });

  it('puts staged edges in their own step', () => {
    const doc = { ...parseMermaid('flowchart LR\nA-->B\nB-->A'), stages: { nodes: { A: 0, B: 0 }, edges: { e0: 1, e1: 2 } } };
    expect(buildSteps(doc)).toEqual([{ nodes: ['A', 'B'], edges: [] }, { nodes: [], edges: ['e0'] }, { nodes: [], edges: ['e1'] }]);
  });
});
