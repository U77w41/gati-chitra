import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseClass } from './parse';
import { applyClassOp } from './ops';

const B = 'classDiagram\n  class A\n  A <|-- B\n';
const text = (r: ReturnType<typeof applyClassOp>) => ('text' in r ? r.text : r.error);

describe('applyClassOp', () => {
  it('adds, connects and renames', () => {
    expect(applyClassOp(B, { type: 'addNode', label: 'Shape', shape: 'rect' })).toEqual({ text: B + '  class Class1["Shape"]\n', createdId: 'Class1' });
    expect(text(applyClassOp(B, { type: 'addEdge', from: 'A', to: 'B', label: 'uses' }))).toBe(B + '  A --> B : uses\n');
    expect(text(applyClassOp(B, { type: 'renameNode', id: 'A', label: 'Animal' }))).toBe('classDiagram\n  class A["Animal"]\n  A <|-- B\n');
    expect(text(applyClassOp(B, { type: 'renameNode', id: 'B', label: 'Bee' }))).toBe('classDiagram\n  class B["Bee"]\n  class A\n  A <|-- B\n');
    expect(text(applyClassOp(B, { type: 'renameEdge', index: 0, label: 'is' }))).toBe('classDiagram\n  class A\n  A <|-- B : is\n');
  });

  it('changes, reverses and deletes relations', () => {
    expect(text(applyClassOp(B, { type: 'setEdgeVariant', index: 0, variant: '*--' }))).toBe('classDiagram\n  class A\n  A *-- B\n');
    expect(text(applyClassOp(B, { type: 'reverseEdge', index: 0 }))).toBe('classDiagram\n  class A\n  B --|> A\n');
    expect(text(applyClassOp(B, { type: 'deleteNode', id: 'A' }))).toBe('classDiagram\n');
    expect(text(applyClassOp(B, { type: 'setNodeStyle', id: 'A', style: { fill: '#f00' } }))).toBe(B + '  style A fill:#f00\n');
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseClass(text(applyClassOp(B, { type: 'renameNode', id: 'A', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes.find((n) => n.id === 'A')!.label).toBe('say hi : now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applyClassOp('classDiagram\n  class A {\n', { type: 'deleteNode', id: 'A' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
