import { expect, it } from 'vitest';
import type { Decoration, GraphEdge, GraphNode, ParsedDoc } from './types';

it('accepts the optional diagram fields', () => {
  const n: Partial<GraphNode> = { sections: [{ rows: [['a']], align: 'left', weight: 'normal', divider: true }], icon: 'server', size: { width: 1, height: 2 }, colorIndex: 3, labelSpan: { line: 0, from: 1, to: 2 } };
  const e: Partial<GraphEdge> = { markers: { start: 'triangle', end: 'erZeroOrMore' }, endLabels: { from: '1' }, variant: '<|--' };
  const d: Decoration = { kind: 'text', role: 'caption', at: { x: 0, y: 0 }, text: 't', align: 'center', bold: false };
  const p: Partial<ParsedDoc> = { kind: 'sequence', stages: { nodes: {}, edges: {} }, pending: true };
  expect([n, e, d, p].length).toBe(4);
});
