import { describe, expect, it } from 'vitest';
import { detectKind } from './detect';

describe('detectKind', () => {
  it.each([
    ['flowchart LR\nA-->B', 'flowchart', 0], ['graph TD', 'flowchart', 0],
    ['sequenceDiagram\n  A->>B: hi', 'sequence', 0], ['%% note\n\nclassDiagram', 'class', 2],
    ['---\ntitle: T\n---\nstateDiagram-v2', 'state', 3], ['stateDiagram', 'state', 0],
    ['erDiagram', 'er', 0], ['requirementDiagram', 'requirement', 0], ['usecase-beta', 'usecase', 0],
    ['architecture-beta', 'architecture', 0], ['block-beta', 'block', 0], ['block', 'block', 0],
    ['gitGraph TB:', 'gitgraph', 0], ['journey', 'journey', 0], ['timeline TD', 'timeline', 0], ['mindmap', 'mindmap', 0],
  ])('%j is %s', (text, kind, headerIdx) => {
    expect(detectKind(text)).toMatchObject({ kind, headerIdx });
  });
  it('names unsupported types and leaves other text unknown', () => {
    expect(detectKind('pie title Pets')).toEqual({ kind: 'unsupported', headerIdx: 0, name: 'Pie chart' });
    expect(detectKind('gantt\n dateFormat YYYY')).toMatchObject({ kind: 'unsupported', name: 'Gantt chart' });
    expect(detectKind('blockade')).toMatchObject({ kind: 'unknown' });
    expect(detectKind('')).toEqual({ kind: 'unknown', headerIdx: -1, name: '' });
  });
});
