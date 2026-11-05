import { describe, expect, it } from 'vitest';
import { applyText, commitText, createState, reparseCurrent } from './state';
import { testMeasure } from '../../tests/support/measure';
import { DEFAULT_ANIM } from '../anim/anim';
import { MESSAGES } from '../core/constants';
import type { Settings } from './storage';
import { fakeEngine } from '../../tests/support/fake-engine';
import { loadEngine, setLoaderForTest } from '../diagrams/registry';

describe('state', () => {
  const settings: Settings = { theme: 'auto', anim: DEFAULT_ANIM, split: 0.33 };

  it('keeps the last picture when layout fails', () => {
    const s = createState('flowchart TD\nA', settings);
    const next = applyText(s, 'flowchart TD\nB', () => { throw new Error('boom'); });
    expect(next.scene).toBe(s.scene);
    expect(next.doc.ok).toBe(false);
    expect(next.doc.diagnostics.at(-1)?.message).toBe(MESSAGES.layoutFailed);
  });

  it('creates and updates AppState, preserving last good scene on error', () => {
    const defaults = settings;
    const s1 = applyText(
      createState('flowchart TD\nA-->B', defaults),
      'flowchart TD\nA-->B',
      testMeasure,
    );
    expect(s1.doc.ok).toBe(true);
    expect(s1.scene).not.toBeNull();

    const s2 = applyText(s1, 'pie title Pets', testMeasure);
    expect(s2.doc.ok).toBe(false);
    expect(s2.scene).toBe(s1.scene); // last good scene kept

    const s3 = applyText(s2, 'flowchart TD\nX', testMeasure);
    expect(s3.scene).not.toBe(s1.scene);
    expect(s3.scene!.doc.nodes.map((n) => n.id)).toEqual(['X']);
    expect(s1.text).toBe('flowchart TD\nA-->B'); // input not mutated
  });

  it('reparses the current text, not the text that started the load', async () => {
    setLoaderForTest('sequence', async () => fakeEngine('sequence'));
    let s = createState('sequenceDiagram\n  A->>B: hi', settings);
    expect(s.doc.pending).toBe(true);
    s = applyText(s, 'flowchart TD\nX', testMeasure);
    await loadEngine('sequence');
    s = reparseCurrent(s, testMeasure);
    expect(s.doc.kind).toBeUndefined();
    expect(s.doc.nodes.map((n) => n.id)).toEqual(['X']);
    s = reparseCurrent(applyText(s, 'sequenceDiagram', testMeasure), testMeasure);
    expect(s.doc.kind).toBe('sequence');
    setLoaderForTest('sequence', null);
  });

  it('opening a share link is one undo step above the autosaved diagram', () => {
    let s = createState('flowchart TD\nSaved', settings);
    s = commitText(s, 'flowchart TD\nShared', 'share', testMeasure);
    s = commitText(s, '', 'undo', testMeasure);
    expect(s.text).toBe('flowchart TD\nSaved');
  });
});
