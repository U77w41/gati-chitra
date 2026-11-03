import { UI } from '../core/constants';

export function clampSplit(x: number): number {
  return Math.max(UI.splitMin, Math.min(UI.splitMax, x));
}

export function setupSplitter(env: {
  handle: HTMLElement;
  workspace: HTMLElement;
  get(): number;
  set(v: number): void;
}): () => void {
  const { handle, workspace, get, set } = env;

  function apply(val: number): void {
    const clamped = clampSplit(val);
    set(clamped);
    const pct = Math.round(clamped * 100);
    handle.setAttribute('aria-valuenow', String(pct));
    workspace.style.setProperty('--split', `${clamped * 100}%`);
  }

  apply(get());

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      apply(get() - UI.splitStep);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      apply(get() + UI.splitStep);
    } else if (e.key === 'Home') {
      e.preventDefault();
      apply(UI.splitMin);
    } else if (e.key === 'End') {
      e.preventDefault();
      apply(UI.splitMax);
    }
  }

  function onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    if (handle.setPointerCapture) {
      try {
        handle.setPointerCapture(e.pointerId);
      } catch {
        // Ignored in headless/test environments
      }
    }

    function onPointerMove(moveEvent: PointerEvent): void {
      const rect = workspace.getBoundingClientRect();
      if (rect.width > 0) {
        const ratio = (moveEvent.clientX - rect.left) / rect.width;
        apply(ratio);
      }
    }

    function onPointerUp(upEvent: PointerEvent): void {
      if (handle.releasePointerCapture) {
        try {
          handle.releasePointerCapture(upEvent.pointerId);
        } catch {
          // Ignored
        }
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  handle.addEventListener('keydown', onKeyDown);
  handle.addEventListener('pointerdown', onPointerDown);

  return () => {
    handle.removeEventListener('keydown', onKeyDown);
    handle.removeEventListener('pointerdown', onPointerDown);
  };
}
