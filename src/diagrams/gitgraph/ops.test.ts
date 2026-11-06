import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseGitGraph } from './parse';
import { applyGitGraphOp } from './ops';

const B = 'gitGraph\n  commit id: "a"\n  commit\n';
const text = (r: ReturnType<typeof applyGitGraphOp>) => ('text' in r ? r.text : r.error);

describe('applyGitGraphOp', () => {
  it('adds, renames and deletes commits', () => {
    expect(applyGitGraphOp(B, { type: 'addNode', label: 'b', shape: 'filledCircle' })).toEqual({
      text: B + '  commit id: "b"\n',
      createdId: 'c2',
    });
    expect(text(applyGitGraphOp(B, { type: 'renameNode', id: 'c0', label: 'start' }))).toBe(
      B.replace('"a"', '"start"'),
    );
    expect(text(applyGitGraphOp(B, { type: 'renameNode', id: 'c1', label: 'x' }))).toBe(
      'gitGraph\n  commit id: "a"\n  commit id: "x"\n',
    );
    expect(text(applyGitGraphOp(B, { type: 'deleteNode', id: 'c1' }))).toBe('gitGraph\n  commit id: "a"\n');
    expect(applyGitGraphOp(B, { type: 'addEdge', from: 'c0', to: 'c1' })).toEqual({
      error: MESSAGES.opUnsupported,
    });
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseGitGraph(
      text(applyGitGraphOp(B, { type: 'renameNode', id: 'c0', label: 'say "hi": now #1 | ok' })),
    );
    expect(d.ok).toBe(true);
    expect(d.nodes[0].label).toBe('say hi : now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(
      applyGitGraphOp('gitGraph\n  checkout nope\n', { type: 'addNode', label: 'x', shape: 'filledCircle' }),
    ).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
