import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';

test.describe('Video export', () => {
  test('does not load mediabunny on initial page load', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', (req) => {
      urls.push(req.url());
    });

    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    const loadedMediabunny = urls.some((u) => u.toLowerCase().includes('mediabunny'));
    expect(loadedMediabunny).toBe(false);
  });

  test('exports MP4 or WebM video with default sample', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    const loopSelect = page.locator('#export-loops');
    if (await loopSelect.isVisible()) {
      await loopSelect.selectOption('1');
    }

    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-video');

    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename === 'diagram.mp4' || filename === 'diagram.webm').toBe(true);

    const path = await download.path();
    expect(path).toBeTruthy();
    const bytes = fs.readFileSync(path!);
    expect(bytes.length).toBeGreaterThan(1000);

    if (filename.endsWith('.mp4')) {
      const ftyp = bytes.subarray(4, 8).toString('ascii');
      expect(ftyp).toBe('ftyp');
    } else {
      expect(bytes[0]).toBe(0x1a);
      expect(bytes[1]).toBe(0x45);
      expect(bytes[2]).toBe(0xdf);
      expect(bytes[3]).toBe(0xa3);
    }
  });

  test('falls back to GIF when VideoEncoder is not available', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).VideoEncoder = undefined;
    });

    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-video');

    await expect(page.locator('#export-message')).toContainText(
      'This browser cannot encode video. Saved as GIF instead.',
    );

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('diagram.gif');
  });

  test('cancels video export when cancel button is clicked', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    // Create 100-node chain
    const lines = ['flowchart TD'];
    for (let i = 0; i < 99; i++) {
      lines.push(`N${i}-->N${i + 1}`);
    }
    await page.evaluate((text) => {
      (window as any).__studio.setText(text);
    }, lines.join('\n'));
    await page.waitForTimeout(400);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    let downloaded = false;
    page.on('download', () => {
      downloaded = true;
    });

    await page.click('#export-video');
    await page.waitForTimeout(200);

    await page.click('#export-cancel');
    await page.waitForTimeout(2000);

    expect(downloaded).toBe(false);
    await expect(page.locator('#export-message')).toContainText('Export cancelled.');
  });

  test('disables video export button when diagram is empty', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    const btnVideo = page.locator('#export-video');
    await expect(btnVideo).toBeDisabled();
    await expect(page.locator('#export-message')).toContainText(
      'Nothing to export. Add a node first.',
    );
  });
});
