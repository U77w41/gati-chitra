import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { applyBlockOp } from './ops';
import { parseBlock } from './parse';

const B = 'block\n  a b["Bee"]\n  a --> b\n';
const text = (r: ReturnType<typeof applyBlockOp>) => ('text' in r ? r.text : r.error);

describe('applyBlockOp', () => {
  it('adds, renames, reshapes and deletes blocks', () => {
    expect(applyBlockOp(B, { type: 'addNode', label: 'Cat', shape: 'rect' })).toEqual({
      text: B + '  b1["Cat"]\n',
      createdId: 'b1',
    });
    expect(text(applyBlockOp(B, { type: 'renameNode', id: 'a', label: 'Ant' }))).toBe(
      'block\n  a["Ant"] b["Bee"]\n  a --> b\n',
    );
    expect(text(applyBlockOp(B, { type: 'renameNode', id: 'b', label: 'Bug' }))).toBe(
      B.replace('Bee', 'Bug'),
    );
    expect(text(applyBlockOp(B, { type: 'setShape', id: 'b', shape: 'round' }))).toBe(
      B.replace('b["Bee"]', 'b("Bee")'),
    );
    expect(text(applyBlockOp(B, { type: 'deleteNode', id: 'a' }))).toBe('block\n  b["Bee"]\n');
    expect(text(applyBlockOp(B, { type: 'setEdgeVariant', index: 0, variant: '---' }))).toBe(
      B.replace('a --> b', 'a --- b'),
    );
    expect(applyBlockOp(B, { type: 'reverseEdge', index: 0 })).toEqual({
      error: MESSAGES.opUnsupported,
    });
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseBlock(
      text(applyBlockOp(B, { type: 'renameNode', id: 'b', label: 'say "hi": now #1 | ok' })),
    );
    expect(d.ok).toBe(true);
    expect(d.nodes.find((n) => n.id === 'b')!.label).toBe('say hi : now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applyBlockOp('block\n  block:x\n', { type: 'addNode', label: 'x', shape: 'rect' })).toEqual(
      { error: MESSAGES.fixTextFirst },
    );
  });
});
