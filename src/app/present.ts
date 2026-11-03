import { ANIM, MESSAGES } from '../core/constants';
import { showMessage } from './message';
import { requestRedraw } from './render-loop';
import type { Focus } from '../core/types';
import { buildSteps, focusAt, type Step } from '../anim/steps';
import type { AppState } from './state';

export interface PresentEnv {
  btnPresent: HTMLButtonElement;
  canvasPanel: HTMLElement;
  presentStepEl: HTMLElement;
  messageEl: HTMLElement;
  getState: () => AppState;
  triggerFit: () => void;
}

export interface PresentController {
  start: () => void;
  exit: () => void;
  getPresentStep: () => number | null;
  getCurrentFocus: () => Focus | null;
  isPresenting: () => boolean;
}

export function setupPresentMode(env: PresentEnv): PresentController {
  const {
    btnPresent,
    canvasPanel,
    presentStepEl,
    getState,
    triggerFit,
  } = env;

  btnPresent.disabled = false;

  let currentIndex: number | null = null;
  let steps: Step[] = [];
  let currentFocus: Focus | null = null;
  let autoTimer: ReturnType<typeof setInterval> | null = null;
  let inFullscreen = false;

  function stopTimer(): void {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function startTimer(): void {
    stopTimer();
    autoTimer = setInterval(() => {
      if (currentIndex !== null && currentIndex < steps.length - 1) {
        goToStep(currentIndex + 1);
        if (currentIndex === steps.length - 1) {
          stopTimer();
        }
      } else {
        stopTimer();
      }
    }, ANIM.presentStepSeconds * 1000);
  }

  function goToStep(idx: number): void {
    if (currentIndex === null || steps.length === 0) return;
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    currentIndex = clamped;
    currentFocus = focusAt(steps, currentIndex);
    presentStepEl.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
    requestRedraw();
  }

  function start(): void {
    const state = getState();
    if (!state.scene || state.doc.nodes.length === 0) {
      showMessage(MESSAGES.nothingToPresent);
      return;
    }

    steps = buildSteps(state.doc);
    if (steps.length === 0) {
      showMessage(MESSAGES.nothingToPresent);
      return;
    }

    showMessage('');
    currentIndex = 0;
    currentFocus = focusAt(steps, 0);

    document.body.classList.add('presenting');
    presentStepEl.textContent = `Step 1 of ${steps.length}`;
    presentStepEl.hidden = false;

    try {
      canvasPanel
        .requestFullscreen()
        .then(() => {
          inFullscreen = true;
        })
        .catch(() => {
          inFullscreen = false;
        });
    } catch {
      inFullscreen = false;
    }

    triggerFit();
    startTimer();
    requestRedraw();
  }

  function exit(): void {
    if (currentIndex === null) return;
    stopTimer();
    currentIndex = null;
    steps = [];
    currentFocus = null;

    document.body.classList.remove('presenting');
    presentStepEl.hidden = true;

    if (document.fullscreenElement) {
      try {
        document.exitFullscreen().catch(() => {});
      } catch {}
    }
    inFullscreen = false;

    triggerFit();
    requestRedraw();
  }

  function toggleAutoAdvance(): void {
    if (currentIndex === null) return;
    if (currentIndex >= steps.length - 1) {
      goToStep(0);
      startTimer();
    } else if (autoTimer) {
      stopTimer();
    } else {
      startTimer();
    }
  }

  btnPresent.addEventListener('click', () => {
    if (currentIndex === null) start();
    else exit();
  });

  window.addEventListener('keydown', (e) => {
    if (currentIndex === null) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      exit();
      return;
    }

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      toggleAutoAdvance();
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (currentIndex < steps.length - 1) goToStep(currentIndex + 1);
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentIndex > 0) goToStep(currentIndex - 1);
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      goToStep(0);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      goToStep(steps.length - 1);
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      triggerFit();
      return;
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (currentIndex !== null && inFullscreen && !document.fullscreenElement) {
      exit();
    }
  });

  return {
    start,
    exit,
    getPresentStep: () => currentIndex,
    getCurrentFocus: () => currentFocus,
    isPresenting: () => currentIndex !== null,
  };
}
