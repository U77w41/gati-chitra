import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from './parse';
import { cleanLabel, readNodeRef } from './tokens';

const r = (s: string) => readNodeRef(s, 0);

describe('tokens', () => {
  it('reads node refs and cleans labels', () => {
    expect(r('A')).toEqual({ ref: { id: 'A', label: null, shape: null, className: null }, end: 1 });
    expect(r('A[Start]')).toEqual({ ref: { id: 'A', label: 'Start', shape: 'rect', className: null }, end: 8 });
    expect(r('B(Round)')!.ref).toMatchObject({ shape: 'round', label: 'Round' });
    expect(r('C([Pill])')!.ref).toMatchObject({ shape: 'stadium', label: 'Pill' });
    expect(r('D((Dot))')!.ref).toMatchObject({ shape: 'circle', label: 'Dot' });
    expect(r('E{Choice}')!.ref).toMatchObject({ shape: 'diamond', label: 'Choice' });
    expect(r('F{{Hex}}')!.ref).toMatchObject({ shape: 'hexagon', label: 'Hex' });
    expect(r('G[/Slant/]')!.ref).toMatchObject({ shape: 'parallelogram', label: 'Slant' });
    expect(r('H[\\Back\\]')!.ref).toMatchObject({ shape: 'parallelogramAlt', label: 'Back' }); // text is H[\Back\]
    expect(r('I[(Store)]')!.ref).toMatchObject({ shape: 'cylinder', label: 'Store' });
    expect(r('J[[Sub]]')!.ref).toMatchObject({ shape: 'subroutine', label: 'Sub' });
    expect(r('K["a (b) [c]"]')!.ref).toMatchObject({ shape: 'rect', label: 'a (b) [c]' });
    expect(r('L[Line<br/>two]')!.ref.label).toBe('Line\ntwo');
    expect(r('M[]')!.ref).toMatchObject({ shape: 'rect', label: null });
    expect(r('N:::hot')).toMatchObject({ ref: { id: 'N', className: 'hot' }, end: 7 });
    expect(r('O[Hi]:::hot')!.ref).toMatchObject({ label: 'Hi', className: 'hot' });
    expect(r('[x]')).toBeNull();
    expect(r('P[unclosed')).toBeNull();
    expect(readNodeRef('x A', 2)).toMatchObject({ ref: { id: 'A' }, end: 3 });
    expect(cleanLabel('  hi  ')).toBe('hi');
    expect(cleanLabel('a<BR>b')).toBe('a\nb');
    expect(cleanLabel('say #quot;x#quot;')).toBe('say "x"');
    expect(cleanLabel('a'.repeat(300)).length).toBe(200);
  });

  it.each([
    ['A[/x\\]', 'trapezoid'], ['A[\\x/]', 'trapezoidAlt'], ['A(((x)))', 'doubleCircle'], ['A>x]', 'asymmetric'],
    ['A[/x/]', 'parallelogram'], ['A[\\x\\]', 'parallelogramAlt'], ['A((x))', 'circle'],
  ])('%s is %s', (ref, shape) => {
    const n = parseMermaid(`flowchart TD\n${ref}`).nodes[0];
    expect(n).toMatchObject({ shape, label: 'x' });
  });

  it('reads @{ } shapes and labels', () => {
    const d = parseMermaid('flowchart TD\nA@{ shape: doc, label: "Report" }');
    expect(d.nodes[0]).toMatchObject({ shape: 'document', label: 'Report' });
    expect(d.diagnostics).toEqual([]);
  });

  it('notes approximate shapes', () => {
    const d = parseMermaid('flowchart TD\nA@{ shape: cloud }');
    expect(d.nodes[0].shape).toBe('round');
    expect(d.diagnostics).toEqual([{ line: 2, severity: 'info', message: MESSAGES.shapeApprox('cloud', 'Rounded') }]);
    expect(d.ok).toBe(true);
  });

  it('warns on unknown shapes', () => {
    const d = parseMermaid('flowchart TD\nA@{ shape: banana }');
    expect(d.nodes[0].shape).toBe('rect');
    expect(d.diagnostics[0]).toMatchObject({ severity: 'warning', message: MESSAGES.unknownShape('banana') });
  });

  it('draws icon nodes as rectangles with a note', () => {
    const d = parseMermaid('flowchart TD\nA@{ icon: "fa:user", label: "U" }');
    expect(d.nodes[0]).toMatchObject({ shape: 'rect', label: 'U' });
    expect(d.diagnostics[0]).toMatchObject({ severity: 'info', message: MESSAGES.iconUnsupported });
  });

  it('reads @{ } inside edges', () => {
    const d = parseMermaid('flowchart TD\nA@{ shape: diam } --> B');
    expect(d.nodes[0].shape).toBe('diamond');
    expect(d.edges).toHaveLength(1);
  });

  it('decodes entity codes', () => {
    expect(parseMermaid('flowchart TD\nA["#9829; #35; #amp; #lt;"]').nodes[0].label).toBe('♥ # & <');
  });

  it('marks markdown labels', () => {
    expect(parseMermaid('flowchart TD\nA["`**Bold** text`"]').nodes[0]).toMatchObject({ label: '**Bold** text', markdown: true });
    expect(parseMermaid('flowchart TD\nA -->|"`*x*`"| B').edges[0]).toMatchObject({ label: '*x*', markdown: true });
  });
});
