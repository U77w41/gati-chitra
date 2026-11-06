import { describe, expect, it } from 'vitest';
import { parseTimeline } from './parse';

const T = `timeline
  title History
  section Early
    2002 : LinkedIn
    2004 : Facebook : Google
  section Later
    2005 : YouTube
         : Reddit`;

describe('parseTimeline', () => {
  it('reads periods, events, continuation lines and sections', () => {
    const d = parseTimeline(T);
    expect(d).toMatchObject({ kind: 'timeline', ok: true, title: 'History' });
    expect(d.nodes.map((n) => [n.id, n.label])).toEqual([
      ['p1', '2002'],
      ['p1e1', 'LinkedIn'],
      ['p2', '2004'],
      ['p2e1', 'Facebook'],
      ['p2e2', 'Google'],
      ['p3', '2005'],
      ['p3e1', 'YouTube'],
      ['p3e2', 'Reddit'],
    ]);
    expect(d.edges).toHaveLength(7);
    expect(d.edges.map((e) => `${e.from}>${e.to}`)).toEqual(
      expect.arrayContaining(['p1>p2', 'p2>p3', 'p2e1>p2e2', 'p3e1>p3e2']),
    );
    expect(d.nodes.find((n) => n.id === 'p3')!.colorIndex).toBe(1);
    const s = d.nodes.find((n) => n.id === 'p2e2')!.labelSpan!;
    expect(T.split('\n')[s.line].slice(s.from, s.to)).toBe('Google');
  });
});
