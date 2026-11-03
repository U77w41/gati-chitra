import { describe, expect, it } from 'vitest';
import { minimalChange } from './text-diff';

describe('minimalChange', () => {
  it('finds the smallest change', () => {
    expect(minimalChange('abc', 'abc')).toBeNull();
    expect(minimalChange('abc', 'abXc')).toEqual({ from: 2, to: 2, insert: 'X' });
    expect(minimalChange('flowchart TD\nA', 'flowchart TD\nB')).toEqual({ from: 13, to: 14, insert: 'B' });
    expect(minimalChange('aaa', 'aa')).toEqual({ from: 2, to: 3, insert: '' });
  });

  it('never splits a surrogate pair', () => {
    expect(minimalChange('a😀b', 'a😃b')).toEqual({ from: 1, to: 3, insert: '😃' });
  });
});
