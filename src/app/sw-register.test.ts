import { describe, expect, it, vi } from 'vitest';
import {
  registerServiceWorker,
  setupPreloadErrorHandler,
  type SwDeps,
} from './sw-register';

function fakeDeps(
  overrides: {
    register?: () => Promise<unknown>;
    controller?: unknown;
  } = {},
): SwDeps {
  const container = {
    register: (overrides.register ??
      (async () => ({}))) as () => Promise<ServiceWorkerRegistration>,
    addEventListener: vi.fn(),
    controller: overrides.controller as unknown as ServiceWorker,
  };
  return {
    container,
    prod: true,
    enabled: true,
    base: '/gati-chitra/',
    reload: vi.fn(),
    showUpdate: vi.fn(),
    showOfflineReady: vi.fn(),
  };
}

describe('sw-register', () => {
  it('offers an update when a new worker waits', async () => {
    const posted: unknown[] = [];
    let shown: (() => void) | null = null;
    const reg = {
      waiting: { postMessage: (m: unknown) => posted.push(m) },
      addEventListener() {},
    };
    await registerServiceWorker({
      ...fakeDeps({
        register: async () => reg,
        controller: {},
      }),
      showUpdate: (cb: () => void) => {
        shown = cb;
      },
    });
    shown!();
    expect(posted).toEqual([{ type: 'skipWaiting' }]);
  });

  it('stays off in dev and in e2e', async () => {
    let called = false;
    await registerServiceWorker({
      ...fakeDeps({
        register: async () => {
          called = true;
          return {};
        },
      }),
      prod: false,
    });
    expect(called).toBe(false);
  });

  it('shows offline ready on first install with no prior controller', async () => {
    const listeners: Record<string, () => void> = {};
    const worker = {
      state: 'installing',
      addEventListener(type: string, cb: () => void) {
        listeners[type] = cb;
      },
      postMessage: vi.fn(),
    };
    const reg = {
      installing: worker,
      addEventListener() {},
    };
    const deps = fakeDeps({
      register: async () => reg,
      controller: null,
    });
    await registerServiceWorker(deps);

    worker.state = 'installed';
    listeners.statechange?.();

    expect(deps.showOfflineReady).toHaveBeenCalledTimes(1);
    expect(deps.showUpdate).not.toHaveBeenCalled();
  });

  it('shows update when installing with an active controller', async () => {
    const listeners: Record<string, () => void> = {};
    const worker = {
      state: 'installing',
      addEventListener(type: string, cb: () => void) {
        listeners[type] = cb;
      },
      postMessage: vi.fn(),
    };
    const reg = {
      installing: worker,
      addEventListener() {},
    };
    const deps = fakeDeps({
      register: async () => reg,
      controller: {},
    });
    await registerServiceWorker(deps);

    worker.state = 'installed';
    listeners.statechange?.();

    expect(deps.showUpdate).toHaveBeenCalledTimes(1);
    expect(deps.showOfflineReady).not.toHaveBeenCalled();
  });

  it('reloads once on controllerchange', async () => {
    let changeHandler: (() => void) | undefined;
    const deps = fakeDeps();
    deps.container!.addEventListener = (type: string, cb: unknown) => {
      if (type === 'controllerchange') changeHandler = cb as () => void;
    };
    await registerServiceWorker(deps);

    expect(changeHandler).toBeDefined();
    changeHandler?.();
    changeHandler?.();
    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it('handles preload error reload once and then reports error', () => {
    const onError = vi.fn();
    const reload = vi.fn();
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    };
    let listener: ((event: unknown) => void) | undefined;
    const target = {
      addEventListener: (_type: string, cb: (event: unknown) => void) => {
        listener = cb;
      },
    };

    setupPreloadErrorHandler({ target, storage, reload, onError });

    // First trigger sets flag and calls reload
    listener?.({ payload: new Error('Failed to fetch dynamically imported module') });
    expect(storage.getItem('gc-reloaded')).toBe('1');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();

    // Second trigger calls onError and cleans up
    listener?.({ payload: new Error('Chunk failed again') });
    expect(storage.getItem('gc-reloaded')).toBeNull();
    expect(onError).toHaveBeenCalledWith('Chunk failed again');
  });
});
