import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setupInstallPrompt,
  type BeforeInstallPromptEvent,
  type InstallButtonTarget,
  type WindowPromptTarget,
} from './install-prompt';
import * as messageMod from './message';

class MockEmitter {
  listeners: Record<string, Array<(e: Event) => void>> = {};

  addEventListener(type: string, fn: (e: Event) => void): void {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type: string, fn: (e: Event) => void): void {
    const list = this.listeners[type];
    if (list) {
      const idx = list.indexOf(fn);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  emit(type: string, event: Event): void {
    for (const fn of this.listeners[type] ?? []) {
      fn(event);
    }
  }
}

describe('install-prompt', () => {
  let btn: InstallButtonTarget & {
    click(): Promise<void>;
  };
  let win: WindowPromptTarget & MockEmitter;
  let showMessageSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const emitter = new MockEmitter();
    btn = {
      hidden: false,
      addEventListener: (type: string, fn: (e: Event) => void) => emitter.addEventListener(type, fn),
      removeEventListener: (type: string, fn: (e: Event) => void) => emitter.removeEventListener(type, fn),
      async click() {
        for (const fn of emitter.listeners['click'] ?? []) {
          await fn(new Event('click'));
        }
      },
    };
    win = Object.assign(new MockEmitter(), {
      matchMedia: (query: string) => ({ matches: query.includes('standalone') }),
      navigator: { userAgent: 'Chrome/120.0.0.0' },
    });
    showMessageSpy = vi.spyOn(messageMod, 'showMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hides button when already in standalone mode', () => {
    win.matchMedia = (query: string) => ({ matches: query.includes('standalone') });
    setupInstallPrompt(btn, win);
    expect(btn.hidden).toBe(true);
  });

  it('shows browser menu instructions when clicked without beforeinstallprompt', async () => {
    win.matchMedia = () => ({ matches: false });
    setupInstallPrompt(btn, win);
    await btn.click();
    expect(showMessageSpy).toHaveBeenCalledWith(
      expect.stringContaining('browser address bar or menu')
    );
  });

  it('shows iOS instructions when clicked on iOS Safari', async () => {
    win.matchMedia = () => ({ matches: false });
    win.navigator = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' };
    setupInstallPrompt(btn, win);
    await btn.click();
    expect(showMessageSpy).toHaveBeenCalledWith(
      expect.stringContaining('Share button in Safari')
    );
  });

  it('prompts and hides button when beforeinstallprompt is triggered and accepted', async () => {
    win.matchMedia = () => ({ matches: false });
    setupInstallPrompt(btn, win);

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const preventDefaultMock = vi.fn();
    const event = {
      preventDefault: preventDefaultMock,
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    } as unknown as BeforeInstallPromptEvent;

    win.emit('beforeinstallprompt', event);
    expect(preventDefaultMock).toHaveBeenCalled();
    expect(btn.hidden).toBe(false);

    await btn.click();
    expect(promptMock).toHaveBeenCalled();
    expect(btn.hidden).toBe(true);
  });

  it('hides button on appinstalled event', () => {
    win.matchMedia = () => ({ matches: false });
    setupInstallPrompt(btn, win);
    btn.hidden = false;

    win.emit('appinstalled', new Event('appinstalled'));
    expect(btn.hidden).toBe(true);
  });

  it('unsubscribes cleanly on cleanup', () => {
    win.matchMedia = () => ({ matches: false });
    const cleanup = setupInstallPrompt(btn, win);

    expect(win.listeners['beforeinstallprompt']?.length).toBe(1);
    expect(win.listeners['appinstalled']?.length).toBe(1);

    cleanup();

    expect(win.listeners['beforeinstallprompt']?.length).toBe(0);
    expect(win.listeners['appinstalled']?.length).toBe(0);
  });
});
