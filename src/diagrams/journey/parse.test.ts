import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseJourney } from './parse';

const T = `journey
  title My working day
  section Go to work
    Make tea: 5: Me
    Go upstairs: 3: Me, Cat
  section Go home
    Go downstairs: 1: Me`;

describe('parseJourney', () => {
  it('reads sections, tasks, scores and actors', () => {
    const d = parseJourney(T);
    expect(d).toMatchObject({ kind: 'journey', ok: true, title: 'My working day' });
    expect(d.nodes.map((n) => n.id)).toEqual(['t1', 'f1', 't2', 'f2', 't3', 'f3']);
    expect(['f1', 'f2', 'f3'].map((id) => d.nodes.find((n) => n.id === id)!.icon)).toEqual([
      'faceHappy',
      'faceNeutral',
      'faceSad',
    ]);
    expect(d.nodes.find((n) => n.id === 't3')!.colorIndex).toBe(1);
    expect(d.edges.map((e) => [e.from, e.to])).toEqual([
      ['f1', 'f2'],
      ['f2', 'f3'],
    ]);
    expect(d.data!.journey!.actors).toEqual(['Me', 'Cat']);
    expect(d.stages).toEqual({
      nodes: { t1: 0, f1: 0, t2: 1, f2: 1, t3: 2, f3: 2 },
      edges: { e0: 1, e1: 2 },
    });
  });

  it('clamps a score outside 1 to 5 with a warning', () => {
    const d = parseJourney('journey\n  Nap: 9: Me');
    expect(d.diagnostics).toContainEqual({
      line: 2,
      severity: 'warning',
      message: MESSAGES.journeyScore,
    });
    expect(d.data!.journey!.tasks[0].score).toBe(5);
  });
});
