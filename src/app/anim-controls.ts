import type { AnimStyle, BackgroundChoice, ThemeChoice } from '../core/types';
import { THEMES, THEME_IDS, resolveTheme } from '../render/themes';
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
  themeStripEl?: HTMLElement | null;
  bgThemeEl?: HTMLSelectElement | null;
  bgStripEl?: HTMLElement | null;
  bgLockEl?: HTMLButtonElement | null;
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
    themeStripEl,
    bgThemeEl,
    bgStripEl,
    bgLockEl,
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
      bgLockEl.setAttribute('aria-pressed', isLocked ? 'true' : 'false');
      bgLockEl.textContent = isLocked ? '🔒 Locked' : '🔓 Lock BG';
    }
    if (canvasGridEl) {
      canvasGridEl.checked = Boolean(state.settings.grid);
    }
    if (themeStripEl) {
      themeStripEl.querySelectorAll<HTMLButtonElement>('.theme-chip').forEach((btn) => {
        const isActive = btn.dataset.theme === state.settings.theme;
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    }
    if (bgStripEl) {
      const curBg = state.settings.bgTheme ?? 'match';
      bgStripEl.querySelectorAll<HTMLButtonElement>('.bg-chip').forEach((btn) => {
        const isActive = btn.dataset.bg === curBg;
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
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

  function makeChip(
    cls: string,
    key: 'theme' | 'bg',
    val: string,
    label: string,
    dotBg: string,
    dotBorder: string,
    innerBg?: string,
  ): HTMLButtonElement {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = cls;
    chip.dataset[key] = val;
    chip.setAttribute('role', 'radio');
    chip.setAttribute('aria-label', label);

    const dot = document.createElement('span');
    dot.className = 'theme-swatch-dot';
    dot.style.backgroundColor = dotBg;
    dot.style.borderColor = dotBorder;

    if (innerBg) {
      const inner = document.createElement('span');
      inner.className = 'theme-swatch-inner';
      inner.style.backgroundColor = innerBg;
      dot.appendChild(inner);
    }

    const text = document.createElement('span');
    text.textContent = label;
    chip.appendChild(dot);
    chip.appendChild(text);
    return chip;
  }

  // Populate theme strip buttons
  if (themeStripEl) {
    themeStripEl.replaceChildren();
    for (const id of THEME_IDS) {
      const t = THEMES[id];
      const chip = makeChip('theme-chip', 'theme', id, `${t.name} diagram theme`, t.nodeFill, t.nodeStroke, t.particle);
      chip.addEventListener('click', () => applyTheme(id));
      themeStripEl.appendChild(chip);
    }
  }

  // Populate background strip buttons
  if (bgStripEl) {
    bgStripEl.replaceChildren();
    const matchChip = document.createElement('button');
    matchChip.type = 'button';
    matchChip.className = 'bg-chip';
    matchChip.dataset.bg = 'match';
    matchChip.setAttribute('role', 'radio');
    matchChip.setAttribute('aria-label', 'Match diagram background');
    matchChip.textContent = 'Match';
    matchChip.addEventListener('click', () => applyBg('match'));
    bgStripEl.appendChild(matchChip);

    for (const id of THEME_IDS) {
      const t = THEMES[id];
      const chip = makeChip('bg-chip', 'bg', id, `${t.name} background`, t.background, t.nodeStroke);
      chip.addEventListener('click', () => applyBg(id));
      bgStripEl.appendChild(chip);
    }
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
