import type { AnimStyle, ThemeChoice } from '../core/types';
import { THEMES } from '../render/themes';
import type { AppState } from './state';
import { saveSettings, type KeyValueStore } from './storage';

export interface AnimControlElements {
  animStyleEl: HTMLSelectElement;
  animSpeedEl: HTMLInputElement;
  animDensityEl: HTMLInputElement;
  animGlowEl: HTMLInputElement;
  animPauseEl: HTMLButtonElement;
  themeEl: HTMLSelectElement;
}

export interface AnimControlsManager {
  togglePause: () => void;
}

export function setupAnimControls(
  els: AnimControlElements,
  getState: () => AppState,
  store: KeyValueStore | null,
  onPauseToggle: (paused: boolean) => void,
): AnimControlsManager {
  const {
    animStyleEl,
    animSpeedEl,
    animDensityEl,
    animGlowEl,
    animPauseEl,
    themeEl,
  } = els;
  const state = getState();

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    state.paused = true;
  }

  const speedValEl = document.querySelector<HTMLElement>('#anim-speed-value');
  const densityValEl = document.querySelector<HTMLElement>('#anim-density-value');

  function updateSliderOutputs(): void {
    if (speedValEl) speedValEl.textContent = `${state.settings.anim.speed}×`;
    if (densityValEl) densityValEl.textContent = String(state.settings.anim.density);
  }

  function updatePauseButton(): void {
    animPauseEl.removeAttribute('aria-pressed');
    animPauseEl.textContent = state.paused ? 'Play' : 'Pause';
  }

  updatePauseButton();
  updateSliderOutputs();

  animStyleEl.value = state.settings.anim.style;
  animSpeedEl.value = String(state.settings.anim.speed);
  animDensityEl.value = String(state.settings.anim.density);
  animGlowEl.checked = state.settings.anim.glow;
  themeEl.value = state.settings.theme;

  animStyleEl.addEventListener('change', () => {
    state.settings.anim.style = animStyleEl.value as AnimStyle;
    saveSettings(store, state.settings);
  });
  animSpeedEl.addEventListener('input', () => {
    state.settings.anim.speed = parseFloat(animSpeedEl.value);
    updateSliderOutputs();
    saveSettings(store, state.settings);
  });
  animDensityEl.addEventListener('input', () => {
    state.settings.anim.density = parseInt(animDensityEl.value, 10);
    updateSliderOutputs();
    saveSettings(store, state.settings);
  });
  animGlowEl.addEventListener('change', () => {
    state.settings.anim.glow = animGlowEl.checked;
    saveSettings(store, state.settings);
  });

  function togglePause(): void {
    state.paused = !state.paused;
    updatePauseButton();
    onPauseToggle(state.paused);
  }

  animPauseEl.addEventListener('click', togglePause);

  themeEl.addEventListener('change', () => {
    const choice = themeEl.value as ThemeChoice;
    state.settings.theme = choice;
    state.settings.anim.glow =
      choice === 'auto' ? false : THEMES[choice].glowDefault;
    animGlowEl.checked = state.settings.anim.glow;
    saveSettings(store, state.settings);
  });

  return { togglePause };
}
