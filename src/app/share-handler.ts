import { MESSAGES } from '../core/constants';
import { buildShareUrl, decodeShare, encodeShare } from '../share/share';
import { showMessage } from './message';

export async function checkInitialShare(): Promise<{ text: string | null; error: string | null }> {
  if (typeof window === 'undefined') return { text: null, error: null };
  const hash = window.location.hash;
  if (!hash.startsWith('#v1')) return { text: null, error: null };
  try {
    const text = await decodeShare(hash);
    if (text !== null) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return { text, error: null };
    }
    return { text: null, error: MESSAGES.shareInvalid };
  } catch {
    return { text: null, error: MESSAGES.shareInvalid };
  }
}

export function setupHashChangeListener(
  onShare: (text: string) => void,
  onError: (err: string) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = async () => {
    const hash = window.location.hash;
    if (!hash.startsWith('#v1')) return;
    try {
      const text = await decodeShare(hash);
      if (text !== null) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        onShare(text);
      } else {
        onError(MESSAGES.shareInvalid);
      }
    } catch {
      onError(MESSAGES.shareInvalid);
    }
  };
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}
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
