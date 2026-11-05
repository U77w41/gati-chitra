import { MESSAGES } from '../core/constants';

export async function checkInitialShare(): Promise<{ text: string | null; error: string | null }> {
  if (typeof window === 'undefined') return { text: null, error: null };
  const hash = window.location.hash;
  if (!hash.startsWith('#v1')) return { text: null, error: null };
  try {
    const { decodeShare } = await import('../share/share');
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
      const { decodeShare } = await import('../share/share');
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

export { setupShareHandler, type ShareHandlerEnv } from './share-dialog';
