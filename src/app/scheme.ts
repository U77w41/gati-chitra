import { SCHEME } from '../core/constants';
import type { SchemePref } from '../core/types';
import type { KeyValueStore } from './storage';

export interface SchemeDoc {
  documentElement: {
    setAttribute(name: string, value: string): void;
    classList?: { add(cls: string): void };
  };
  querySelector(selector: string): { setAttribute(name: string, value: string): void } | null;
}

export function readPref(store: KeyValueStore | null): SchemePref {
  if (!store) return 'auto';
  try {
    const val = store.getItem(SCHEME.storageKey);
    if (val === 'light' || val === 'dark' || val === 'auto') {
      return val;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

export function writePref(store: KeyValueStore | null, pref: SchemePref): boolean {
  if (!store) return false;
  try {
    store.setItem(SCHEME.storageKey, pref);
    return true;
  } catch {
    return false;
  }
}

export function isDark(pref: SchemePref, systemDark: boolean): boolean {
  return pref === 'dark' || (pref === 'auto' && systemDark);
}

export function nextPref(current: SchemePref, systemDark: boolean): SchemePref {
  const target = isDark(current, systemDark) ? 'light' : 'dark';
  const systemScheme = systemDark ? 'dark' : 'light';
  return target === systemScheme ? 'auto' : target;
}

export function applyScheme(
  pref: SchemePref,
  systemDark: boolean,
  doc: SchemeDoc,
): 'light' | 'dark' {
  const dark = isDark(pref, systemDark);
  const scheme = dark ? 'dark' : 'light';
  doc.documentElement.setAttribute('data-scheme', scheme);

  const meta = doc.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) {
    meta.setAttribute('content', dark ? SCHEME.darkThemeColor : SCHEME.lightThemeColor);
  }
  return scheme;
}

export function startSchemeWatcher(
  store: KeyValueStore | null,
  onChange: (scheme: 'light' | 'dark') => void,
): () => void {
  const mediaQuery =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  const getSysDark = () => mediaQuery?.matches ?? false;

  if (typeof document !== 'undefined') {
    const initScheme = applyScheme(readPref(store), getSysDark(), document);
    onChange(initScheme);
  }

  const mediaHandler = () => {
    if (typeof document !== 'undefined' && readPref(store) === 'auto') {
      const s = applyScheme('auto', getSysDark(), document);
      onChange(s);
    }
  };

  const storageHandler = (e: StorageEvent) => {
    if (e.key === SCHEME.storageKey && typeof document !== 'undefined') {
      const s = applyScheme(readPref(store), getSysDark(), document);
      onChange(s);
    }
  };

  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener('change', mediaHandler);
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', storageHandler);
  }

  if (typeof window !== 'undefined' && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement?.classList?.add('theme-ready');
      });
    });
  }

  return () => {
    if (mediaQuery?.removeEventListener) {
      mediaQuery.removeEventListener('change', mediaHandler);
    }
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('storage', storageHandler);
    }
  };
}
