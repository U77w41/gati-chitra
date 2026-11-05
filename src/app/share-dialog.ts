import { MESSAGES } from '../core/constants';
import { showMessage } from './message';
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
  const { btnShare, shareBox, shareUrlInput, shareBoxClose, getState } = env;
  btnShare.disabled = false;

  btnShare.addEventListener('click', async () => {
    const { buildShareUrl, encodeShare } = await import('../share/share');
    const state = getState();
    const res = await encodeShare(state.text);
    if ('error' in res) {
      showMessage(res.error);
      return;
    }

    const url = buildShareUrl(window.location.href, res.hash);
    shareUrlInput.value = url;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(url);
      showMessage(MESSAGES.linkCopied);
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
