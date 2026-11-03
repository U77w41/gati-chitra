import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { edgeOperatorText } from './format';
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
    expect(readEdgeOperator('--> B', 0)).toEqual({ kind: 'arrow', label: '', length: 1, end: 3 });
    expect(readEdgeOperator('-->|x| B', 0)).toEqual({ kind: 'arrow', label: 'x', length: 1, end: 6 });
    expect(readEdgeOperator('-- hi --> B', 0)).toEqual({ kind: 'arrow', label: 'hi', length: 1, end: 9 });
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

  it('reads several statements on one line', () => {
    const d = parseMermaid('flowchart LR\nA --> B; B --> C');
    expect(d.edges.map(e => [e.from, e.to])).toEqual([['A', 'B'], ['B', 'C']]);
    expect(d.diagnostics).toEqual([]);
    expect(d.lines[1].edgeIndexes).toEqual([0, 1]);
  });

  it('keeps ; inside labels', () => {
    expect(parseMermaid('flowchart LR\nA["a;b"] -->|c;d| B').edges[0].label).toBe('c;d');
  });

  it.each([
    ['A <-.-> B', 'dottedBidirectional'], ['A <==> B', 'thickBidirectional'],
    ['A o--o B', 'circleBoth'], ['A x--x B', 'crossBoth'], ['A ~~~ B', 'invisible'],
  ])('%s is %s', (line, kind) => {
    expect(parseMermaid(`flowchart LR\n${line}`).edges[0].kind).toBe(kind);
  });

  it.each([
    ['A --> B', 1], ['A ---> B', 2], ['A ----> B', 3], ['A --- B', 1], ['A ---- B', 2],
    ['A -.-> B', 1], ['A -..-> B', 2], ['A ==> B', 1], ['A ===> B', 2], ['A ==== B', 2],
    ['A -- x ----> B', 3], ['A ~~~ B', 1], ['A <---> B', 2],
  ])('%s has length %i', (line, len) => {
    expect(parseMermaid(`flowchart LR\n${line}`).edges[0].length).toBe(len);
  });

  it('removes quotes around pipe labels', () => {
    expect(parseMermaid('flowchart LR\nA -->|"yes"| B').edges[0].label).toBe('yes');
  });

  it('reads hyphenated and Unicode ids', () => {
    expect(parseMermaid('flowchart LR\nnode-1 --> 节点').nodes.map(n => n.id)).toEqual(['node-1', '节点']);
    expect(parseMermaid('flowchart LR\nA-->B').nodes.map(n => n.id)).toEqual(['A', 'B']);
  });

  it('writes longer operators', () => {
    expect(edgeOperatorText('arrow', 2)).toBe('--->');
    expect(edgeOperatorText('dotted', 3)).toBe('-...-');
    expect(edgeOperatorText('thickBidirectional', 1)).toBe('<==>');
  });
});
