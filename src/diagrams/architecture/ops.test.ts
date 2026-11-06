import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseArchitecture } from './parse';
import { applyArchitectureOp } from './ops';

const B = 'architecture-beta\n  service a(server)[A]\n  service b(database)[B]\n  a:R -- L:b\n';
const text = (r: ReturnType<typeof applyArchitectureOp>) => ('text' in r ? r.text : r.error);

describe('applyArchitectureOp', () => {
  it('adds, connects, renames, changes, reverses and deletes', () => {
    expect(applyArchitectureOp(B, { type: 'addNode', label: 'Cache', shape: 'round' })).toEqual({
      text: B + '  service s1(server)[Cache]\n',
      createdId: 's1',
    });
    expect(text(applyArchitectureOp(B, { type: 'addEdge', from: 'b', to: 'a' }))).toBe(B + '  b:R -- L:a\n');
    expect(text(applyArchitectureOp(B, { type: 'renameNode', id: 'a', label: 'Api' }))).toBe(B.replace('[A]', '[Api]'));
    expect(text(applyArchitectureOp(B, { type: 'setEdgeVariant', index: 0, variant: '-->' }))).toBe(B.replace('a:R -- L:b', 'a:R --> L:b'));
    expect(text(applyArchitectureOp(B, { type: 'reverseEdge', index: 0 }))).toBe(B.replace('a:R -- L:b', 'b:L -- R:a'));
    expect(text(applyArchitectureOp(B, { type: 'deleteNode', id: 'b' }))).toBe('architecture-beta\n  service a(server)[A]\n');
    expect(text(applyArchitectureOp(B, { type: 'setPin', id: 'a', x: 5, y: 6 }))).toContain('%% studio:pos a 5 6');
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseArchitecture(text(applyArchitectureOp(B, { type: 'renameNode', id: 'a', label: 'say [hi]: now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes[0].label).toBe('say hi : now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applyArchitectureOp('architecture-beta\n  a:R -- L:missing\n', { type: 'addNode', label: 'x', shape: 'round' })).toEqual({
      error: MESSAGES.fixTextFirst,
    });
  });
});
