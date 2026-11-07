import { STORAGE } from '../core/constants';

// The animation and theme controls can be hidden to give the diagram their space, like the
// collapsible panels on mermaid.live. The choice is a per-browser convenience, so a storage
// failure only means it is not remembered.

export interface DockToggleEnv {
  button: { setAttribute(name: string, value: string): void; addEventListener(type: 'click', fn: () => void): void };
  body: { hidden: HTMLElement['hidden'] };
  storage: { getItem(key: string): string | null; setItem(key: string, value: string): void } | null;
}

export function setupDockToggle(env: DockToggleEnv): void {
  const read = (): string | null => {
    try { return env.storage?.getItem(STORAGE.dockKey) ?? null; } catch { return null; }
  };
  const apply = (open: boolean): void => {
    env.body.hidden = !open;
    env.button.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  apply(read() !== 'hidden');
  env.button.addEventListener('click', () => {
    const open = Boolean(env.body.hidden);
    apply(open);
    try { env.storage?.setItem(STORAGE.dockKey, open ? 'open' : 'hidden'); } catch { /* not remembered */ }
  });
}

export function setupDock(): void {
  if (typeof document === 'undefined') return;
  const button = document.getElementById('dock-toggle');
  const body = document.getElementById('dock-body');
  if (!button || !body) return;
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { storage = null; }
  setupDockToggle({ button, body, storage });
}
