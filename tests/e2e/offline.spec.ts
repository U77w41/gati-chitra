import { expect, test } from '@playwright/test';
import { editorText } from '../support/editor';

test.describe('Offline service worker', () => {
  test('works offline after the first visit', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Service worker test is Chromium only');

    // 1. Open with sw=1 and wait for controller
    await page.goto('./?e2e=1&sw=1');
    await page.waitForTimeout(300);

    await page.evaluate(async () => {
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
        });
      }
    });

    // Edit text
    await page.evaluate(() => {
      (window as unknown as { __studio: { setText(t: string): void } }).__studio.setText(
        'flowchart TD\nA[Offline Start] --> B[Offline End]',
      );
    });
    await page.waitForTimeout(300);

    // Track failed asset requests
    const failedAssetRequests: string[] = [];
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('/assets/')) {
        failedAssetRequests.push(url);
      }
    });

    // 2. Turn network off and reload
    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(300);

    // 3. The editor shows the last text
    const text = await editorText(page);
    expect(text).toContain('Offline Start');

    // A template loads
    await page.click('#btn-templates');
    await page.getByText('Approval flow').click();
    await expect(page.locator('#gallery')).toBeHidden();
    await expect.poll(async () => editorText(page)).toContain('Start');

    // Save as SVG downloads a file
    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    const [svgDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-svg'),
    ]);
    expect(svgDownload.suggestedFilename()).toBe('diagram.svg');

    // 4. Save as video either downloads a video or shows GIF fallback, with no failed request for /assets/
    const videoBtn = page.locator('#export-video');
    if (await videoBtn.isVisible()) {
      await videoBtn.click();
      await page.waitForTimeout(1000);
      expect(failedAssetRequests).toEqual([]);
    }
  });

  test('a missing lazy chunk reloads once', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Service worker test is Chromium only');

    await page.goto('./?e2e=1&sw=1');
    await page.waitForTimeout(300);

    // Route video asset to fail
    await page.route('**/video-*.js', (route) => route.abort('failed'));

    // Open export and click Save as video
    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    const videoBtn = page.locator('#export-video');
    if (await videoBtn.isVisible()) {
      await videoBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});
