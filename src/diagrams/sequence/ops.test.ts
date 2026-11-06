import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseSequence } from './parse';
import { applySequenceOp } from './ops';

const B = 'sequenceDiagram\n  participant A as Alice\n  A->>B: hi\n';
const text = (r: ReturnType<typeof applySequenceOp>) => ('text' in r ? r.text : r.error);

describe('applySequenceOp', () => {
  it('adds participants after the declarations and messages at the end', () => {
    expect(applySequenceOp(B, { type: 'addNode', label: 'Carol', shape: 'actor' })).toEqual({
      text: 'sequenceDiagram\n  participant A as Alice\n  actor P1 as Carol\n  A->>B: hi\n',
      createdId: 'P1',
    });
    expect(applySequenceOp(B, { type: 'addNode', label: 'Dave', shape: 'rect' })).toEqual({
      text: 'sequenceDiagram\n  participant A as Alice\n  participant P1 as Dave\n  A->>B: hi\n',
      createdId: 'P1',
    });
    expect(text(applySequenceOp(B, { type: 'addEdge', from: 'B', to: 'A' }))).toBe(B + '  B->>A: message\n');
  });

  it('renames declared and implicit participants without changing the column order', () => {
    expect(text(applySequenceOp(B, { type: 'renameNode', id: 'A', label: 'Ann' }))).toBe(B.replace('Alice', 'Ann'));
    expect(text(applySequenceOp(B, { type: 'renameNode', id: 'B', label: 'Bob' }))).toBe(
      'sequenceDiagram\n  participant A as Alice\n  participant B as Bob\n  A->>B: hi\n',
    );
    expect(text(applySequenceOp(B, { type: 'renameEdge', index: 0, label: 'hello' }))).toBe(B.replace(': hi', ': hello'));
  });

  it('changes, reverses and deletes messages and participants', () => {
    expect(text(applySequenceOp(B, { type: 'setEdgeVariant', index: 0, variant: '-->>' }))).toBe(B.replace('A->>B', 'A-->>B'));
    expect(text(applySequenceOp(B, { type: 'reverseEdge', index: 0 }))).toBe(B.replace('A->>B: hi', 'B->>A: hi'));
    expect(text(applySequenceOp(B, { type: 'deleteNode', id: 'B' }))).toBe('sequenceDiagram\n  participant A as Alice\n');
    expect(text(applySequenceOp(B, { type: 'setShape', id: 'A', shape: 'actor' }))).toBe(B.replace('participant A', 'actor A'));
    expect(applySequenceOp(B, { type: 'setPin', id: 'A', x: 1, y: 2 })).toEqual({ error: MESSAGES.opUnsupported });
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseSequence(text(applySequenceOp(B, { type: 'renameEdge', index: 0, label: 'say "hi"; now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.edges[0].label).toBe('say hi now 1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applySequenceOp('sequenceDiagram\n  loop x\n', { type: 'addNode', label: 'x', shape: 'rect' })).toEqual({
      error: MESSAGES.fixTextFirst,
    });
  });
});
