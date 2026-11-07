import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

export const CASES: { kind: string; file: string; nodes: number; svgText: string }[] = [
  { kind: 'state', file: 'state.mmd', nodes: 8, svgText: 'Paying' },
  { kind: 'class', file: 'class.mmd', nodes: 5, svgText: 'Animal' },
  { kind: 'er', file: 'er.mmd', nodes: 4, svgText: 'CUSTOMER' },
  { kind: 'requirement', file: 'requirement.mmd', nodes: 4, svgText: 'fast_checkout' },
  { kind: 'usecase', file: 'usecase.mmd', nodes: 6, svgText: 'Place an order' },
  { kind: 'architecture', file: 'architecture.mmd', nodes: 4, svgText: 'Database' },
  { kind: 'sequence', file: 'sequence.mmd', nodes: 4, svgText: 'Charge card' },
  { kind: 'gitgraph', file: 'gitgraph.mmd', nodes: 5, svgText: 'release' },
  { kind: 'block', file: 'block.mmd', nodes: 5, svgText: 'Worker 1' },
  { kind: 'mindmap', file: 'mindmap.mmd', nodes: 12, svgText: 'Animate' },
  { kind: 'journey', file: 'journey.mmd', nodes: 10, svgText: 'Browse menus' },
  { kind: 'timeline', file: 'timeline.mmd', nodes: 11, svgText: 'Mosaic browser' },
];

async function load(page: Page, file: string): Promise<void> {
  const text = fs.readFileSync(path.join('public/templates', file), 'utf8');
  await page.evaluate((t) => (window as any).__studio.setText(t), text);
  await expect.poll(() => page.evaluate(() => (window as any).__studio.getSummary().ok), { timeout: 10_000 }).toBe(true);
}

async function nonBgPixels(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let nonBg = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 0 && (r < 250 || g < 250 || b < 250)) nonBg++;
    }
    return nonBg;
  });
}

for (const c of CASES) {
  test(`${c.kind}: parses, draws, animates and exports`, async ({ page, browserName }) => {
    await page.goto('./?e2e=1');
    await load(page, c.file);
    expect((await page.evaluate(() => (window as any).__studio.getSummary())).nodes.length).toBe(c.nodes);

    await expect.poll(() => nonBgPixels(page)).toBeGreaterThan(100);

    if (browserName !== 'webkit') {
      await page.selectOption('#anim-style', 'build');
      const snap1 = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
        return canvas ? canvas.toDataURL() : '';
      });
      await page.waitForTimeout(500);
      const snap2 = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
        return canvas ? canvas.toDataURL() : '';
      });
      expect(snap1).not.toBe('');
      expect(snap2).not.toBe('');
      expect(snap1).not.toBe(snap2);
    }

    await page.click('#btn-export');
    const panel = page.locator('#export-panel');
    await expect(panel).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-svg'),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    if (stream) {
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    }
    const svgText = Buffer.concat(chunks).toString('utf-8');

    expect(svgText).toContain(c.svgText);
    const parseResult = await page.evaluate((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      return { ok: !parserError, error: parserError ? parserError.textContent : null };
    }, svgText);
    expect(parseResult.ok).toBe(true);
  });
}

test('restores the flowchart controls after another type', async ({ page }) => {
  await page.goto('./?e2e=1');
  const count = (sel: string) => page.locator(`${sel} option`).count();
  const before = { add: await count('#add-shape'), kind: await count('#prop-kind') };
  await load(page, CASES[0].file);
  await expect(page.locator('#card-mode')).toBeDisabled();
  await page.evaluate(() => (window as any).__studio.setText('flowchart TD\nA-->B'));
  await expect.poll(() => count('#add-shape')).toBe(before.add);
  expect(await count('#prop-kind')).toBe(before.kind);
  await expect(page.locator('#card-mode')).toBeEnabled();
  await expect(page.locator('#node-palette button').first()).toBeEnabled();
});
