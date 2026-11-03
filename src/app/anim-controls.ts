import type { ThemeChoice } from '../core/types';
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

export function setupAnimControls(
  els: AnimControlElements,
  getState: () => AppState,
  store: KeyValueStore | null,
  onPauseToggle: (paused: boolean) => void,
): void {
  const {
    animStyleEl,
    animSpeedEl,
    animDensityEl,
    animGlowEl,
    animPauseEl,
    themeEl,
  } = els;
  const state = getState();

  animStyleEl.value = state.settings.anim.style;
  animSpeedEl.value = String(state.settings.anim.speed);
  animDensityEl.value = String(state.settings.anim.density);
  animGlowEl.checked = state.settings.anim.glow;
  themeEl.value = state.settings.theme;

  animStyleEl.addEventListener('change', () => {
    state.settings.anim.style = animStyleEl.value as any;
    saveSettings(store, state.settings);
  });
  animSpeedEl.addEventListener('input', () => {
    state.settings.anim.speed = parseFloat(animSpeedEl.value);
    saveSettings(store, state.settings);
  });
  animDensityEl.addEventListener('input', () => {
    state.settings.anim.density = parseInt(animDensityEl.value, 10);
    saveSettings(store, state.settings);
  });
  animGlowEl.addEventListener('change', () => {
    state.settings.anim.glow = animGlowEl.checked;
    saveSettings(store, state.settings);
  });
  animPauseEl.addEventListener('click', () => {
    state.paused = !state.paused;
    animPauseEl.setAttribute('aria-pressed', String(state.paused));
    onPauseToggle(state.paused);
  });
  themeEl.addEventListener('change', () => {
    const choice = themeEl.value as ThemeChoice;
    state.settings.theme = choice;
    state.settings.anim.glow =
      choice === 'auto' ? false : THEMES[choice].glowDefault;
    animGlowEl.checked = state.settings.anim.glow;
    saveSettings(store, state.settings);
  });
}
