import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ICONS, logoSvg } from './icons';

describe('brand and assets', () => {
  const root = process.cwd();

  it('verifies public/favicon.svg content and structure', () => {
    const content = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf-8');
    expect(content).toContain('viewBox="0 0 512 512"');
    expect(content).toContain('prefers-color-scheme: dark');
    expect(content).toContain('#363853');
    expect(content).toContain('#cbd5e1');
    expect(content).toContain('M 408 42 L 408 78');

    const circles = (content.match(/<circle/g) || []).length;
    const paths = (content.match(/<path/g) || []).length;
    expect(circles).toBe(2);
    expect(paths).toBe(3);
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
