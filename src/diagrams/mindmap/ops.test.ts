import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { applyMindmapOp } from './ops';
import { parseMindmap } from './parse';

const B = 'mindmap\n  root((R))\n    A\n      A1\n    B\n'; // ids: root, m1 (A), m2 (A1), m3 (B)
const text = (r: ReturnType<typeof applyMindmapOp>) => ('text' in r ? r.text : r.error);

describe('applyMindmapOp', () => {
  it('adds a child of the root and moves a branch under another node', () => {
    expect(applyMindmapOp(B, { type: 'addNode', label: 'C', shape: 'round' })).toEqual({
      text: B + '    m4(C)\n',
      createdId: 'm4',
    });
    expect(text(applyMindmapOp(B, { type: 'addEdge', from: 'm3', to: 'm1' }))).toBe(
      'mindmap\n  root((R))\n    B\n      A\n        A1\n',
    );
    expect(applyMindmapOp(B, { type: 'addEdge', from: 'm2', to: 'm1' })).toEqual({
      error: MESSAGES.mindmapCycle,
    });
  });

  it('renames, reshapes and deletes branches', () => {
    expect(text(applyMindmapOp(B, { type: 'renameNode', id: 'm1', label: 'Apple' }))).toBe(
      B.replace('    A\n', '    Apple\n'),
    );
    expect(text(applyMindmapOp(B, { type: 'setShape', id: 'm3', shape: 'rect' }))).toBe(
      B.replace('    B\n', '    [B]\n'),
    );
    expect(text(applyMindmapOp(B, { type: 'deleteNode', id: 'm1' }))).toBe('mindmap\n  root((R))\n    B\n');
    expect(applyMindmapOp(B, { type: 'deleteNode', id: 'root' })).toEqual({
      error: MESSAGES.opUnsupported,
    });
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseMindmap(text(applyMindmapOp(B, { type: 'renameNode', id: 'm3', label: 'say (hi): now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes.find((n) => n.id === 'm3')!.label).toBe('say hi : now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applyMindmapOp('mindmap\n  a\n  b\n', { type: 'addNode', label: 'x', shape: 'round' })).toEqual({
      error: MESSAGES.fixTextFirst,
    });
  });
});
