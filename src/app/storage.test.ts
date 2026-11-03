import { describe, expect, it } from 'vitest';
import {
  loadDoc,
  loadSettings,
  saveDoc,
  saveSettings,
  type KeyValueStore,
} from './storage';
import { DEFAULT_ANIM } from '../anim/anim';

function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

const throwingStore: KeyValueStore = {
  getItem: () => {
    throw new Error('QuotaExceeded');
  },
  setItem: () => {
    throw new Error('QuotaExceeded');
  },
};

describe('storage', () => {
  it('saves and loads doc to and from key-value store', () => {
    const mem = createMemoryStore();
    expect(saveDoc(mem, 'x')).toBe(true);
    expect(loadDoc(mem)).toBe('x');

    const mem2 = createMemoryStore();
    expect(loadDoc(mem2)).toBeNull();
  });

  it('handles null and throwing stores safely (Review Focus 5)', () => {
    expect(loadDoc(throwingStore)).toBeNull();
    expect(saveDoc(throwingStore, 'x')).toBe(false);
    expect(saveDoc(null, 'x')).toBe(false);
    expect(loadDoc(null)).toBeNull();
  });

  it('loads and validates settings with fallback defaults', () => {
    const emptyStore = createMemoryStore();
    expect(loadSettings(emptyStore)).toEqual({
      theme: 'auto',
      anim: DEFAULT_ANIM,
    });

    const badJsonStore = createMemoryStore({ 'gati-chitra:v1:settings': '{bad json' });
    expect(loadSettings(badJsonStore)).toEqual({
      theme: 'auto',
      anim: DEFAULT_ANIM,
    });

    const invalidFieldsStore = createMemoryStore({
      'gati-chitra:v1:settings': JSON.stringify({
        theme: 'nope',
        anim: { style: 'dash', speed: 99, density: 0, glow: true },
      }),
    });
    expect(loadSettings(invalidFieldsStore)).toEqual({
      theme: 'auto',
      anim: { style: 'dash', speed: 3, density: 1, glow: true },
    });

    const validStore = createMemoryStore({
      'gati-chitra:v1:settings': JSON.stringify({
        theme: 'lagoon',
        anim: { style: 'pulse', speed: 1, density: 4, glow: false },
      }),
    });
    expect(loadSettings(validStore).theme).toBe('lagoon');
    expect(saveSettings(throwingStore, loadSettings(validStore))).toBe(false);
  });
});
