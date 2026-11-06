import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { guardOk } from '../common/edit';
import { applyJourneyOp } from './ops';
import { parseJourney } from './parse';

const B = 'journey\n  section S\n    Tea: 5: Me\n';
const text = (r: ReturnType<typeof applyJourneyOp>) => ('text' in r ? r.text : r.error);

describe('applyJourneyOp', () => {
  it('adds, renames and deletes tasks', () => {
    expect(applyJourneyOp(B, { type: 'addNode', label: 'Walk', shape: 'round' })).toEqual({
      text: B + '    Walk: 3: Me\n',
      createdId: 't2',
    });
    expect(text(applyJourneyOp(B, { type: 'renameNode', id: 't1', label: 'Coffee' }))).toBe(
      B.replace('Tea', 'Coffee'),
    );
    expect(applyJourneyOp(B, { type: 'renameNode', id: 'f1', label: 'x' })).toEqual({
      error: MESSAGES.opUnsupported,
    });
    expect(text(applyJourneyOp(B, { type: 'deleteNode', id: 'f1' }))).toBe('journey\n  section S\n');
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseJourney(
      text(applyJourneyOp(B, { type: 'renameNode', id: 't1', label: 'say "hi": now #1 | ok' })),
    );
    expect(d.ok).toBe(true);
    expect(d.nodes[0].label).toBe('say hi now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    const bad = { ...parseJourney(B), ok: false };
    expect(guardOk(bad)).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
