import { describe, expect, it } from 'vitest';
import { copyImage, copyText } from './clipboard';

describe('clipboard', () => {
  it('reports missing support', async () => {
    expect(await copyImage(Promise.resolve(new Blob()), {})).toBe('unsupported');
  });

  it('reports a refusal', async () => {
    const deps = {
      clipboard: {
        write: () => Promise.reject(new Error('no')),
        writeText: async () => {},
      },
      makeItem: (x: object) => x as unknown as ClipboardItem,
    };
    expect(await copyImage(Promise.resolve(new Blob()), deps)).toBe('denied');
  });

  it('copies text', async () => {
    let got = '';
    const deps = {
      clipboard: {
        write: async () => {},
        writeText: async (t: string) => {
          got = t;
        },
      },
    };
    expect(await copyText('<svg/>', deps)).toBe('ok');
    expect(got).toBe('<svg/>');
  });

  it('reports copyText refusal', async () => {
    const deps = {
      clipboard: {
        write: async () => {},
        writeText: () => Promise.reject(new Error('denied')),
      },
    };
    expect(await copyText('<svg/>', deps)).toBe('denied');
  });

  it('reports copyText missing writeText', async () => {
    expect(await copyText('<svg/>', {})).toBe('denied');
  });

  it('copies image when supported', async () => {
    let written: ClipboardItem[] = [];
    const dummyBlob = new Blob();
    const deps = {
      clipboard: {
        write: async (items: ClipboardItem[]) => {
          written = items;
        },
        writeText: async () => {},
      },
      makeItem: (x: Record<string, Promise<Blob>>) => x as unknown as ClipboardItem,
    };
    expect(await copyImage(Promise.resolve(dummyBlob), deps)).toBe('ok');
    expect(written.length).toBe(1);
  });
});
