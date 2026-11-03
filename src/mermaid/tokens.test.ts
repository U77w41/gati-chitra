import { describe, expect, it } from 'vitest';
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
});
