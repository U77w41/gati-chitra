import { MESSAGES } from '../core/constants';
import type { ExportMode } from '../core/types';
import { downloadBlob } from '../export/download';
import { safeFilename } from '../export/filename';
import { exportGif } from '../export/gif';
import { exportPng } from '../export/png';
import { canvasMeasure } from '../layout/measure';
import { isEmptyBounds } from '../render/frame';
import { renderSvg } from '../render/svg';
import { resolveTheme, THEMES } from '../render/themes';
import type { AppState } from './state';

export interface ExportPanelEnv {
  dialogEl: HTMLDialogElement;
  getState: () => AppState;
  btnExport: HTMLButtonElement;
}

export function setupExportPanel(env: ExportPanelEnv): void {
  const { dialogEl, getState, btnExport } = env;

  const exportName = dialogEl.querySelector<HTMLInputElement>('#export-name')!;
  const exportMode = dialogEl.querySelector<HTMLSelectElement>('#export-mode')!;
  const exportScale = dialogEl.querySelector<HTMLSelectElement>('#export-scale')!;
  const exportFps = dialogEl.querySelector<HTMLSelectElement>('#export-fps')!;
  const exportTransparent = dialogEl.querySelector<HTMLInputElement>('#export-transparent')!;
  const exportPngBtn = dialogEl.querySelector<HTMLButtonElement>('#export-png')!;
  const exportSvgBtn = dialogEl.querySelector<HTMLButtonElement>('#export-svg')!;
  const exportGifBtn = dialogEl.querySelector<HTMLButtonElement>('#export-gif')!;
  const exportCancel = dialogEl.querySelector<HTMLButtonElement>('#export-cancel')!;
  const exportClose = dialogEl.querySelector<HTMLButtonElement>('#export-close')!;
  const exportProgress = dialogEl.querySelector<HTMLProgressElement>('#export-progress')!;
  const exportMessage = dialogEl.querySelector<HTMLElement>('#export-message')!;

  btnExport.disabled = false;
  let abortCtrl: AbortController | null = null;

  function open(): void {
    const state = getState();
    const noScene = !state.scene || isEmptyBounds(state.scene.layout.bounds);
    exportMessage.textContent = noScene ? MESSAGES.nothingToExport : '';
    if (exportProgress) exportProgress.hidden = true;

    const saveButtons = dialogEl.querySelectorAll<HTMLButtonElement>(
      '#export-png, #export-svg, #export-gif, #export-video',
    );
    for (const b of saveButtons) b.disabled = noScene;

    if (dialogEl.showModal) dialogEl.showModal();
    else dialogEl.setAttribute('open', '');
  }

  function close(): void {
    if (abortCtrl) {
      abortCtrl.abort();
    }
    if (dialogEl.close) dialogEl.close();
    else dialogEl.removeAttribute('open');
  }

  btnExport.addEventListener('click', open);
  exportClose.addEventListener('click', close);
  exportCancel.addEventListener('click', close);

  exportPngBtn.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;

    const scheme =
      document.documentElement.getAttribute('data-scheme') === 'dark'
        ? 'dark'
        : 'light';
    const theme = THEMES[resolveTheme(state.settings.theme, scheme)];
    const mode = exportMode.value as ExportMode;
    const scale = parseInt(exportScale.value, 10);
    const transparent = exportTransparent.checked;
    const filename = safeFilename(exportName.value, 'png');

    try {
      exportPngBtn.disabled = true;
      const res = await exportPng(state.scene, theme, {
        mode,
        scale,
        transparent,
      });
      if (res.reduced) {
        exportMessage.textContent = MESSAGES.pngReduced(res.scaleUsed);
      }
      downloadBlob(res.blob, filename);
    } catch (err: any) {
      exportMessage.textContent = err?.message ?? 'Export failed';
    } finally {
      exportPngBtn.disabled = false;
    }
  });

  exportSvgBtn.addEventListener('click', () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;

    const scheme =
      document.documentElement.getAttribute('data-scheme') === 'dark'
        ? 'dark'
        : 'light';
    const theme = THEMES[resolveTheme(state.settings.theme, scheme)];
    const mode = exportMode.value as ExportMode;
    const transparent = exportTransparent.checked;
    const filename = safeFilename(exportName.value, 'svg');

    try {
      const svgText = renderSvg(
        state.scene,
        theme,
        { mode, transparent },
        canvasMeasure(),
      );
      const blob = new Blob([svgText], {
        type: 'image/svg+xml;charset=utf-8',
      });
      downloadBlob(blob, filename);
    } catch (err: any) {
      exportMessage.textContent = err?.message ?? 'Export failed';
    }
  });

  exportGifBtn.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;

    const scheme =
      document.documentElement.getAttribute('data-scheme') === 'dark'
        ? 'dark'
        : 'light';
    const theme = THEMES[resolveTheme(state.settings.theme, scheme)];
    const mode = exportMode.value as ExportMode;
    const fps = parseInt(exportFps.value, 10);
    const filename = safeFilename(exportName.value, 'gif');

    const saveButtons = dialogEl.querySelectorAll<HTMLButtonElement>(
      '#export-png, #export-svg, #export-gif, #export-video',
    );

    try {
      for (const b of saveButtons) b.disabled = true;
      if (exportProgress) {
        exportProgress.hidden = false;
        exportProgress.value = 0;
        exportProgress.max = 100;
      }
      exportMessage.textContent = '';
      abortCtrl = new AbortController();

      const res = await exportGif(
        state.scene,
        theme,
        state.settings.anim,
        { mode, fps },
        (done, total) => {
          if (exportProgress) {
            exportProgress.value = done;
            exportProgress.max = total;
          }
        },
        abortCtrl.signal,
      );

      if (res.reduced) {
        exportMessage.textContent = MESSAGES.gifReduced;
      }
      downloadBlob(res.blob, filename);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        exportMessage.textContent = MESSAGES.exportCancelled;
      } else {
        exportMessage.textContent = err?.message ?? 'Export failed';
      }
    } finally {
      abortCtrl = null;
      if (exportProgress) exportProgress.hidden = true;
      const curState = getState();
      const noScene = !curState.scene || isEmptyBounds(curState.scene.layout.bounds);
      for (const b of saveButtons) b.disabled = noScene;
    }
  });
}
