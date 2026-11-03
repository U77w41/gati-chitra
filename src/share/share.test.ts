import { deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { MESSAGES, SHARE } from '../core/constants';
import {
  buildShareUrl,
  decodeShare,
  encodeShare,
  fromBase64Url,
  toBase64Url,
} from './share';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomText(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const rng = mulberry32(7);
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars[Math.floor(rng() * chars.length)];
  }
  return res;
}

describe('share', () => {
  it('converts to and from base64url', () => {
    expect(toBase64Url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
    expect(Array.from(fromBase64Url('-_8')!)).toEqual([0xfb, 0xff]);
    expect(fromBase64Url('a b')).toBeNull();

    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(Array.from(fromBase64Url(toBase64Url(all))!)).toEqual(Array.from(all));
  });

  it('encodes and decodes share links with compression', async () => {
    const t = 'flowchart TD\nA-->B';
    const enc = await encodeShare(t);
    expect('hash' in enc && enc.hash.startsWith('v1=')).toBe(true);
    expect(await decodeShare('#' + (enc as { hash: string }).hash)).toBe(t);

    const u = 'flowchart TD\nA[Ünï ✓] --> B';
    const encU = (await encodeShare(u)) as { hash: string };
    expect(await decodeShare('#' + encU.hash)).toBe(u);
  });

  it('encodes and decodes uncompressed share links (plain fallback)', async () => {
    const t = 'flowchart TD\nA-->B';
    const plain = (await encodeShare(t, { compression: false })) as { hash: string };
    expect(plain.hash.startsWith('v1p=')).toBe(true);
    expect(await decodeShare(plain.hash)).toBe(t);
  });

  it('returns null for invalid, corrupted or unrecognized hashes', async () => {
    expect(await decodeShare('#v1=!!!')).toBeNull();
    expect(await decodeShare('#zzz')).toBeNull();
    expect(await decodeShare('')).toBeNull();
    expect(
      await decodeShare(
        '#v1=' + toBase64Url(Uint8Array.from({ length: 40 }, (_, i) => (i * 37) % 256)),
      ),
    ).toBeNull();
  });

  it('handles length limits on encode and decode', async () => {
    expect(await encodeShare(randomText(20000))).toEqual({ error: MESSAGES.shareTooLong });

    const shortEnc = await encodeShare('x'.repeat(200));
    expect('hash' in shortEnc && shortEnc.hash.length < 400).toBe(true);

    const tooLongPlain = 'v1p=' + toBase64Url(new TextEncoder().encode('x'.repeat(20001)));
    expect(await decodeShare(tooLongPlain)).toBeNull();
  });

  it('builds share URL correctly preserving pathname and query parameters', () => {
    expect(buildShareUrl('https://x.test/app/?e2e=1#old', 'v1=abc')).toBe(
      'https://x.test/app/?e2e=1#v1=abc',
    );
  });

  it('rejects a share link that inflates past the limit', async () => {
    const bytes = deflateRawSync(Buffer.from('A'.repeat(1_000_000)));
    expect(await decodeShare(SHARE.prefix + toBase64Url(new Uint8Array(bytes)))).toBeNull();
  });
});
