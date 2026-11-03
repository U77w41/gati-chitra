import { describe, expect, it } from 'vitest';
import { hash32 } from './hash';

describe('hash32', () => {
  it('computes FNV-1a 32-bit unsigned hashes', () => {
    expect(hash32('')).toBe(2166136261);
    expect(hash32('a')).toBe(3826002220);
    expect(hash32('foobar')).toBe(3214735720);
  });
});
