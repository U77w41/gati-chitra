import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { describeDiagram } from './describe';

describe('describeDiagram', () => {
  it('names and describes the diagram', () => {
    expect(
      describeDiagram(
        parseMermaid(
          'flowchart TD\naccTitle: Orders\naccDescr: How orders flow\nA --> B',
        ),
      ),
    ).toEqual({
      name: 'Orders',
      description: 'How orders flow 2 nodes, 1 arrow.',
    });
    expect(
      describeDiagram(parseMermaid('---\ntitle: T\n---\nflowchart TD\nA')).name,
    ).toBe('T');
    expect(
      describeDiagram(parseMermaid('flowchart TD\nA ~~~ B')).description,
    ).toBe('2 nodes, 0 arrows.');
  });

  it('names other diagram types', () => {
    expect(describeDiagram({ ...parseMermaid('flowchart TD\nA'), kind: 'sequence' }).name).toBe('Sequence diagram');
    expect(describeDiagram(parseMermaid('flowchart TD\nA')).name).toBe('Flowchart');
  });
});
