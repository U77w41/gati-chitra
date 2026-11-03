import { describe, expect, it } from 'vitest';
import { CORPUS } from '../../tests/support/corpus';
import { parseMermaid } from './parse';

describe('styles parsing', () => {
  it('parses classDef, class, style and linkStyle', () => {
    const d = parseMermaid(CORPUS[2].text);
    expect(d.classDefs.hot).toEqual({ fill: '#ffe4e1', stroke: '#c0392b', 'stroke-width': '2px' });
    expect(d.nodes.find(n => n.id === 'A')).toMatchObject({
      classNames: ['hot'],
      style: { fill: '#ffe4e1', stroke: '#c0392b', 'stroke-width': '2px' },
    });
    expect(d.nodes.find(n => n.id === 'C')!.style).toEqual({ fill: '#e8f8f5' });
    expect(d.edges[0].style).toEqual({ stroke: '#c0392b', 'stroke-width': '3px' });
    expect(d.edges[1].kind).toBe('dottedArrow');
    expect(parseMermaid('flowchart TD\nclass Z hot\nA').nodes.map(n => n.id)).toEqual(['A']);
    const ls = parseMermaid('flowchart TD\nA-->B\nB-->C\nlinkStyle default stroke:#0f0\nlinkStyle 1 stroke:#f00');
    expect(ls.edges.map(e => e.style)).toEqual([{ stroke: '#0f0' }, { stroke: '#f00' }]);
    expect(parseMermaid('flowchart TD\nA\nclass A hot\nclassDef hot fill:#f00').nodes[0].style).toEqual({ fill: '#f00' });
  });

  it('applies classDef default before other classes', () => {
    const d = parseMermaid('flowchart LR\nclassDef default fill:#eee\nclassDef hot fill:#f00\nA\nB:::hot');
    expect(d.nodes.map(n => n.style.fill)).toEqual(['#eee', '#f00']);
  });
});
