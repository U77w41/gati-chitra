import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseState } from './parse';
const T = `stateDiagram-v2
  [*] --> Still
  Still --> Moving : push
  Moving --> Crash
  Crash --> [*]
  state Moving {
    [*] --> Slow
    Slow --> Fast
  }`;
describe('parseState', () => {
  it('reads states, pseudo-states, composites and labels', () => {
    const d = parseState(T);
    expect(d).toMatchObject({ kind: 'state', ok: true, direction: 'TB' });
    expect(d.nodes.map((n) => n.id)).toEqual(['__start_root', 'Still', 'Crash', '__end_root', '__start_Moving', 'Slow', 'Fast']);
    expect(d.groups.map((g) => [g.id, g.title, g.parent, g.endLine])).toEqual([['Moving', 'Moving', null, 8]]);
    expect(d.edges).toHaveLength(6);
    expect(d.edges[1]).toMatchObject({ from: 'Still', to: 'Moving', toIsGroup: true, label: 'push', variant: '-->', markers: { start: 'none', end: 'arrow' } });
    const span = d.edges[1].labelSpan!;
    expect(T.split('\n')[span.line].slice(span.from, span.to)).toBe('push');
    expect(d.nodes.find((n) => n.id === 'Slow')!.group).toBe('Moving');
    expect(d.nodes[0]).toMatchObject({ shape: 'filledCircle', label: '', size: { width: 20, height: 20 } });
    expect(d.nodes[3]).toMatchObject({ shape: 'framedCircle', size: { width: 24, height: 24 } });
  });
  it('reads descriptions, choices, forks, notes and regions', () => {
    const d = parseState(`stateDiagram
  s1 : First
  s1 : more
  state "Second" as s2
  state c <<choice>>
  state f <<fork>>
  note left of s1 : hello
  state Busy {
    a --> b
    --
    x --> y
  }`);
    expect(d.nodes.find((n) => n.id === 's1')!.label).toBe('First\nmore');
    expect(d.nodes.find((n) => n.id === 's2')!.label).toBe('Second');
    expect(d.nodes.find((n) => n.id === 'c')).toMatchObject({ shape: 'diamond', size: { width: 28, height: 28 } });
    expect(d.nodes.find((n) => n.id === 'f')!.shape).toBe('forkBar');
    expect(d.nodes.find((n) => n.id === 'note1')).toMatchObject({ shape: 'note', label: 'hello' });
    expect(d.groups.map((g) => [g.id, g.parent])).toEqual([['Busy', null], ['Busy__r1', 'Busy'], ['Busy__r2', 'Busy']]);
    expect(d.nodes.find((n) => n.id === 'a')!.group).toBe('Busy__r1');
    expect(d.nodes.find((n) => n.id === 'y')!.group).toBe('Busy__r2');
  });
  it('reports an unclosed composite and a stray brace', () => {
    expect(parseState('stateDiagram-v2\n  state X {\n  a --> b').diagnostics).toContainEqual({ line: 2, severity: 'error', message: MESSAGES.unclosedBrace('X') });
    expect(parseState('stateDiagram-v2\n  }').diagnostics).toContainEqual({ line: 2, severity: 'error', message: MESSAGES.strayBlockEnd });
  });
});
