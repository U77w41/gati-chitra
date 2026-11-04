import { showMessage } from './message';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface WindowPromptTarget {
  matchMedia?: (query: string) => { matches: boolean };
  addEventListener(type: string, listener: (e: Event) => void): void;
  removeEventListener(type: string, listener: (e: Event) => void): void;
  navigator?: { userAgent?: string; standalone?: boolean };
}

export type InstallButtonTarget = Pick<
  HTMLButtonElement,
  'hidden' | 'addEventListener' | 'removeEventListener'
>;

export function setupInstallPrompt(
  btn: InstallButtonTarget | null,
  win: WindowPromptTarget | null = typeof window !== 'undefined' ? window : null,
): () => void {
  if (!btn || !win) return () => {};

  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const isStandalone = (): boolean => {
    const nav = win.navigator;
    return (
      Boolean(nav?.standalone) ||
      Boolean(win.matchMedia?.('(display-mode: standalone)')?.matches)
    );
  };

  if (isStandalone()) {
    btn.hidden = true;
  }

  const onBeforeInstall = (e: Event): void => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    if (!isStandalone()) {
      btn.hidden = false;
    }
  };

  const onAppInstalled = (): void => {
    btn.hidden = true;
    deferredPrompt = null;
  };

  const onClick = async (): Promise<void> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          btn.hidden = true;
        }
      } catch {}
      deferredPrompt = null;
      return;
    }

    const isIos =
      typeof win.navigator?.userAgent === 'string' &&
      /iPhone|iPad|iPod/.test(win.navigator.userAgent);

    if (isIos) {
      showMessage(
        'To install Gati-chitra: tap the Share button in Safari, then select "Add to Home Screen".',
      );
    } else {
      showMessage(
        'To install Gati-chitra: click the Install icon in your browser address bar or menu.',
      );
    }
  };

  win.addEventListener('beforeinstallprompt', onBeforeInstall);
  win.addEventListener('appinstalled', onAppInstalled);
  btn.addEventListener('click', onClick as unknown as (e: Event) => void);

  return () => {
    win.removeEventListener('beforeinstallprompt', onBeforeInstall);
    win.removeEventListener('appinstalled', onAppInstalled);
    btn.removeEventListener('click', onClick as unknown as (e: Event) => void);
  };
}
