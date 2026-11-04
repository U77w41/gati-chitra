import { describe, it, expect } from 'vitest';
import { canShareFile, shareFile } from './share-file';

describe('shareFile', () => {
  it('checks file sharing', () => {
    const f = new File(['x'], 'd.png', { type: 'image/png' });
    expect(canShareFile(f, undefined)).toBe(false);
    expect(canShareFile(f, { canShare: () => true })).toBe(true);
  });
  it('maps share results', async () => {
    const f = new File(['x'], 'd.png');
    expect(await shareFile(f, { share: async () => {} })).toBe('shared');
    expect(await shareFile(f, { share: () => Promise.reject(new DOMException('x', 'AbortError')) })).toBe('cancelled');
    expect(await shareFile(f, { share: () => Promise.reject(new DOMException('x', 'NotAllowedError')) })).toBe('unsupported');
  });
});
