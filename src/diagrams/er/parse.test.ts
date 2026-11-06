import { describe, expect, it } from 'vitest';
import { parseEr } from './parse';

const T = `erDiagram
  CUSTOMER ||--o{ ORDER : places
  CUSTOMER {
    string name PK
    int id
  }
  ORDER }|..|{ LINE-ITEM : "contains"
  p[Person] only one to zero or more CUSTOMER : knows`;

describe('parseEr', () => {
  it('reads entities, attributes and aliases', () => {
    const d = parseEr(T);
    expect(d).toMatchObject({ kind: 'er', ok: true });
    expect(d.nodes.map((n) => [n.id, n.label])).toEqual([
      ['CUSTOMER', 'CUSTOMER'],
      ['ORDER', 'ORDER'],
      ['LINE-ITEM', 'LINE-ITEM'],
      ['p', 'Person'],
    ]);
    expect(d.nodes[0].sections![1].rows).toEqual([
      ['string', 'name', 'PK', ''],
      ['int', 'id', '', ''],
    ]);
    expect(d.nodes[1].sections).toBeUndefined();
  });

  it('reads symbol and word relationships', () => {
    const e = parseEr(T).edges;
    expect(e[0]).toMatchObject({
      from: 'CUSTOMER',
      to: 'ORDER',
      kind: 'open',
      label: 'places',
      variant: '||--o{',
      markers: { start: 'erOne', end: 'erZeroOrMore' },
    });
    expect(e[1]).toMatchObject({
      kind: 'dotted',
      label: 'contains',
      variant: '}|..|{',
      markers: { start: 'erOneOrMore', end: 'erOneOrMore' },
    });
    expect(e[2]).toMatchObject({
      from: 'p',
      to: 'CUSTOMER',
      kind: 'open',
      variant: '||--o{',
      markers: { start: 'erOne', end: 'erZeroOrMore' },
    });
  });

  it('reports unclosed entity block', () => {
    const d = parseEr('erDiagram\n  A {\n');
    expect(d.ok).toBe(false);
    expect(d.diagnostics[0].message).toContain('is not closed with }');
  });
});
