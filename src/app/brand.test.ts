import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ICONS, logoSvg } from './icons';

function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(bl!);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('brand and assets', () => {
  const root = process.cwd();

  it('favicon.svg is a solid tile with a light logo, so it reads on light and dark browser tabs', () => {
    const content = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf-8');
    expect(content).toContain('viewBox="0 0 512 512"');
    // One design for every tab colour: not every browser applies media queries inside a favicon.
    expect(content).not.toContain('prefers-color-scheme');

    const tile = content.match(/<rect[^>]*width="512"[^>]*height="512"[^>]*fill="(#[0-9a-f]{6})"/i);
    expect(tile, 'a full-size background tile').not.toBeNull();
    const ink = content.match(/stroke="(#[0-9a-f]{6})"/i);
    expect(ink, 'a logo stroke colour').not.toBeNull();
    expect(contrast(tile![1]!, ink![1]!)).toBeGreaterThanOrEqual(4.5);

    // Lines at least 40/512 thick stay over 1 px wide in a 16 px tab; 24/512 blurred into a smudge.
    const scale = Number(content.match(/scale\(([\d.]+)\)/)?.[1] ?? 1);
    const widths = [...content.matchAll(/stroke-width="(\d+)"/g)].map((m) => Number(m[1]) * scale);
    expect(widths.length).toBeGreaterThan(0);
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(40);

    expect(content).toContain('M 408 42 L 408 78');
    expect((content.match(/<circle/g) || []).length).toBe(2);
    expect((content.match(/<path/g) || []).length).toBe(3);
  });

  it('verifies public/favicon.ico ICO structure', () => {
    const buf = fs.readFileSync(path.join(root, 'public/favicon.ico'));
    expect(Array.from(buf.subarray(0, 6))).toEqual([0, 0, 1, 0, 1, 0]);
    expect(buf[6]).toBe(32);
    expect(buf[7]).toBe(32);
    expect(buf.readUInt32LE(14)).toBe(buf.length - 22);
    expect(buf.readUInt32LE(18)).toBe(22);

    const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    expect(Array.from(buf.subarray(22, 30))).toEqual(pngSig);
  });

  it('verifies public/apple-touch-icon.png dimensions in IHDR', () => {
    const buf = fs.readFileSync(path.join(root, 'public/apple-touch-icon.png'));
    expect(buf.readUInt32BE(16)).toBe(180);
    expect(buf.readUInt32BE(20)).toBe(180);
  });

  it('verifies public/theme-init.js content', () => {
    const content = fs.readFileSync(path.join(root, 'public/theme-init.js'), 'utf-8');
    expect(content).toContain("'StackColorScheme'");
    expect(content).toContain("setAttribute('data-scheme'");
  });

  it('verifies logoSvg inline markup', () => {
    const svg = logoSvg('brand-icon');
    expect(svg).toContain('class="brand-icon"');
    expect(svg).toContain('currentColor');
    expect(svg).toContain('M 408 42 L 408 78');
    expect(svg).not.toContain('#000000');
  });

  it('verifies ICONS values', () => {
    for (const [key, val] of Object.entries(ICONS)) {
      expect(val.startsWith('<svg'), `icon ${key} should start with <svg`).toBe(true);
      expect(val.endsWith('</svg>'), `icon ${key} should end with </svg>`).toBe(true);
    }
    expect(ICONS.support).toContain('class="heart-icon"');
  });
});
