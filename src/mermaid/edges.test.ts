import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from './parse';
import { readEdgeOperator, scanStatement } from './tokens';

describe('edges', () => {
  const cases: [string, { from: string; to: string; kind: string; label: string }[], number, boolean?][] = [
    ['A-->B', [{ from: 'A', to: 'B', kind: 'arrow', label: '' }], 2],
    ['A --- B', [{ from: 'A', to: 'B', kind: 'open', label: '' }], 2],
    ['A -.-> B', [{ from: 'A', to: 'B', kind: 'dottedArrow', label: '' }], 2],
    ['A -.- B', [{ from: 'A', to: 'B', kind: 'dotted', label: '' }], 2],
    ['A ==> B', [{ from: 'A', to: 'B', kind: 'thickArrow', label: '' }], 2],
    ['A === B', [{ from: 'A', to: 'B', kind: 'thick', label: '' }], 2],
    ['A --o B', [{ from: 'A', to: 'B', kind: 'circleEnd', label: '' }], 2],
    ['A --x B', [{ from: 'A', to: 'B', kind: 'crossEnd', label: '' }], 2],
    ['A <--> B', [{ from: 'A', to: 'B', kind: 'bidirectional', label: '' }], 2],
    ['A ---> B', [{ from: 'A', to: 'B', kind: 'arrow', label: '' }], 2],
    ['A -->|yes| B', [{ from: 'A', to: 'B', kind: 'arrow', label: 'yes' }], 2],
    ['A -- yes --> B', [{ from: 'A', to: 'B', kind: 'arrow', label: 'yes' }], 2],
    ['A -- yes --- B', [{ from: 'A', to: 'B', kind: 'open', label: 'yes' }], 2],
    ['A -. maybe .-> B', [{ from: 'A', to: 'B', kind: 'dottedArrow', label: 'maybe' }], 2],
    ['A == big ==> B', [{ from: 'A', to: 'B', kind: 'thickArrow', label: 'big' }], 2],
    [
      'A --> B --> C',
      [
        { from: 'A', to: 'B', kind: 'arrow', label: '' },
        { from: 'B', to: 'C', kind: 'arrow', label: '' },
      ],
      3,
    ],
    [
      'A --> B & C',
      [
        { from: 'A', to: 'B', kind: 'arrow', label: '' },
        { from: 'A', to: 'C', kind: 'arrow', label: '' },
      ],
      3,
    ],
    [
      'A & B --> C & D',
      [
        { from: 'A', to: 'C', kind: 'arrow', label: '' },
        { from: 'A', to: 'D', kind: 'arrow', label: '' },
        { from: 'B', to: 'C', kind: 'arrow', label: '' },
        { from: 'B', to: 'D', kind: 'arrow', label: '' },
      ],
      4,
    ],
    ['A[Start] --> B{Check}', [{ from: 'A', to: 'B', kind: 'arrow', label: '' }], 2],
    ['A --> A', [{ from: 'A', to: 'A', kind: 'arrow', label: '' }], 1],
    ['A --> B;', [{ from: 'A', to: 'B', kind: 'arrow', label: '' }], 2],
    ['A -->', [], 0, true],
    ['A --> B; B --> C', [], 0, true],
    ['A -- B', [], 0, true],
    ['--> B', [], 0, true],
    ['A --> B -->', [], 0, true],
  ];

  for (const [input, expectedEdges, nodeCount, expectUnknown] of cases) {
    it(`parses: ${input}`, () => {
      const doc = parseMermaid('flowchart TD\n' + input);
      if (expectUnknown) {
        expect(doc.edges.length).toBe(0);
        expect(doc.nodes.length).toBe(0);
        expect(doc.lines[1].kind).toBe('unknown');
        expect(doc.diagnostics.map(d => d.message)).toContain(MESSAGES.unknownLine);
      } else {
        expect(doc.nodes.length).toBe(nodeCount);
        expect(doc.edges.length).toBe(expectedEdges.length);
        for (let i = 0; i < expectedEdges.length; i++) {
          expect(doc.edges[i]).toMatchObject({
            from: expectedEdges[i].from,
            to: expectedEdges[i].to,
            kind: expectedEdges[i].kind,
            label: expectedEdges[i].label,
          });
        }
      }
    });
  }

  it('handles operator reading and scanning directly', () => {
    expect(readEdgeOperator('--> B', 0)).toEqual({ kind: 'arrow', label: '', end: 3 });
    expect(readEdgeOperator('-->|x| B', 0)).toEqual({ kind: 'arrow', label: 'x', end: 6 });
    expect(readEdgeOperator('-- hi --> B', 0)).toEqual({ kind: 'arrow', label: 'hi', end: 9 });
    expect(scanStatement('  A --> B')!.map(t => t.type)).toEqual(['node', 'edge', 'node']);
    expect(scanStatement('  A --> B')![0]).toMatchObject({ start: 2, end: 3 });
    const d = parseMermaid('flowchart TD\nA-->B\nB-->C');
    expect(d.edges.map(e => e.id)).toEqual(['e0', 'e1']);
    expect(d.lines[2].edgeIndexes).toEqual([1]);
    expect(d.lines[2].nodeIds).toEqual(['B', 'C']);

    const many = 'flowchart TD\n' + Array.from({ length: 301 }, (_, i) => `N${i}`).join('\n');
    expect(parseMermaid(many).nodes.length).toBe(300);
    expect(parseMermaid(many).diagnostics.map(x => x.message)).toContain(MESSAGES.tooManyNodes);

    const dup = 'flowchart TD\n' + Array.from({ length: 601 }, () => 'A-->B').join('\n');
    expect(parseMermaid(dup).edges.length).toBe(600);
    expect(parseMermaid(dup).ok).toBe(false);
  });
});
