import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseUsecase } from './parse';
import { applyUsecaseOp } from './ops';

const B = 'usecase-beta\n  actor U\n  Login("Sign in")\n  U --> Login\n';
const text = (r: ReturnType<typeof applyUsecaseOp>) => ('text' in r ? r.text : r.error);

describe('applyUsecaseOp', () => {
  it('adds use cases, actors and edges', () => {
    expect(applyUsecaseOp(B, { type: 'addNode', label: 'Buy', shape: 'ellipse' })).toEqual({
      text: B + '  UC1("Buy")\n',
      createdId: 'UC1',
    });
    expect(applyUsecaseOp(B, { type: 'addNode', label: 'Admin', shape: 'actor' })).toEqual({
      text: B + '  actor Actor1("Admin")\n',
      createdId: 'Actor1',
    });
    expect(text(applyUsecaseOp(B, { type: 'addEdge', from: 'Login', to: 'U' }))).toBe(B + '  Login --> U\n');
  });

  it('renames and labels', () => {
    expect(text(applyUsecaseOp(B, { type: 'renameNode', id: 'Login', label: 'Authenticate' }))).toBe(B.replace('"Sign in"', '"Authenticate"'));
    expect(text(applyUsecaseOp(B, { type: 'renameNode', id: 'U', label: 'User' }))).toBe(B.replace('actor U\n', 'actor U("User")\n'));
    expect(text(applyUsecaseOp(B, { type: 'renameEdge', index: 0, label: 'starts' }))).toBe(B.replace('U --> Login', 'U -- "starts" --> Login'));
  });

  it('changes, reverses and deletes', () => {
    expect(text(applyUsecaseOp(B, { type: 'setEdgeVariant', index: 0, variant: '--' }))).toBe(B.replace('U --> Login', 'U -- Login'));
    expect(text(applyUsecaseOp(B, { type: 'reverseEdge', index: 0 }))).toBe(B.replace('U --> Login', 'Login <-- U'));
    expect(text(applyUsecaseOp(B, { type: 'deleteNode', id: 'Login' }))).toBe('usecase-beta\n  actor U\n');
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseUsecase(text(applyUsecaseOp(B, { type: 'renameNode', id: 'Login', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes.find((n) => n.id === 'Login')!.label).toBe('say hi : now #1 | ok');
  });

  it('refuses ops while the text has errors', () => {
    expect(applyUsecaseOp('usecase-beta\n  systemBoundary b\n', { type: 'addNode', label: 'x', shape: 'ellipse' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
