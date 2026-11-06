import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseUsecase } from './parse';

const T = `usecase-beta
  direction LR
  actor Customer
  actor Admin("Main administrator")
  Login("Sign in")
  Report[Generate report]
  systemBoundary shop["Online shop"]
    Checkout("Check out")
  end
  Customer --> Login
  Customer -- "buys" --> Checkout
  Admin ---> Report
  Checkout ..> Login : include
  Admin --|> Customer`;

const T2 = `usecase-beta
  direction LR
  actor Customer
  actor Clerk("Shop clerk")
  systemBoundary shop["Online shop"]
    Browse("Browse products")
    Buy("Place an order")
  end
  Customer --> Browse
  Customer --> Buy
  Buy ..> Browse : extend
  note for Customer "A loyal buyer"`;

describe('parseUsecase', () => {
  it('reads actors, use cases, boxes and the boundary', () => {
    const d = parseUsecase(T);
    expect(d).toMatchObject({ kind: 'usecase', ok: true, direction: 'LR' });
    expect(d.nodes.map((n) => [n.id, n.shape, n.label])).toEqual([
      ['Customer', 'actor', 'Customer'],
      ['Admin', 'actor', 'Main administrator'],
      ['Login', 'ellipse', 'Sign in'],
      ['Report', 'rect', 'Generate report'],
      ['Checkout', 'ellipse', 'Check out'],
    ]);
    expect(d.groups.map((g) => [g.id, g.title])).toEqual([['shop', 'Online shop']]);
    expect(d.nodes[4].group).toBe('shop');
  });

  it('reads every operator', () => {
    const e = parseUsecase(T).edges;
    expect(e.map((x) => x.variant)).toEqual(['-->', '-->', '-->', '..>', '--|>']);
    expect(e[1].label).toBe('buys');
    expect(e[3]).toMatchObject({ kind: 'dotted', label: '«include»', markers: { start: 'none', end: 'openArrow' } });
    expect(e[4].markers).toEqual({ start: 'none', end: 'triangle' });
  });

  it('reads actors, use cases, boundaries, notes and relations', () => {
    const d = parseUsecase(T2);
    expect(d).toMatchObject({ kind: 'usecase', direction: 'LR', ok: true });
    expect(d.nodes.map((n) => [n.id, n.shape, n.label])).toEqual([
      ['Customer', 'actor', 'Customer'],
      ['Clerk', 'actor', 'Shop clerk'],
      ['Browse', 'ellipse', 'Browse products'],
      ['Buy', 'ellipse', 'Place an order'],
      ['note_Customer', 'note', 'A loyal buyer'],
    ]);
    expect(d.groups).toHaveLength(1);
    expect(d.groups[0]).toMatchObject({ id: 'shop', title: 'Online shop', memberIds: ['Browse', 'Buy'] });
    expect(d.edges).toHaveLength(4);
    expect(d.edges[0]).toMatchObject({ from: 'Customer', to: 'Browse', kind: 'open', variant: '-->', markers: { start: 'none', end: 'arrow' } });
    expect(d.edges[2]).toMatchObject({ from: 'Buy', to: 'Browse', kind: 'dotted', label: '«extend»', variant: '..>', markers: { start: 'none', end: 'openArrow' } });
    expect(d.edges[3]).toMatchObject({ from: 'note_Customer', to: 'Customer', kind: 'dotted' });
  });

  it('reports an unclosed boundary', () => {
    expect(parseUsecase('usecase-beta\n  systemBoundary s\n    A').diagnostics).toContainEqual({
      line: 2,
      severity: 'error',
      message: MESSAGES.unclosedBlock('systemBoundary'),
    });
  });
});
