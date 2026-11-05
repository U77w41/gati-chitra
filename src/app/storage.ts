import { ANIM, STORAGE, UI } from '../core/constants';
import type {
  AnimSettings,
  BackgroundChoice,
  CardStyleMode,
  NodeShadeMode,
  ThemeChoice,
} from '../core/types';
import { DEFAULT_ANIM } from '../anim/anim';
import { BACKGROUND_CHOICES, THEME_CHOICES } from '../render/themes';
import { clampSplit } from './splitter';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface Settings {
  theme: ThemeChoice;
  anim: AnimSettings;
  split: number;
  bgTheme?: BackgroundChoice;
  bgLocked?: boolean;
  nodeShading?: NodeShadeMode;
  cardMode?: CardStyleMode;
  grid?: boolean;
  wordWrap?: boolean;
}

export function safeStore(): KeyValueStore | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const probe = '__storage_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadDoc(store: KeyValueStore | null): string | null {
  if (!store) return null;
  try {
    return store.getItem(STORAGE.docKey);
  } catch {
    return null;
  }
}

export function saveDoc(store: KeyValueStore | null, text: string): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE.docKey, text);
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(store: KeyValueStore | null): Settings {
  const defaults: Settings = {
    theme: 'auto',
    anim: { ...DEFAULT_ANIM },
    split: UI.splitDefault,
    bgTheme: 'match',
    bgLocked: false,
    nodeShading: 'shape',
    cardMode: 'classic',
    grid: false,
    wordWrap: false,
  };

  if (!store) return defaults;

  try {
    const raw = store.getItem(STORAGE.settingsKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);

    const theme: ThemeChoice = THEME_CHOICES.includes(parsed?.theme)
      ? parsed.theme
      : defaults.theme;

    const animRaw = parsed?.anim;
    const styleValid = ['pulse', 'traffic', 'dash', 'build', 'typewriter', 'off'].includes(
      animRaw?.style,
    );
    const style = styleValid ? animRaw.style : defaults.anim.style;

    const speed =
      typeof animRaw?.speed === 'number' && !isNaN(animRaw.speed)
        ? Math.max(ANIM.speedMin, Math.min(ANIM.speedMax, animRaw.speed))
        : defaults.anim.speed;

    const density =
      typeof animRaw?.density === 'number' && !isNaN(animRaw.density)
        ? Math.max(ANIM.densityMin, Math.min(ANIM.densityMax, animRaw.density))
        : defaults.anim.density;

    const glow =
      typeof animRaw?.glow === 'boolean' ? animRaw.glow : defaults.anim.glow;

    const split =
      typeof parsed?.split === 'number' && !isNaN(parsed.split)
        ? clampSplit(parsed.split)
        : defaults.split;

    const bgTheme: BackgroundChoice = BACKGROUND_CHOICES.includes(parsed?.bgTheme)
      ? parsed.bgTheme
      : 'match';

    const bgLocked =
      typeof parsed?.bgLocked === 'boolean'
        ? parsed.bgLocked
        : bgTheme !== 'match';

    const nodeShadingValid = ['shape', 'semantic', 'node', 'off'].includes(parsed?.nodeShading);
    const nodeShading: NodeShadeMode = nodeShadingValid
      ? parsed.nodeShading
      : defaults.nodeShading!;

    const cardModeValid = ['classic', 'pipeline', 'workflow'].includes(parsed?.cardMode);
    const cardMode: CardStyleMode = cardModeValid
      ? parsed.cardMode
      : defaults.cardMode!;

    const grid =
      typeof parsed?.grid === 'boolean'
        ? parsed.grid
        : false;

    const wordWrap =
      typeof parsed?.wordWrap === 'boolean'
        ? parsed.wordWrap
        : false;

    return {
      theme,
      anim: { style, speed, density, glow },
      split,
      bgTheme,
      bgLocked,
      nodeShading,
      cardMode,
      grid,
      wordWrap,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(
  store: KeyValueStore | null,
  settings: Settings,
): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE.settingsKey, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

let autosaveFlusher: (() => void) | null = null;

export function registerAutosaveFlush(fn: () => void): void {
  autosaveFlusher = fn;
}

export function flushAutosave(): void {
  autosaveFlusher?.();
}

export interface AutosaveEnv {
  store: KeyValueStore | null;
  getText: () => string;
  onUnavailable: () => void;
  debounceMs?: number;
}

export function setupAutosave(env: AutosaveEnv): {
  schedule: () => void;
  flush: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let unavailableShown = false;

  function flush(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const text = env.getText();
    if (!saveDoc(env.store, text) && !unavailableShown) {
      unavailableShown = true;
      env.onUnavailable();
    }
  }

  registerAutosaveFlush(flush);

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => flushAutosave());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushAutosave();
    });
  }

  function schedule(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, env.debounceMs ?? 800);
  }

  return { schedule, flush };
}

export interface DocSyncEnv {
  store: KeyValueStore | null;
  getText(): string;
  isDirty(): boolean;
  apply(text: string): void;
  ask(text: string): void;
}

export function setupDocSync(env: DocSyncEnv): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE.docKey || e.newValue === null) {
      return;
    }
    const newText = e.newValue;
    if (newText === env.getText()) {
      return;
    }
    if (!env.isDirty()) {
      env.apply(newText);
    } else {
      env.ask(newText);
    }
  };

  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('storage', onStorage);
  };
}
