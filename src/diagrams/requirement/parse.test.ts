import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseRequirement } from './parse';

const T = `requirementDiagram
  requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
  }
  element test_entity {
    type: simulation
  }
  test_entity - satisfies -> test_req
  test_req <- copies - other`;

describe('parseRequirement', () => {
  it('reads requirements, elements and their fields', () => {
    const d = parseRequirement(T);
    expect(d).toMatchObject({ kind: 'requirement', ok: true });
    expect(d.nodes.map((n) => n.id)).toEqual(['test_req', 'test_entity', 'other']);
    expect(d.nodes[0].sections).toEqual([
      { rows: [['«Requirement»']], align: 'center', weight: 'italic', divider: false },
      { rows: [['test_req']], align: 'center', weight: 'bold', divider: false },
      { rows: [['ID: 1'], ['Text: the test text.'], ['Risk: high'], ['Verification: test']], align: 'left', weight: 'normal', divider: true },
    ]);
    expect(d.nodes[1].sections![2].rows).toEqual([['Type: simulation']]);
    expect(d.nodes[0].refLines).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('reads both relation directions', () => {
    const e = parseRequirement(T).edges;
    expect(e[0]).toMatchObject({ from: 'test_entity', to: 'test_req', kind: 'dotted', label: '«satisfies»', variant: 'satisfies', markers: { start: 'none', end: 'arrow' } });
    expect(e[1]).toMatchObject({ from: 'other', to: 'test_req', variant: 'copies' });
  });
  it('reports an unclosed block', () => {
    expect(parseRequirement('requirementDiagram\n  requirement r {\n    id: 1').diagnostics).toContainEqual({ line: 2, severity: 'error', message: MESSAGES.unclosedBrace('r') });
  });
});
