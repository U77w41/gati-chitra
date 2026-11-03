export interface ShortcutsEnv {
  triggerFit: () => void;
  doUndo: () => void;
  doRedo: () => void;
  dispatch: (event: { type: 'keyDown'; key: string }) => void;
}

export function setupKeyboardShortcuts(env: ShortcutsEnv): () => void {
  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isField =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT';

    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      env.triggerFit();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (!isField) {
        e.preventDefault();
        if (e.shiftKey) env.doRedo();
        else env.doUndo();
        return;
      }
    }
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === 'y' &&
      !e.shiftKey
    ) {
      if (!isField) {
        e.preventDefault();
        env.doRedo();
        return;
      }
    }
    if (!isField || e.key === 'Escape') {
      env.dispatch({ type: 'keyDown', key: e.key });
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
