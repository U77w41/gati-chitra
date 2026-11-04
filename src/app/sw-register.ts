export interface SwDeps {
  container:
    | Pick<ServiceWorkerContainer, 'register' | 'addEventListener' | 'controller'>
    | undefined;
  prod: boolean;
  enabled: boolean;
  base: string;
  reload(): void;
  showUpdate(onReload: () => void): void;
  showOfflineReady(): void;
}

interface WorkerWithEvents {
  state: string;
  addEventListener(type: string, listener: () => void): void;
  postMessage(m: unknown): void;
}

interface RegistrationLike {
  waiting?: { postMessage(m: unknown): void } | null;
  installing?: WorkerWithEvents | null;
  addEventListener?(type: string, listener: () => void): void;
}

export async function registerServiceWorker(deps: SwDeps): Promise<void> {
  if (!deps.prod || !deps.enabled || !deps.container) {
    return;
  }

  const { container, base, reload, showUpdate, showOfflineReady } = deps;

  let reloading = false;
  container.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    reload();
  });

  const swUrl = `${base.endsWith('/') ? base : `${base}/`}sw.js`;
  const reg = (await container.register(swUrl, { scope: base })) as
    | RegistrationLike
    | undefined;

  if (!reg) return;

  const promptUpdate = (worker: { postMessage(m: unknown): void }): void => {
    showUpdate(() => {
      worker.postMessage({ type: 'skipWaiting' });
    });
  };

  if (reg.waiting) {
    promptUpdate(reg.waiting);
  }

  const trackInstalling = (worker: WorkerWithEvents): void => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (container.controller) {
          promptUpdate(worker);
        } else {
          showOfflineReady();
        }
      }
    });
  };

  if (reg.installing) {
    trackInstalling(reg.installing);
  }

  reg.addEventListener?.('updatefound', () => {
    if (reg.installing) {
      trackInstalling(reg.installing);
    }
  });
}

export interface PreloadErrorEnv {
  target?: {
    addEventListener(type: string, listener: (event: unknown) => void): void;
  };
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  reload?: () => void;
  onError: (err: string) => void;
}

export function setupPreloadErrorHandler(env: PreloadErrorEnv): void {
  const target =
    env.target ?? (typeof window !== 'undefined' ? window : undefined);
  const storage =
    env.storage ??
    (typeof sessionStorage !== 'undefined' ? sessionStorage : undefined);
  const reload = env.reload ?? (() => location.reload());

  if (!target || !storage) return;

  target.addEventListener('vite:preloadError', (event: unknown) => {
    const custom = event as { payload?: Error };
    const errMessage = custom?.payload?.message || String(event);
    if (!storage.getItem('gc-reloaded')) {
      storage.setItem('gc-reloaded', '1');
      reload();
    } else {
      storage.removeItem('gc-reloaded');
      env.onError(errMessage);
    }
  });
}
