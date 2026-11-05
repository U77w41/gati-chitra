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
      split: 0.33,
      bgTheme: 'match',
      bgLocked: false,
      nodeShading: 'shape',
      cardMode: 'classic',
      grid: false,
      wordWrap: false,
    });

    const badJsonStore = createMemoryStore({ 'gati-chitra:v1:settings': '{bad json' });
    expect(loadSettings(badJsonStore)).toEqual({
      theme: 'auto',
      anim: DEFAULT_ANIM,
      split: 0.33,
      bgTheme: 'match',
      bgLocked: false,
      nodeShading: 'shape',
      cardMode: 'classic',
      grid: false,
      wordWrap: false,
    });

    const invalidFieldsStore = createMemoryStore({
      'gati-chitra:v1:settings': JSON.stringify({
        theme: 'nope',
        anim: { style: 'dash', speed: 99, density: 0, glow: true },
        bgTheme: 'invalid-bg',
        bgLocked: 'not-a-bool',
        nodeShading: 'invalid-shade',
        cardMode: 'invalid-card',
        grid: 'yes',
        wordWrap: 123,
      }),
    });
    expect(loadSettings(invalidFieldsStore)).toEqual({
      theme: 'auto',
      anim: { style: 'dash', speed: 3, density: 1, glow: true },
      split: 0.33,
      bgTheme: 'match',
      bgLocked: false,
      nodeShading: 'shape',
      cardMode: 'classic',
      grid: false,
      wordWrap: false,
    });

    const validStore = createMemoryStore({
      'gati-chitra:v1:settings': JSON.stringify({
        theme: 'lagoon',
        anim: { style: 'typewriter', speed: 1, density: 4, glow: false },
        bgTheme: 'flexoki',
        bgLocked: true,
        nodeShading: 'semantic',
        cardMode: 'pipeline',
        grid: true,
        wordWrap: true,
      }),
    });
    const loaded = loadSettings(validStore);
    expect(loaded.theme).toBe('lagoon');
    expect(loaded.anim.style).toBe('typewriter');
    expect(loaded.bgTheme).toBe('flexoki');
    expect(loaded.bgLocked).toBe(true);
    expect(loaded.nodeShading).toBe('semantic');
    expect(loaded.cardMode).toBe('pipeline');
    expect(loaded.grid).toBe(true);
    expect(loaded.wordWrap).toBe(true);
    expect(saveSettings(throwingStore, loaded)).toBe(false);
  });

  it('infers bgLocked when bgTheme is set but bgLocked is omitted', () => {
    const customBgStore = createMemoryStore({
      'gati-chitra:v1:settings': JSON.stringify({
        bgTheme: 'obsidian',
      }),
    });
    expect(loadSettings(customBgStore).bgLocked).toBe(true);

    const matchBgStore = createMemoryStore({
      'gati-chitra:v1:settings': JSON.stringify({
        bgTheme: 'match',
      }),
    });
    expect(loadSettings(matchBgStore).bgLocked).toBe(false);
  });

  it('loads the split from settings', () => {
    const store = (obj: Record<string, unknown>) =>
      createMemoryStore({ 'gati-chitra:v1:settings': JSON.stringify(obj) });
    expect(loadSettings(store({ split: 3 })).split).toBe(0.8);
    expect(loadSettings(store({})).split).toBe(0.33);
  });
});
