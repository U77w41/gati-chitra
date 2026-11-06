import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../../tests/support/measure';
import { layoutTimeline } from './layout';
import { parseTimeline } from './parse';

const T = `timeline
  title History
  section Early
    2002 : LinkedIn
    2004 : Facebook : Google
  section Later
    2005 : YouTube
         : Reddit`;

describe('layoutTimeline', () => {
  it('puts periods in columns with their events below', () => {
    const L = layoutTimeline(parseTimeline(T), testMeasure);
    expect(L.nodes.p1.center).toEqual({ x: 75, y: 78 });
    expect(L.nodes.p2.center).toEqual({ x: 249, y: 78 });
    expect(L.nodes.p1e1.center).toEqual({ x: 75, y: 142 });
    expect(L.nodes.p2e2.center).toEqual({ x: 249, y: 202 });
    expect(L.decorations!.filter((d) => d.kind === 'rect' && d.role === 'band')).toHaveLength(2);
  });
});
