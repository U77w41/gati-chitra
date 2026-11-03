import { describe, it, expect } from 'vitest';
import {
  readPref,
  writePref,
  isDark,
  nextPref,
  applyScheme,
  type SchemeDoc,
} from './scheme';
import type { KeyValueStore } from './storage';
import { SCHEME } from '../core/constants';

function mem(value: string | null): KeyValueStore {
  return {
    getItem: (_key: string) => value,
    setItem: (_key: string, _val: string) => {},
    removeItem: (_key: string) => {},
  };
}

const throwing: KeyValueStore = {
  getItem: () => {
    throw new Error('Storage disabled');
  },
  setItem: () => {
    throw new Error('Storage disabled');
  },
  removeItem: () => {
    throw new Error('Storage disabled');
  },
};

describe('scheme', () => {
  describe('readPref', () => {
    it('returns auto for null or invalid or throwing store', () => {
      expect(readPref(null)).toBe('auto');
      expect(readPref(mem('dark'))).toBe('dark');
      expect(readPref(mem('light'))).toBe('light');
      expect(readPref(mem('auto'))).toBe('auto');
      expect(readPref(mem('purple'))).toBe('auto');
      expect(readPref(mem(null))).toBe('auto');
      expect(readPref(throwing)).toBe('auto');
    });
  });

  describe('writePref', () => {
    it('writes to store or returns false if throwing or null', () => {
      expect(writePref(null, 'dark')).toBe(false);
      expect(writePref(throwing, 'dark')).toBe(false);

      let written: [string, string] | null = null;
      const writable: KeyValueStore = {
        getItem: () => null,
        setItem: (k, v) => {
          written = [k, v];
        },
        removeItem: () => {},
      };
      expect(writePref(writable, 'dark')).toBe(true);
      expect(written).toEqual([SCHEME.storageKey, 'dark']);
    });
  });

  describe('isDark', () => {
    it('evaluates darkness based on pref and systemDark', () => {
      expect(isDark('dark', false)).toBe(true);
      expect(isDark('light', true)).toBe(false);
      expect(isDark('auto', true)).toBe(true);
      expect(isDark('auto', false)).toBe(false);
    });
  });

  describe('nextPref', () => {
    it('toggles correctly when system is light', () => {
      expect(nextPref('auto', false)).toBe('dark');
      expect(nextPref('dark', false)).toBe('auto');
      expect(nextPref('light', false)).toBe('dark');
    });

    it('toggles correctly when system is dark', () => {
      expect(nextPref('auto', true)).toBe('light');
      expect(nextPref('light', true)).toBe('auto');
      expect(nextPref('dark', true)).toBe('light');
    });
  });

  describe('applyScheme', () => {
    it('applies dark scheme and updates theme-color meta tag', () => {
      const attrs = new Map<string, string>();
      const metaAttrs = new Map<string, string>();

      const fakeDoc: SchemeDoc = {
        documentElement: {
          setAttribute: (name, val) => {
            attrs.set(name, val);
          },
        },
        querySelector: (sel) => {
          if (sel === 'meta[name="theme-color"]:not([media])') {
            return {
              setAttribute: (name, val) => {
                metaAttrs.set(name, val);
              },
            };
          }
          return null;
        },
      };

      const result = applyScheme('dark', false, fakeDoc);
      expect(result).toBe('dark');
      expect(attrs.get('data-scheme')).toBe('dark');
      expect(metaAttrs.get('content')).toBe(SCHEME.darkThemeColor);
    });

    it('applies auto light scheme and updates theme-color meta tag', () => {
      const attrs = new Map<string, string>();
      const metaAttrs = new Map<string, string>();

      const fakeDoc: SchemeDoc = {
        documentElement: {
          setAttribute: (name, val) => {
            attrs.set(name, val);
          },
        },
        querySelector: (sel) => {
          if (sel === 'meta[name="theme-color"]:not([media])') {
            return {
              setAttribute: (name, val) => {
                metaAttrs.set(name, val);
              },
            };
          }
          return null;
        },
      };

      const result = applyScheme('auto', false, fakeDoc);
      expect(result).toBe('light');
      expect(attrs.get('data-scheme')).toBe('light');
      expect(metaAttrs.get('content')).toBe(SCHEME.lightThemeColor);
    });

    it('applies light scheme with no meta element without error', () => {
      const attrs = new Map<string, string>();
      const fakeDoc: SchemeDoc = {
        documentElement: {
          setAttribute: (name, val) => {
            attrs.set(name, val);
          },
        },
        querySelector: () => null,
      };

      const result = applyScheme('light', true, fakeDoc);
      expect(result).toBe('light');
      expect(attrs.get('data-scheme')).toBe('light');
    });
  });
});
