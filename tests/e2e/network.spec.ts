import { test, expect } from '@playwright/test';
import { setEditorText } from '../support/editor';

test.describe('Network privacy and offline functionality', () => {
  test('does not send requests to other origins and functions offline', async ({
    page,
    context,
  }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      requests.push(req.url());
    });

    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    const origin = new URL(page.url()).origin;

    // Interact online: type text
    await setEditorText(page, 'flowchart TD\nA-->B');
    await page.waitForTimeout(200);

    // Drag a node
    const center = await page.evaluate(() =>
      (window as any).__studio.getNodeScreenCenter('A'),
    );
    if (center) {
      await page.mouse.move(center.x, center.y);
      await page.mouse.down();
      await page.mouse.move(center.x + 50, center.y + 50);
      await page.mouse.up();
    }

    // Export PNG and SVG
    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    const pngPromise = page.waitForEvent('download');
    await page.click('#export-png');
    await pngPromise;

    const svgPromise = page.waitForEvent('download');
    await page.click('#export-svg');
    await svgPromise;

    await page.click('#export-close');
    await expect(page.locator('#export-panel')).toBeHidden();

    // Verify all requests belong to the same origin
    for (const url of requests) {
      expect(url.startsWith(origin)).toBe(true);
    }

    // Set offline
    await context.setOffline(true);

    // Type text offline
    await setEditorText(page, 'flowchart TD\nX-->Y');
    await page.waitForTimeout(200);

    // Drag a node offline
    const center2 = await page.evaluate(() =>
      (window as any).__studio.getNodeScreenCenter('X'),
    );
    if (center2) {
      await page.mouse.move(center2.x, center2.y);
      await page.mouse.down();
      await page.mouse.move(center2.x + 50, center2.y + 50);
      await page.mouse.up();
    }

    // Export PNG and SVG offline
    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    const pngPromise2 = page.waitForEvent('download');
    await page.click('#export-png');
    const dlPng = await pngPromise2;
    expect(dlPng.suggestedFilename()).toBe('diagram.png');

    const svgPromise2 = page.waitForEvent('download');
    await page.click('#export-svg');
    const dlSvg = await svgPromise2;
    expect(dlSvg.suggestedFilename()).toBe('diagram.svg');

    await page.click('#export-close');
    await expect(page.locator('#export-panel')).toBeHidden();
  });
});
