import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseSequence } from './parse';

const T = `sequenceDiagram
  title Checkout
  participant A as Alice
  actor B as Bob
  A->>+B: Hello
  B-->>-A: Hi
  Note over A,B: Agreed
  loop Every minute
    A-)C: ping
  end
  alt ok
    C->>A: fine
  else fail
    C-xA: down
  end`;

describe('parseSequence', () => {
  it('reads participants, actors and notes', () => {
    const d = parseSequence(T);
    expect(d).toMatchObject({ kind: 'sequence', ok: true, title: 'Checkout' });
    expect(d.nodes.map((n) => [n.id, n.shape, n.label])).toEqual([
      ['A', 'rect', 'Alice'],
      ['B', 'actor', 'Bob'],
      ['note1', 'note', 'Agreed'],
      ['C', 'rect', 'C'],
    ]);
    expect(d.data!.sequence!.participants).toEqual(['A', 'B', 'C']);
  });

  it('reads messages with their arrows', () => {
    const e = parseSequence(T).edges;
    expect(e.map((x) => [x.from, x.to, x.variant, x.kind, x.label])).toEqual([
      ['A', 'B', '->>', 'open', 'Hello'],
      ['B', 'A', '-->>', 'dotted', 'Hi'],
      ['A', 'C', '-)', 'open', 'ping'],
      ['C', 'A', '->>', 'open', 'fine'],
      ['C', 'A', '-x', 'open', 'down'],
    ]);
    expect(e[2].markers).toEqual({ start: 'none', end: 'openArrow' });
    expect(e[4].markers).toEqual({ start: 'none', end: 'cross' });
  });

  it('records events and stages in source order', () => {
    const d = parseSequence(T);
    expect(d.data!.sequence!.events).toEqual([
      { type: 'message', edgeId: 'e0' },
      { type: 'activate', id: 'B' },
      { type: 'message', edgeId: 'e1' },
      { type: 'deactivate', id: 'B' },
      { type: 'note', nodeId: 'note1', placement: 'over', targets: ['A', 'B'] },
      { type: 'frameStart', frameId: 0, keyword: 'loop', label: 'Every minute' },
      { type: 'message', edgeId: 'e2' },
      { type: 'frameEnd', frameId: 0 },
      { type: 'frameStart', frameId: 1, keyword: 'alt', label: 'ok' },
      { type: 'message', edgeId: 'e3' },
      { type: 'frameDivider', frameId: 1, label: 'fail' },
      { type: 'message', edgeId: 'e4' },
      { type: 'frameEnd', frameId: 1 },
    ]);
    expect(d.stages).toEqual({
      nodes: { A: 0, B: 0, C: 0, note1: 3 },
      edges: { e0: 1, e1: 2, e2: 4, e3: 5, e4: 6 },
    });
  });

  it('reports unclosed frames, misplaced dividers and approximations', () => {
    expect(parseSequence('sequenceDiagram\n  loop x\n  A->>B: y').diagnostics).toContainEqual({
      line: 2,
      severity: 'error',
      message: MESSAGES.unclosedBlock('loop'),
    });
    expect(parseSequence('sequenceDiagram\n  else x').diagnostics).toContainEqual({
      line: 2,
      severity: 'warning',
      message: MESSAGES.unknownLine,
    });
    expect(parseSequence('sequenceDiagram\n  A-|\\B: half').diagnostics).toContainEqual({
      line: 2,
      severity: 'info',
      message: MESSAGES.syntaxIgnored('Half arrows'),
    });
    expect(parseSequence('sequenceDiagram\n  participant D@{ "type": "database" }').nodes[0].shape).toBe('cylinder');
  });
});
