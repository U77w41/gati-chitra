export type ShortcutAction =
  | 'undo'
  | 'redo'
  | 'fit'
  | 'present'
  | 'togglePause'
  | 'zoomIn'
  | 'zoomOut'
  | 'delete'
  | 'rename'
  | 'escape';

export interface KeyInfo {
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
  targetTag: string;
}

export function shortcutFor(k: KeyInfo): ShortcutAction | null {
  if (k.alt) return null;

  const tag = k.targetTag.toUpperCase();
  const isField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  if (k.key === 'Escape') {
    return 'escape';
  }

  if (isField) {
    return null;
  }

  const keyLower = k.key.toLowerCase();
  const cmd = k.ctrl || k.meta;

  if (cmd) {
    if (keyLower === 'z') {
      return k.shift ? 'redo' : 'undo';
    }
    if (k.ctrl && !k.meta && keyLower === 'y' && !k.shift) {
      return 'redo';
    }
    if (k.key === '0' && !k.shift) {
      return 'fit';
    }
    return null;
  }

  if (k.shift) {
    if (k.key === '+') return 'zoomIn';
    return null;
  }

  if (k.key === '+' || k.key === '=') return 'zoomIn';
  if (k.key === '-') return 'zoomOut';
  if (keyLower === 'p') return 'present';
  if (keyLower === 'k') return 'togglePause';
  if (k.key === 'Delete' || k.key === 'Backspace') return 'delete';
  if (k.key === 'Enter') {
    return tag === 'BODY' || tag === 'MAIN' || tag === 'CANVAS' ? 'rename' : null;
  }

  return null;
}

export interface ShortcutsEnv {
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPresent: () => void;
  onTogglePause: () => void;
  onDelete: () => void;
  onRename: () => void;
  onEscape: () => void;
  isPresenting?: () => boolean;
}

export function setupKeyboardShortcuts(env: ShortcutsEnv): () => void {
  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const info: KeyInfo = {
      key: e.key,
      ctrl: e.ctrlKey,
      meta: e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
      targetTag: target?.tagName ?? '',
    };
    const action = shortcutFor(info);
    if (!action) return;

    if (action !== 'escape' || (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA')) {
      e.preventDefault();
    }

    if (env.isPresenting?.()) {
      if (action === 'escape') {
        env.onEscape();
      } else if (action === 'fit') {
        env.onFit();
      } else if (action === 'zoomIn') {
        env.onZoomIn();
      } else if (action === 'zoomOut') {
        env.onZoomOut();
      } else if (action === 'togglePause') {
        env.onTogglePause();
      }
      return;
    }

    switch (action) {
      case 'undo':
        env.onUndo();
        break;
      case 'redo':
        env.onRedo();
        break;
      case 'fit':
        env.onFit();
        break;
      case 'zoomIn':
        env.onZoomIn();
        break;
      case 'zoomOut':
        env.onZoomOut();
        break;
      case 'present':
        env.onPresent();
        break;
      case 'togglePause':
        env.onTogglePause();
        break;
      case 'delete':
        env.onDelete();
        break;
      case 'rename':
        env.onRename();
        break;
      case 'escape':
        env.onEscape();
        break;
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
