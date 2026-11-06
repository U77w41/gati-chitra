import { describe, expect, it } from 'vitest';
import { parseClass } from './parse';
const T = `classDiagram
  direction LR
  class Animal {
    <<interface>>
    +int age
    +eat() void
  }
  class Duck["Mallard duck"]
  Animal <|-- Duck : extends
  Duck "1" --> "*" Egg
  Duck : +swim()
  note for Duck "can fly"
  foo--bar
  List~int~ ..|> Animal`;
describe('parseClass', () => {
  it('reads classes, members, annotations and labels', () => {
    const d = parseClass(T);
    expect(d).toMatchObject({ kind: 'class', ok: true, direction: 'LR' });
    expect(d.nodes.map((n) => n.id)).toEqual(['Animal', 'Duck', 'Egg', 'note1', 'foo', 'bar', 'List']);
    expect(d.nodes[0].sections).toEqual([
      { rows: [['«interface»']], align: 'center', weight: 'italic', divider: false },
      { rows: [['Animal']], align: 'center', weight: 'bold', divider: false },
      { rows: [['+int age']], align: 'left', weight: 'normal', divider: true },
      { rows: [['+eat() void']], align: 'left', weight: 'normal', divider: true },
    ]);
    const duck = d.nodes[1];
    expect(duck.label).toBe('Mallard duck');
    expect(T.split('\n')[duck.labelSpan!.line].slice(duck.labelSpan!.from, duck.labelSpan!.to)).toBe('Mallard duck');
    expect(duck.sections!.at(-1)).toEqual({ rows: [['+swim()']], align: 'left', weight: 'normal', divider: true });
    expect(d.nodes[6].label).toBe('List<int>');
  });
  it('reads relations, markers, cardinalities and notes', () => {
    const e = parseClass(T).edges;
    expect(e[0]).toMatchObject({ from: 'Animal', to: 'Duck', kind: 'open', label: 'extends', variant: '<|--', markers: { start: 'triangle', end: 'none' } });
    expect(e[1]).toMatchObject({ from: 'Duck', to: 'Egg', variant: '-->', endLabels: { from: '1', to: '*' }, markers: { start: 'none', end: 'openArrow' } });
    expect(e[2]).toMatchObject({ from: 'note1', to: 'Duck', kind: 'dotted', variant: 'note' });
    expect(e[3]).toMatchObject({ from: 'foo', to: 'bar', variant: '--', markers: { start: 'none', end: 'none' } });
    expect(e[4]).toMatchObject({ from: 'List', to: 'Animal', kind: 'dotted', variant: '..|>', markers: { start: 'none', end: 'triangle' } });
  });
  it('reads namespaces as groups and styles', () => {
    const d = parseClass('classDiagram\n  namespace Shapes {\n    class Square\n  }\n  style Square fill:#f00\n  classDef hot stroke:#0f0\n  class Square:::hot');
    expect(d.groups.map((g) => g.id)).toEqual(['Shapes']);
    expect(d.nodes[0]).toMatchObject({ id: 'Square', group: 'Shapes', style: { fill: '#f00', stroke: '#0f0' } });
  });
});
