import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { CORPUS } from '../../tests/support/corpus';
import { parseMermaid } from './parse';

describe('lines and corpus', () => {
  it('parses lines and corpus robustly', () => {
    const d = parseMermaid(CORPUS[4].text);
    expect(d.lines.map(l => l.kind)).toEqual([
      'directive',
      'header',
      'comment',
      'statement',
      'unknown',
      'comment',
      'pos',
      'pos',
    ]);
    expect(d.pins).toEqual({ A: { x: 100, y: 40 }, B: { x: 100, y: 200 } });
    expect(d.diagnostics).toEqual([{ line: 5, severity: 'warning', message: MESSAGES.unknownLine }]);
    expect(d.lines[3]).toMatchObject({ nodeIds: ['A', 'B'], edgeIndexes: [0] });
    expect(parseMermaid('flowchart TD\n%% studio:pos A 1.5 -2').pins.A).toEqual({ x: 1.5, y: -2 });
    expect(parseMermaid('flowchart TD\r\n\tA[Hi] --> B\t\r\n').edges.length).toBe(1); // tabs, CRLF (Review Focus 1)
    expect(parseMermaid('flowchart TD\nA["x [y] (z)"] --> B').nodes[0].label).toBe('x [y] (z)');

    // corpus
    for (const c of CORPUS) {
      const doc = parseMermaid(c.text);
      expect([c.name, doc.ok, doc.nodes.length, doc.edges.length, doc.groups.length]).toEqual([
        c.name,
        c.ok,
        c.nodes,
        c.edges,
        c.groups,
      ]);
    }

    // robustness: never throws, always one SourceLine per line
    function mulberry32(seed: number) {
      let a = seed;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const alphabet = 'AB[]{}()-><|&;:%"\n .=#';
    for (let seed = 1; seed <= 200; seed++) {
      const rng = mulberry32(seed);
      const len = Math.floor(rng() * 60) + 1;
      let s = '';
      for (let i = 0; i < len; i++) {
        s += alphabet[Math.floor(rng() * alphabet.length)];
      }
      expect(() => {
        const res = parseMermaid(s);
        expect(res.lines.length).toBe(s.split(/\r\n|\r|\n/).length);
      }).not.toThrow();
    }
  });
});
