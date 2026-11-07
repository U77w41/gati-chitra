import type {
  AnimStyle,
  BackgroundChoice,
  CardStyleMode,
  NodeShadeMode,
  ThemeChoice,
} from '../core/types';
import { THEMES, resolveTheme } from '../render/themes';
import { requestRedraw } from './render-loop';
import type { AppState } from './state';
import { saveSettings, type KeyValueStore } from './storage';

export interface AnimControlElements {
  animStyleEl: HTMLSelectElement;
  animSpeedEl: HTMLInputElement;
  animDensityEl: HTMLInputElement;
  animGlowEl: HTMLInputElement;
  animPauseEl: HTMLButtonElement;
  themeEl: HTMLSelectElement;
  canvasGridEl?: HTMLInputElement | null;
  bgThemeEl?: HTMLSelectElement | null;
  bgLockEl?: HTMLButtonElement | null;
  nodeShadingEl?: HTMLSelectElement | null;
  cardModeEl?: HTMLSelectElement | null;
}

export interface AnimControlsManager {
  togglePause: () => void;
  updateThemingUI: () => void;
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
    canvasGridEl,
    bgThemeEl,
    bgLockEl,
    nodeShadingEl,
    cardModeEl,
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

  function updateThemingUI(): void {
    themeEl.value = state.settings.theme;
    if (bgThemeEl) bgThemeEl.value = state.settings.bgTheme ?? 'match';
    if (bgLockEl) {
      const isLocked = Boolean(state.settings.bgLocked);
      // A switch: the track shows the state, and the "Lock background" label stays as written.
      bgLockEl.setAttribute('aria-checked', isLocked ? 'true' : 'false');
    }
    if (canvasGridEl) {
      canvasGridEl.checked = Boolean(state.settings.grid);
    }
    if (nodeShadingEl) {
      nodeShadingEl.value = state.settings.nodeShading ?? 'shape';
    }
    if (cardModeEl) {
      cardModeEl.value = state.settings.cardMode ?? 'classic';
    }
  }

  function applyTheme(choice: ThemeChoice): void {
    state.settings.theme = choice;
    if (!state.settings.bgLocked) {
      state.settings.bgTheme = 'match';
    }
    state.settings.anim.glow =
      choice === 'auto' ? false : THEMES[choice].glowDefault;
    animGlowEl.checked = state.settings.anim.glow;
    saveSettings(store, state.settings);
    updateThemingUI();
    requestRedraw();
  }

  function applyBg(choice: BackgroundChoice): void {
    state.settings.bgTheme = choice;
    state.settings.bgLocked = choice !== 'match';
    saveSettings(store, state.settings);
    updateThemingUI();
    requestRedraw();
  }

  function toggleBgLock(): void {
    state.settings.bgLocked = !state.settings.bgLocked;
    if (state.settings.bgLocked) {
      if (!state.settings.bgTheme || state.settings.bgTheme === 'match') {
        const scheme =
          typeof document !== 'undefined' &&
          document.documentElement.getAttribute('data-scheme') === 'dark'
            ? 'dark'
            : 'light';
        state.settings.bgTheme = resolveTheme(state.settings.theme, scheme);
      }
    } else {
      state.settings.bgTheme = 'match';
    }
    saveSettings(store, state.settings);
    updateThemingUI();
    requestRedraw();
  }

  updatePauseButton();
  updateSliderOutputs();
  updateThemingUI();

  animStyleEl.value = state.settings.anim.style;
  animSpeedEl.value = String(state.settings.anim.speed);
  animDensityEl.value = String(state.settings.anim.density);
  animGlowEl.checked = state.settings.anim.glow;

  animStyleEl.addEventListener('change', () => {
    state.settings.anim.style = animStyleEl.value as AnimStyle;
    saveSettings(store, state.settings);
    requestRedraw();
  });
  animSpeedEl.addEventListener('input', () => {
    state.settings.anim.speed = parseFloat(animSpeedEl.value);
    updateSliderOutputs();
    saveSettings(store, state.settings);
    requestRedraw();
  });
  animDensityEl.addEventListener('input', () => {
    state.settings.anim.density = parseInt(animDensityEl.value, 10);
    updateSliderOutputs();
    saveSettings(store, state.settings);
    requestRedraw();
  });
  animGlowEl.addEventListener('change', () => {
    state.settings.anim.glow = animGlowEl.checked;
    saveSettings(store, state.settings);
    requestRedraw();
  });

  if (canvasGridEl) {
    canvasGridEl.addEventListener('change', () => {
      state.settings.grid = canvasGridEl.checked;
      saveSettings(store, state.settings);
      requestRedraw();
    });
  }

  if (bgLockEl) {
    bgLockEl.addEventListener('click', toggleBgLock);
  }

  if (bgThemeEl) {
    bgThemeEl.addEventListener('change', () => {
      applyBg(bgThemeEl.value as BackgroundChoice);
    });
  }

  if (nodeShadingEl) {
    nodeShadingEl.addEventListener('change', () => {
      state.settings.nodeShading = nodeShadingEl.value as NodeShadeMode;
      saveSettings(store, state.settings);
      requestRedraw();
    });
  }

  if (cardModeEl) {
    cardModeEl.addEventListener('change', () => {
      state.settings.cardMode = cardModeEl.value as CardStyleMode;
      saveSettings(store, state.settings);
      requestRedraw();
    });
  }

  function togglePause(): void {
    state.paused = !state.paused;
    updatePauseButton();
    onPauseToggle(state.paused);
    requestRedraw();
  }

  animPauseEl.addEventListener('click', togglePause);
  themeEl.addEventListener('change', () => {
    applyTheme(themeEl.value as ThemeChoice);
  });

  return { togglePause, updateThemingUI };
}
