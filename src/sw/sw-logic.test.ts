import { describe, expect, it } from 'vitest';
import { cacheName, precacheUrls, strategyFor } from './sw-logic';

describe('sw-logic', () => {
  it('names caches', () => {
    expect(cacheName('abc')).toBe('gati-chitra-abc');
  });

  it('lists precache URLs', () => {
    expect(
      precacheUrls(
        ['index.html', 'assets/a.js', 'sw.js', 'assets/a.js.map'],
        '/gati-chitra/',
      ),
    ).toEqual([
      '/gati-chitra/',
      '/gati-chitra/index.html',
      '/gati-chitra/assets/a.js',
    ]);
  });

  it('chooses a strategy', () => {
    const scope = new URL('https://u.github.io/gati-chitra/');
    expect(
      strategyFor(new URL('https://u.github.io/gati-chitra/'), scope),
    ).toBe('network-first');
    expect(
      strategyFor(new URL('https://u.github.io/gati-chitra/assets/a-1.js'), scope),
    ).toBe('cache-first');
    expect(
      strategyFor(new URL('https://u.github.io/other/'), scope),
    ).toBe('bypass');
    expect(
      strategyFor(new URL('https://cdn.example/x.js'), scope),
    ).toBe('bypass');
  });
});
