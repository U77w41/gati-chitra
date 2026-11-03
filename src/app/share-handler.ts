import { MESSAGES } from '../core/constants';
import { buildShareUrl, encodeShare } from '../share/share';
import type { AppState } from './state';

export interface ShareHandlerEnv {
  btnShare: HTMLButtonElement;
  shareBox: HTMLElement;
  shareUrlInput: HTMLInputElement;
  shareBoxClose?: HTMLButtonElement | null;
  messageEl: HTMLElement;
  getState: () => AppState;
}

export function setupShareHandler(env: ShareHandlerEnv): void {
  const { btnShare, shareBox, shareUrlInput, shareBoxClose, messageEl, getState } = env;
  btnShare.disabled = false;

  btnShare.addEventListener('click', async () => {
    const state = getState();
    const res = await encodeShare(state.text);
    if ('error' in res) {
      messageEl.textContent = res.error;
      return;
    }

    const url = buildShareUrl(window.location.href, res.hash);
    shareUrlInput.value = url;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(url);
      messageEl.textContent = MESSAGES.linkCopied;
      shareBox.hidden = true;
    } catch {
      shareBox.hidden = false;
      shareUrlInput.select();
    }
  });

  if (shareBoxClose) {
    shareBoxClose.addEventListener('click', () => {
      shareBox.hidden = true;
    });
  }
}
