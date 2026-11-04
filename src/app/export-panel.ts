import { MESSAGES } from '../core/constants';
import type { ExportMode } from '../core/types';
import { downloadBlob } from '../export/download';
import { safeFilename } from '../export/filename';
import { canvasMeasure } from '../layout/measure';
import { isEmptyBounds } from '../render/frame';
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
  const exportLoops = dialogEl.querySelector<HTMLSelectElement>('#export-loops');
  const exportTransparent = dialogEl.querySelector<HTMLInputElement>('#export-transparent')!;
  const exportPngBtn = dialogEl.querySelector<HTMLButtonElement>('#export-png')!;
  const exportSvgBtn = dialogEl.querySelector<HTMLButtonElement>('#export-svg')!;
  const exportGifBtn = dialogEl.querySelector<HTMLButtonElement>('#export-gif')!;
  const exportVideoBtn = dialogEl.querySelector<HTMLButtonElement>('#export-video');
  const exportCopyPng = dialogEl.querySelector<HTMLButtonElement>('#export-copy-png');
  const exportCopySvg = dialogEl.querySelector<HTMLButtonElement>('#export-copy-svg');
  const exportCancel = dialogEl.querySelector<HTMLButtonElement>('#export-cancel')!;
  const exportClose = dialogEl.querySelector<HTMLButtonElement>('#export-close')!;
  const exportProgress = dialogEl.querySelector<HTMLProgressElement>('#export-progress')!;
  const exportMessage = dialogEl.querySelector<HTMLElement>('#export-message')!;

  const SAVE_BTNS = '#export-png, #export-svg, #export-gif, #export-video, #export-copy-png, #export-copy-svg';
  btnExport.disabled = false;
  let abortCtrl: AbortController | null = null;

  function getTheme(state: AppState) {
    const scheme = document.documentElement.getAttribute('data-scheme') === 'dark' ? 'dark' : 'light';
    return THEMES[resolveTheme(state.settings.theme, scheme)];
  }

  function open(): void {
    const state = getState();
    const noScene = !state.scene || isEmptyBounds(state.scene.layout.bounds);
    exportMessage.textContent = noScene ? MESSAGES.nothingToExport : '';
    if (exportProgress) exportProgress.hidden = true;

    const title = state.doc.title ?? state.doc.accTitle;
    if (title && exportName.value.trim() === 'diagram') {
      exportName.value = title;
    }

    const saveButtons = dialogEl.querySelectorAll<HTMLButtonElement>(SAVE_BTNS);
    for (const b of saveButtons) b.disabled = noScene;

    if (dialogEl.showModal) dialogEl.showModal();
    else dialogEl.setAttribute('open', '');
    exportName.focus();
  }

  function resetSaveButtons(): void {
    abortCtrl = null;
    if (exportProgress) exportProgress.hidden = true;
    const curState = getState();
    const noScene = !curState.scene || isEmptyBounds(curState.scene.layout.bounds);
    for (const b of dialogEl.querySelectorAll<HTMLButtonElement>(SAVE_BTNS)) b.disabled = noScene;
  }

  function close(): void {
    if (abortCtrl) abortCtrl.abort();
    if (dialogEl.close) dialogEl.close();
    else dialogEl.removeAttribute('open');
    btnExport.focus();
  }

  dialogEl.addEventListener('close', () => {
    btnExport.focus();
  });

  btnExport.addEventListener('click', open);
  exportClose.addEventListener('click', close);
  exportCancel.addEventListener('click', close);

  exportPngBtn.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;
    const theme = getTheme(state);
    const mode = exportMode.value as ExportMode;
    const scale = parseInt(exportScale.value, 10);
    const transparent = exportTransparent.checked;
    const filename = safeFilename(exportName.value, 'png');

    try {
      exportPngBtn.disabled = true;
      const { exportPng } = await import('../export/png');
      const res = await exportPng(state.scene, theme, { mode, scale, transparent });
      if (res.reduced) {
        exportMessage.textContent = MESSAGES.pngReduced(res.scaleUsed);
      }
      downloadBlob(res.blob, filename);
    } catch (err: unknown) {
      exportMessage.textContent = err instanceof Error ? err.message : 'Export failed';
    } finally {
      exportPngBtn.disabled = false;
    }
  });

  exportCopyPng?.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;
    const theme = getTheme(state);
    const mode = exportMode.value as ExportMode;
    const scale = parseInt(exportScale.value, 10);
    const transparent = exportTransparent.checked;

    try {
      exportCopyPng.disabled = true;
      const [{ copyImage }, { exportPng }] = await Promise.all([
        import('./clipboard'),
        import('../export/png'),
      ]);
      const pngPromise = exportPng(state.scene, theme, { mode, scale, transparent }).then((r) => r.blob);
      const res = await copyImage(pngPromise);
      if (res === 'ok') exportMessage.textContent = MESSAGES.copied;
      else if (res === 'unsupported') exportMessage.textContent = MESSAGES.copyUnsupported;
    } catch (err: unknown) {
      exportMessage.textContent = err instanceof Error ? err.message : 'Export failed';
    } finally {
      exportCopyPng.disabled = false;
    }
  });

  exportSvgBtn.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;
    const theme = getTheme(state);
    const mode = exportMode.value as ExportMode;
    const transparent = exportTransparent.checked;
    const filename = safeFilename(exportName.value, 'svg');

    try {
      const { renderSvg } = await import('../render/svg');
      const svgText = renderSvg(state.scene, theme, { mode, transparent }, canvasMeasure());
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      downloadBlob(blob, filename);
    } catch (err: unknown) {
      exportMessage.textContent = err instanceof Error ? err.message : 'Export failed';
    }
  });

  exportCopySvg?.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;
    const theme = getTheme(state);
    const mode = exportMode.value as ExportMode;
    const transparent = exportTransparent.checked;

    try {
      exportCopySvg.disabled = true;
      const [{ copyText }, { renderSvg }] = await Promise.all([
        import('./clipboard'),
        import('../render/svg'),
      ]);
      const svgText = renderSvg(state.scene, theme, { mode, transparent }, canvasMeasure());
      const res = await copyText(svgText);
      if (res === 'ok') exportMessage.textContent = MESSAGES.copied;
      else exportMessage.textContent = MESSAGES.copyUnsupported;
    } catch (err: unknown) {
      exportMessage.textContent = err instanceof Error ? err.message : 'Export failed';
    } finally {
      exportCopySvg.disabled = false;
    }
  });

  exportGifBtn.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;
    const theme = getTheme(state);
    const mode = exportMode.value as ExportMode;
    const fps = parseInt(exportFps.value, 10);
    const filename = safeFilename(exportName.value, 'gif');
    const saveButtons = dialogEl.querySelectorAll<HTMLButtonElement>(SAVE_BTNS);

    try {
      for (const b of saveButtons) b.disabled = true;
      if (exportProgress) {
        exportProgress.hidden = false;
        exportProgress.value = 0;
        exportProgress.max = 100;
      }
      exportMessage.textContent = '';
      abortCtrl = new AbortController();

      const { exportGif } = await import('../export/gif');
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
    } catch (err: unknown) {
      if ((err instanceof Error && err.name === 'AbortError') || abortCtrl?.signal.aborted) {
        exportMessage.textContent = MESSAGES.exportCancelled;
      } else {
        exportMessage.textContent = err instanceof Error ? err.message : 'Export failed';
      }
    } finally {
      resetSaveButtons();
    }
  });

  exportVideoBtn?.addEventListener('click', async () => {
    const state = getState();
    if (!state.scene || isEmptyBounds(state.scene.layout.bounds)) return;

    const theme = getTheme(state);
    const mode = exportMode.value as ExportMode;
    const loops = exportLoops ? parseInt(exportLoops.value, 10) : 2;
    const name = exportName.value;
    const saveButtons = dialogEl.querySelectorAll<HTMLButtonElement>(SAVE_BTNS);

    try {
      for (const b of saveButtons) b.disabled = true;
      if (exportProgress) {
        exportProgress.hidden = false;
        exportProgress.value = 0;
        exportProgress.max = 100;
      }
      exportMessage.textContent = '';
      abortCtrl = new AbortController();

      const [{ exportVideo }, { exportGif }] = await Promise.all([
        import('../export/video'),
        import('../export/gif'),
      ]);
      const res = await exportVideo(
        state.scene,
        theme,
        state.settings.anim,
        { mode, loops },
        (done, total) => {
          if (exportProgress) {
            exportProgress.value = done;
            exportProgress.max = total;
          }
        },
        abortCtrl.signal,
      );

      if ('fallback' in res) {
        exportMessage.textContent = MESSAGES.videoUnsupported;
        const gifRes = await exportGif(
          state.scene,
          theme,
          state.settings.anim,
          { mode, fps: 20 },
          (done, total) => {
            if (exportProgress) {
              exportProgress.value = done;
              exportProgress.max = total;
            }
          },
          abortCtrl.signal,
        );
        downloadBlob(gifRes.blob, safeFilename(name, 'gif'));
      } else {
        downloadBlob(res.blob, safeFilename(name, res.container));
      }
    } catch (err: unknown) {
      if ((err instanceof Error && err.name === 'AbortError') || abortCtrl?.signal.aborted) {
        exportMessage.textContent = MESSAGES.exportCancelled;
      } else {
        exportMessage.textContent = MESSAGES.videoFailed(err instanceof Error ? err.message : 'Export failed');
      }
    } finally {
      resetSaveButtons();
    }
  });
}
