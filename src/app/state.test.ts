import { describe, expect, it } from 'vitest';
import { applyText, createState } from './state';
import { testMeasure } from '../../tests/support/measure';
import { DEFAULT_ANIM } from '../anim/anim';
import type { Settings } from './storage';

describe('state', () => {
  it('creates and updates AppState, preserving last good scene on error', () => {
    const defaults: Settings = { theme: 'auto', anim: DEFAULT_ANIM };
    const s1 = applyText(
      createState('flowchart TD\nA-->B', defaults),
      'flowchart TD\nA-->B',
      testMeasure,
    );
    expect(s1.doc.ok).toBe(true);
    expect(s1.scene).not.toBeNull();

    const s2 = applyText(s1, 'sequenceDiagram', testMeasure);
    expect(s2.doc.ok).toBe(false);
    expect(s2.scene).toBe(s1.scene); // last good scene kept

    const s3 = applyText(s2, 'flowchart TD\nX', testMeasure);
    expect(s3.scene).not.toBe(s1.scene);
    expect(s3.scene!.doc.nodes.map((n) => n.id)).toEqual(['X']);
    expect(s1.text).toBe('flowchart TD\nA-->B'); // input not mutated
  });
});
