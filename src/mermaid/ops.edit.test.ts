import { describe, expect, it } from 'vitest';
import { CORPUS } from '../../tests/support/corpus';
import type { TextOp } from '../core/types';
import { applyOp } from './ops';
import { parseMermaid } from './parse';

const run = (t: string, op: TextOp) => applyOp(t, op);

describe('text patches: edit operations', () => {
  it('handles renameNode', () => {
    expect(
      run('flowchart TD\n  A[Start] --> B\n', {
        type: 'renameNode',
        id: 'A',
        label: 'Begin',
      })
    ).toEqual({
      text: 'flowchart TD\n  A[Begin] --> B\n',
    });

    expect(
      run('flowchart TD\n  A --> B\n', {
        type: 'renameNode',
        id: 'A',
        label: 'Begin',
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  A[Begin]\n',
    });

    expect(
      run('flowchart TD\n  A{Q} --> B\n', {
        type: 'renameNode',
        id: 'A',
        label: 'Is it ok?',
      })
    ).toEqual({
      text: 'flowchart TD\n  A{Is it ok?} --> B\n',
    });

    expect(
      run('flowchart TD\n  A[Hi] --> B\n', {
        type: 'renameNode',
        id: 'A',
        label: 'Yes (maybe)',
      })
    ).toEqual({
      text: 'flowchart TD\n  A["Yes (maybe)"] --> B\n',
    });

    expect(
      run('flowchart TD\n  A[Hi]:::hot --> B\n', {
        type: 'renameNode',
        id: 'A',
        label: 'Yo',
      })
    ).toEqual({
      text: 'flowchart TD\n  A[Yo]:::hot --> B\n',
    });

    expect(
      run('flowchart TD\n  A[One] --> B\n  C --> A[One]\n', {
        type: 'renameNode',
        id: 'A',
        label: 'Two',
      })
    ).toEqual({
      text: 'flowchart TD\n  A[Two] --> B\n  C --> A[Two]\n',
    });

    expect(
      run('flowchart TD\n  A\n', {
        type: 'renameNode',
        id: 'Z',
        label: 'x',
      })
    ).toEqual({
      error: 'Unknown node "Z".',
    });
  });

  it.each(['/api', '/api/', '\\x', 'a/b', '>x', 'x@{y}'])('rename to %s round-trips', (label) => {
    const r = applyOp('flowchart TD\nA[Start]', { type: 'renameNode', id: 'A', label });
    expect('text' in r && parseMermaid(r.text).nodes[0]).toMatchObject({ label, shape: 'rect' });
  });

  it('changes the kind of an edge with an inline label in a node group', () => {
    const r = applyOp('flowchart TD\nA & B -- yes|no --> C', { type: 'setEdgeKind', index: 0, kind: 'dottedArrow' });
    expect('text' in r).toBe(true);
    const d = parseMermaid((r as { text: string }).text);
    expect(d.edges.map(e => e.label)).toEqual(['yes|no', 'yes|no']);
  });

  it('handles renameEdge', () => {
    expect(
      run('flowchart TD\n  A -->|yes| B\n', {
        type: 'renameEdge',
        index: 0,
        label: 'sure',
      })
    ).toEqual({
      text: 'flowchart TD\n  A -->|sure| B\n',
    });

    expect(
      run('flowchart TD\n  A -- yes --> B\n', {
        type: 'renameEdge',
        index: 0,
        label: 'sure',
      })
    ).toEqual({
      text: 'flowchart TD\n  A -->|sure| B\n',
    });

    expect(
      run('flowchart TD\n  A --> B\n', {
        type: 'renameEdge',
        index: 0,
        label: 'go',
      })
    ).toEqual({
      text: 'flowchart TD\n  A -->|go| B\n',
    });

    expect(
      run('flowchart TD\n  A -->|yes| B\n', {
        type: 'renameEdge',
        index: 0,
        label: '',
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n',
    });

    expect(
      run('flowchart TD\n  A --> B --> C\n', {
        type: 'renameEdge',
        index: 1,
        label: 'x',
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  B -->|x| C\n',
    });
  });

  it('handles setShape', () => {
    expect(
      run('flowchart TD\n  A[Start] --> B\n', {
        type: 'setShape',
        id: 'A',
        shape: 'diamond',
      })
    ).toEqual({
      text: 'flowchart TD\n  A{Start} --> B\n',
    });

    expect(
      run('flowchart TD\n  A --> B\n', {
        type: 'setShape',
        id: 'A',
        shape: 'circle',
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  A((A))\n',
    });

    expect(
      run('flowchart TD\n  A([Pill])\n', {
        type: 'setShape',
        id: 'A',
        shape: 'hexagon',
      })
    ).toEqual({
      text: 'flowchart TD\n  A{{Pill}}\n',
    });
  });

  it('writes shapes without a bracket form as @{ }', () => {
    const r = applyOp('flowchart TD\nA[Start]', { type: 'setShape', id: 'A', shape: 'document' });
    expect(r).toEqual({ text: 'flowchart TD\nA@{ shape: doc, label: "Start" }' });
  });

  it('handles setEdgeKind', () => {
    expect(
      run('flowchart TD\n  A --> B\n', {
        type: 'setEdgeKind',
        index: 0,
        kind: 'dotted',
      })
    ).toEqual({
      text: 'flowchart TD\n  A -.- B\n',
    });

    expect(
      run('flowchart TD\n  A -->|x| B\n', {
        type: 'setEdgeKind',
        index: 0,
        kind: 'dottedArrow',
      })
    ).toEqual({
      text: 'flowchart TD\n  A -.->|x| B\n',
    });
  });

  it('handles reverseEdge', () => {
    expect(
      run('flowchart TD\n  A[Start] --> B[End]\n', {
        type: 'reverseEdge',
        index: 0,
      })
    ).toEqual({
      text: 'flowchart TD\n  B[End] --> A[Start]\n',
    });

    expect(
      run('flowchart TD\n  A --> B --> C\n', {
        type: 'reverseEdge',
        index: 1,
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  C --> B\n',
    });
  });

  it('handles setNodeStyle', () => {
    expect(
      run('flowchart TD\n  A --> B\n', {
        type: 'setNodeStyle',
        id: 'A',
        style: { fill: '#ffd' },
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  style A fill:#ffd\n',
    });

    expect(
      run('flowchart TD\n  A --> B\n  style A fill:#ffd\n', {
        type: 'setNodeStyle',
        id: 'A',
        style: { stroke: '#333' },
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  style A fill:#ffd,stroke:#333\n',
    });

    expect(
      run('flowchart TD\n  A --> B\n  style A fill:#ffd,stroke:#333\n', {
        type: 'setNodeStyle',
        id: 'A',
        style: { fill: '' },
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  style A stroke:#333\n',
    });

    expect(
      run('flowchart TD\n  A --> B\n  style A fill:#ffd\n', {
        type: 'setNodeStyle',
        id: 'A',
        style: { fill: '' },
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n',
    });
  });

  it('handles renameGroup and setDirection', () => {
    expect(
      run('flowchart TD\n  subgraph g1 [Old]\n    A\n  end\n', {
        type: 'renameGroup',
        id: 'g1',
        title: 'New',
      })
    ).toEqual({
      text: 'flowchart TD\n  subgraph g1 [New]\n    A\n  end\n',
    });

    expect(
      run('flowchart TD\n  A\n', {
        type: 'setDirection',
        direction: 'LR',
      })
    ).toEqual({
      text: 'flowchart LR\n  A\n',
    });

    expect(
      run('graph LR;\nA\n', {
        type: 'setDirection',
        direction: 'TB',
      })
    ).toEqual({
      text: 'graph TD;\nA\n',
    });
  });

  it('satisfies Review Focus 3 on CORPUS[4] after renameNode', () => {
    const orig = CORPUS[4].text;
    const origDoc = parseMermaid(orig);
    const res = run(orig, { type: 'renameNode', id: 'A', label: 'Z' });
    expect('text' in res).toBe(true);
    if ('text' in res) {
      const newDoc = parseMermaid(res.text);
      expect(newDoc.ok).toBe(true);
      const origSpecial = origDoc.lines
        .filter(l => ['unknown', 'directive', 'comment'].includes(l.kind))
        .map(l => l.text);
      const newSpecial = newDoc.lines
        .filter(l => ['unknown', 'directive', 'comment'].includes(l.kind))
        .map(l => l.text);
      expect(newSpecial).toEqual(origSpecial);
    }
  });

  it.each([
    ['A@{ shape: doc, label: "R" }', { type: 'renameNode', id: 'A', label: 'Q' }, 'A@{ shape: doc, label: "Q" }'],
    ['A@{ shape: doc }', { type: 'renameNode', id: 'A', label: 'Q' }, 'A@{ shape: doc, label: "Q" }'],
    ['A@{ shape: doc, label: "R" }', { type: 'setShape', id: 'A', shape: 'diamond' }, 'A@{ shape: diam, label: "R" }'],
    ['A[x]', { type: 'setShape', id: 'A', shape: 'trapezoid' }, 'A[/x\\]'],
    ['A e1@---> B', { type: 'setEdgeKind', index: 0, kind: 'thickArrow' }, 'A e1@===> B'],
    ['A e1@--> B', { type: 'reverseEdge', index: 0 }, 'B e1@--> A'],
  ] as const)('%s', (line, op, expected) => {
    expect(applyOp(`flowchart TD\n${line}`, op)).toEqual({ text: `flowchart TD\n${expected}` });
  });

  it('splits a ; line before changing it', () => {
    const r = applyOp('flowchart TD\n  A --> B; B --> C', { type: 'deleteEdge', index: 1 }) as { text: string };
    const d = parseMermaid(r.text);
    expect(r.text).not.toContain(';');
    expect(d.edges.map(e => [e.from, e.to])).toEqual([['A', 'B']]);
    expect(r.text.split('\n')[1]).toBe('  A --> B');
  });

  it('a rename never creates an entity', () => {
    const r = applyOp('flowchart TD\nA[x]', { type: 'renameNode', id: 'A', label: 'C#1;' }) as { text: string };
    expect(parseMermaid(r.text).nodes[0].label).toBe('C#1;');
  });
});
