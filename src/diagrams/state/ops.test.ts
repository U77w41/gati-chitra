import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseState } from './parse';
import { applyStateOp } from './ops';

const B = 'stateDiagram-v2\n  [*] --> A\n  A --> B\n';
const text = (r: ReturnType<typeof applyStateOp>) => ('text' in r ? r.text : r.error);

describe('applyStateOp', () => {
  it('adds, connects, renames, reverses and deletes', () => {
    expect(applyStateOp(B, { type: 'addNode', label: 'New', shape: 'round' })).toEqual({ text: B + '  S1 : New\n', createdId: 'S1' });
    expect(text(applyStateOp(B, { type: 'addEdge', from: 'B', to: 'A', label: 'back' }))).toBe(B + '  B --> A : back\n');
    expect(text(applyStateOp(B, { type: 'renameNode', id: 'A', label: 'Idle' }))).toBe(B + '  A : Idle\n');
    expect(text(applyStateOp(B, { type: 'renameEdge', index: 1, label: 'go' }))).toBe('stateDiagram-v2\n  [*] --> A\n  A --> B : go\n');
    expect(text(applyStateOp(B, { type: 'reverseEdge', index: 1 }))).toBe('stateDiagram-v2\n  [*] --> A\n  B --> A\n');
    expect(text(applyStateOp(B, { type: 'deleteNode', id: 'B' }))).toBe('stateDiagram-v2\n  [*] --> A\n');
    expect(text(applyStateOp(B, { type: 'setNodeStyle', id: 'A', style: { fill: '#f00' } }))).toBe(B + '  classDef gc_A fill:#f00\n  class A gc_A\n');
    expect(text(applyStateOp(B, { type: 'setPin', id: 'A', x: 10, y: 20 }))).toContain('%% studio:pos A 10 20');
  });

  it('keeps transitions inside their composite state', () => {
    const C = 'stateDiagram-v2\n  A --> B\n  state C {\n    D --> E\n  }\n';
    expect(applyStateOp(C, { type: 'addEdge', from: 'A', to: 'D' })).toEqual({ error: MESSAGES.crossScope });
    expect(text(applyStateOp(C, { type: 'addEdge', from: 'E', to: 'D' }))).toBe('stateDiagram-v2\n  A --> B\n  state C {\n    D --> E\n    E --> D\n  }\n');
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const r = applyStateOp(B, { type: 'renameNode', id: 'A', label: 'say "hi": now #1 | ok' });
    const d = parseState(text(r));
    expect(d.ok).toBe(true);
    expect(d.nodes).toHaveLength(parseState(B).nodes.length);
    expect(d.nodes.find((n) => n.id === 'A')!.label).toBe('say hi now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applyStateOp('stateDiagram-v2\n  state X {\n', { type: 'addNode', label: 'x', shape: 'round' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
