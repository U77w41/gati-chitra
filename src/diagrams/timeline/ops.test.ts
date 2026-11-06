import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { guardOk } from '../common/edit';
import { applyTimelineOp } from './ops';
import { parseTimeline } from './parse';

const B = 'timeline\n  2004 : Facebook : Google\n  2005 : YouTube\n';
const text = (r: ReturnType<typeof applyTimelineOp>) => ('text' in r ? r.text : r.error);

describe('applyTimelineOp', () => {
  it('adds periods and renames periods and events', () => {
    expect(applyTimelineOp(B, { type: 'addNode', label: '2006', shape: 'round' })).toEqual({
      text: B + '  2006\n',
      createdId: 'p3',
    });
    expect(text(applyTimelineOp(B, { type: 'renameNode', id: 'p1', label: '2003' }))).toBe(
      B.replace('2004', '2003'),
    );
    expect(text(applyTimelineOp(B, { type: 'renameNode', id: 'p1e2', label: 'Gmail' }))).toBe(
      B.replace('Google', 'Gmail'),
    );
  });

  it('deletes events and periods', () => {
    expect(text(applyTimelineOp(B, { type: 'deleteNode', id: 'p1e1' }))).toBe(
      B.replace('2004 : Facebook : Google', '2004 : Google'),
    );
    expect(text(applyTimelineOp(B, { type: 'deleteNode', id: 'p2' }))).toBe(
      'timeline\n  2004 : Facebook : Google\n',
    );
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseTimeline(
      text(applyTimelineOp(B, { type: 'renameNode', id: 'p1', label: 'say "hi": now #1 | ok' })),
    );
    expect(d.ok).toBe(true);
    expect(d.nodes.length).toBe(parseTimeline(B).nodes.length);
    expect(d.nodes[0].label).toBe('say hi now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(guardOk({ ...parseTimeline(B), ok: false })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
