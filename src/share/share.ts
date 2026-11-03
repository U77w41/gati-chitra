import { LIMITS, MESSAGES, SHARE } from '../core/constants';

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) {
    return null;
  }
  let base64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export async function encodeShare(
  text: string,
  opts?: { compression?: boolean },
): Promise<{ hash: string } | { error: string }> {
  const utf8 = new TextEncoder().encode(text);
  let hash = '';

  if (opts?.compression !== false && typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([utf8])
        .stream()
        .pipeThrough(new CompressionStream('deflate-raw'));
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
      hash = SHARE.prefix + toBase64Url(compressed);
    } catch {
      hash = SHARE.plainPrefix + toBase64Url(utf8);
    }
  } else {
    hash = SHARE.plainPrefix + toBase64Url(utf8);
  }

  if (hash.length + 100 > SHARE.maxUrlChars) {
    return { error: MESSAGES.shareTooLong };
  }
  return { hash };
}

export async function decodeShare(hash: string): Promise<string | null> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  if (h.startsWith(SHARE.prefix)) {
    const rest = h.slice(SHARE.prefix.length);
    const bytes = fromBase64Url(rest);
    if (!bytes || typeof DecompressionStream === 'undefined') {
      return null;
    }
    try {
      const stream = new Blob([bytes as BlobPart])
        .stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      const decompressed = new Uint8Array(await new Response(stream).arrayBuffer());
      const text = new TextDecoder('utf-8', { fatal: true }).decode(decompressed);
      if (text.length > LIMITS.maxTextChars) {
        return null;
      }
      return text;
    } catch {
      return null;
    }
  } else if (h.startsWith(SHARE.plainPrefix)) {
    const rest = h.slice(SHARE.plainPrefix.length);
    const bytes = fromBase64Url(rest);
    if (!bytes) {
      return null;
    }
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (text.length > LIMITS.maxTextChars) {
        return null;
      }
      return text;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildShareUrl(pageUrl: string, hash: string): string {
  const base = pageUrl.split('#')[0];
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  return `${base}#${cleanHash}`;
}
