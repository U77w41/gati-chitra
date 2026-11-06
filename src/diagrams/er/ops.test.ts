import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseEr } from './parse';
import { applyErOp } from './ops';

const B = 'erDiagram\n  A ||--o{ B : has\n';
const text = (r: ReturnType<typeof applyErOp>) => ('text' in r ? r.text : r.error);

describe('applyErOp', () => {
  it('adds, connects and renames', () => {
    expect(applyErOp(B, { type: 'addNode', label: 'Item', shape: 'rect' })).toEqual({
      text: B + '  E1["Item"]\n',
      createdId: 'E1',
    });
    expect(text(applyErOp(B, { type: 'addEdge', from: 'B', to: 'A' }))).toBe(
      B + '  B ||--o{ A : "relates"\n',
    );
    expect(text(applyErOp(B, { type: 'renameNode', id: 'A', label: 'Account' }))).toBe(
      'erDiagram\n  A["Account"]\n  A ||--o{ B : has\n',
    );
    expect(text(applyErOp(B, { type: 'renameEdge', index: 0, label: 'owns many' }))).toBe(
      'erDiagram\n  A ||--o{ B : "owns many"\n',
    );
  });

  it('changes, reverses and deletes relationships', () => {
    expect(text(applyErOp(B, { type: 'setEdgeVariant', index: 0, variant: '}o--o{' }))).toBe(
      'erDiagram\n  A }o--o{ B : has\n',
    );
    expect(text(applyErOp(B, { type: 'reverseEdge', index: 0 }))).toBe(
      'erDiagram\n  B }o--|| A : "has"\n',
    );
    expect(text(applyErOp(B, { type: 'deleteNode', id: 'B' }))).toBe('erDiagram\n');
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseEr(text(applyErOp(B, { type: 'renameNode', id: 'A', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes).toHaveLength(2);
    expect(d.nodes[0].label).toBe('say hi : now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applyErOp('erDiagram\n  A {\n', { type: 'deleteNode', id: 'A' })).toEqual({
      error: MESSAGES.fixTextFirst,
    });
  });
});
