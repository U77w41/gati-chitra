import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../../tests/support/measure';
import { layoutJourney } from './layout';
import { parseJourney } from './parse';

const T = `journey
  title My working day
  section Go to work
    Make tea: 5: Me
    Go upstairs: 3: Me, Cat
  section Go home
    Go downstairs: 1: Me`;

describe('layoutJourney', () => {
  it('places tasks in a row and faces by score', () => {
    const L = layoutJourney(parseJourney(T), testMeasure);
    expect(L.nodes.t1.center).toEqual({ x: 215, y: 68 });
    expect(L.nodes.f1.center).toEqual({ x: 215, y: 148 });
    expect(L.nodes.f2.center).toEqual({ x: 385, y: 220 });
    expect(L.nodes.f3.center.y).toBe(292);
    expect(
      L.decorations!
        .filter((d) => d.kind === 'rect' && d.role === 'band' && d.label)
        .map((d) => (d.kind === 'rect' ? d.label : '')),
    ).toEqual(['Go to work', 'Go home']);
  });
});
