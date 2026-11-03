import {
  ANIM,
  MESSAGES,
  TIMING,
  VIEW,
} from '../core/constants';
import type { ThemeChoice } from '../core/types';
import { frameState, phaseAt } from '../anim/anim';
import { fitView, panBy, wheelFactor, zoomAt } from '../editor/view';
import { canvasMeasure } from '../layout/measure';
import { drawBackground, drawScene } from '../render/draw';
import { THEMES, resolveTheme } from '../render/themes';
import { downloadBlob } from './download';
import { SAMPLE_TEXT } from './sample';
import { applyText, createState, type AppState } from './state';
import {
  loadDoc,
  loadSettings,
  safeStore,
  saveDoc,
  saveSettings,
} from './storage';
import { setupStudioApi } from './studio';

export function initApp(): void {
  const store = safeStore();
  const initialText = loadDoc(store) ?? SAMPLE_TEXT;
  const initialSettings = loadSettings(store);

  let state: AppState = createState(initialText, initialSettings);
  const measure = canvasMeasure();

  // Elements
  const sourceEl = document.querySelector<HTMLTextAreaElement>('#source')!;
  const diagnosticsEl = document.querySelector<HTMLUListElement>('#diagnostics')!;
  const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!;
  const messageEl = document.querySelector<HTMLDivElement>('#message')!;
  const ctx = canvasEl.getContext('2d')!;

  const animStyleEl = document.querySelector<HTMLSelectElement>('#anim-style')!;
  const animSpeedEl = document.querySelector<HTMLInputElement>('#anim-speed')!;
  const animDensityEl = document.querySelector<HTMLInputElement>('#anim-density')!;
  const animGlowEl = document.querySelector<HTMLInputElement>('#anim-glow')!;
  const animPauseEl = document.querySelector<HTMLButtonElement>('#anim-pause')!;
  const themeEl = document.querySelector<HTMLSelectElement>('#theme')!;

  const btnNew = document.querySelector<HTMLButtonElement>('#btn-new')!;
  const btnOpen = document.querySelector<HTMLButtonElement>('#btn-open')!;
  const btnSave = document.querySelector<HTMLButtonElement>('#btn-save-mmd')!;
  const btnFit = document.querySelector<HTMLButtonElement>('#btn-fit')!;
  const filePicker = document.querySelector<HTMLInputElement>('#file-picker')!;

  sourceEl.value = state.text;
  animStyleEl.value = state.settings.anim.style;
  animSpeedEl.value = String(state.settings.anim.speed);
  animDensityEl.value = String(state.settings.anim.density);
  animGlowEl.checked = state.settings.anim.glow;
  themeEl.value = state.settings.theme;

  let hasFitted = false;
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  let parseTimer: ReturnType<typeof setTimeout> | null = null;
  let storageUnavailableShown = false;
  let pausedPhase = 0;
  const startTime = performance.now();

  function triggerFit(): void {
    if (state.scene) {
      state.view = fitView(state.scene.layout.bounds, {
        width: canvasEl.clientWidth,
        height: canvasEl.clientHeight,
      });
    }
  }

  function updateDiagnostics(): void {
    diagnosticsEl.innerHTML = '';
    for (const diag of state.doc.diagnostics) {
      const li = document.createElement('li');
      li.className = diag.severity;
      li.textContent = `Line ${diag.line}: ${diag.message}`;
      li.addEventListener('click', () => {
        const lines = sourceEl.value.split('\n');
        let start = 0;
        for (let i = 0; i < diag.line - 1 && i < lines.length; i++) {
          start += lines[i].length + 1;
        }
        const end = start + (lines[diag.line - 1]?.length ?? 0);
        sourceEl.focus();
        sourceEl.setSelectionRange(start, end);
      });
      diagnosticsEl.appendChild(li);
    }
  }

  function updateAriaLabel(): void {
    if (state.scene) {
      const n = state.doc.nodes.length;
      const m = state.doc.edges.length;
      canvasEl.setAttribute(
        'aria-label',
        `Flowchart with ${n} nodes and ${m} arrows`,
      );
    }
  }

  function scheduleAutosave(): void {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const ok = saveDoc(store, state.text);
      if (!ok && !storageUnavailableShown) {
        messageEl.textContent = MESSAGES.storageUnavailable;
        storageUnavailableShown = true;
      }
    }, TIMING.autosaveDebounceMs);
  }

  function applyNewText(text: string): void {
    state = applyText(state, text, measure);
    updateDiagnostics();
    updateAriaLabel();
    if (!hasFitted && state.scene) {
      triggerFit();
      hasFitted = true;
    }
    scheduleAutosave();
  }

  updateDiagnostics();
  updateAriaLabel();
  if (state.scene) {
    triggerFit();
    hasFitted = true;
  }

  sourceEl.addEventListener('input', () => {
    if (parseTimer) clearTimeout(parseTimer);
    parseTimer = setTimeout(() => {
      applyNewText(sourceEl.value);
    }, TIMING.parseDebounceMs);
  });

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
    if (state.paused) {
      const elapsed = (performance.now() - startTime) / 1000;
      pausedPhase = phaseAt(elapsed, state.settings.anim);
    }
  });
  themeEl.addEventListener('change', () => {
    const choice = themeEl.value as ThemeChoice;
    state.settings.theme = choice;
    state.settings.anim.glow =
      choice === 'auto' ? false : THEMES[choice].glowDefault;
    animGlowEl.checked = state.settings.anim.glow;
    saveSettings(store, state.settings);
  });

  btnNew.addEventListener('click', () => {
    sourceEl.value = 'flowchart TD\n';
    applyNewText(sourceEl.value);
  });
  btnOpen.addEventListener('click', () => filePicker.click());
  filePicker.addEventListener('change', () => {
    const file = filePicker.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          sourceEl.value = reader.result;
          applyNewText(sourceEl.value);
        }
      };
      reader.readAsText(file);
    }
  });
  btnSave.addEventListener('click', () => {
    downloadBlob(sourceEl.value, 'diagram.mmd', 'text/vnd.mermaid');
  });
  btnFit.addEventListener('click', triggerFit);

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      triggerFit();
    }
  });

  canvasEl.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const rect = canvasEl.getBoundingClientRect();
      const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const factor = wheelFactor(e.deltaY, e.deltaMode);
      state.view = zoomAt(state.view, pt, factor);
    },
    { passive: false },
  );

  let panning = false;
  let lastPos = { x: 0, y: 0 };
  canvasEl.addEventListener('pointerdown', (e) => {
    panning = true;
    lastPos = { x: e.clientX, y: e.clientY };
    canvasEl.setPointerCapture(e.pointerId);
  });
  canvasEl.addEventListener('pointermove', (e) => {
    if (panning) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
      state.view = panBy(state.view, dx, dy);
    }
  });
  const stopPan = (e: PointerEvent) => {
    if (panning) {
      panning = false;
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };
  canvasEl.addEventListener('pointerup', stopPan);
  canvasEl.addEventListener('pointercancel', stopPan);

  const ro = new ResizeObserver(() => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvasEl.clientWidth * dpr);
    const h = Math.round(canvasEl.clientHeight * dpr);
    if (canvasEl.width !== w || canvasEl.height !== h) {
      canvasEl.width = w;
      canvasEl.height = h;
    }
  });
  ro.observe(canvasEl);

  function render(): void {
    const scheme =
      document.documentElement.getAttribute('data-scheme') === 'dark'
        ? 'dark'
        : 'light';
    const themeId = resolveTheme(state.settings.theme, scheme);
    const theme = THEMES[themeId];
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBackground(ctx, theme, canvasEl.width, canvasEl.height, false);

    if (state.scene) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const elapsed = (performance.now() - startTime) / 1000;
      const phase = state.paused
        ? pausedPhase
        : phaseAt(elapsed, state.settings.anim);
      const frame = frameState(state.scene, state.settings.anim, phase);
      drawScene(ctx, state.scene, theme, state.view, frame, {
        transparent: false,
        selection: null,
        handleNodeId: null,
        connectPreview: null,
        focus: null,
        showGlow: state.settings.anim.glow,
      });
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  setupStudioApi({
    getState: () => state,
    sourceEl,
    applyNewText,
  });
}
