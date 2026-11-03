import { test, expect } from '@playwright/test';
import { parseGif } from '../support/parse-gif';

test.describe('GIF export', () => {
  test('exports animated GIF at 10 fps with correct frame count, delay, loop and dimensions', async ({
    page,
  }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    const panel = page.locator('#export-panel');
    await expect(panel).toBeVisible();

    await page.selectOption('#export-fps', '10');

    const t0 = Date.now();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-gif'),
    ]);
    const durationMs = Date.now() - t0;
    expect(durationMs).toBeLessThan(15000);

    expect(download.suggestedFilename()).toBe('diagram.gif');

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const gifBytes = new Uint8Array(Buffer.concat(chunks));

    const gifInfo = parseGif(gifBytes);
    expect(gifInfo.frames).toBe(40);
    expect(gifInfo.loop).toBe(true);
    expect(gifInfo.delays.length).toBe(40);
    for (const d of gifInfo.delays) {
      expect(d).toBe(10);
    }

    const expectedSize = await page.evaluate(() =>
      (window as any).__studio.getExportSize('content', 1),
    );
    expect(gifInfo.width).toBe(expectedSize.width);
    expect(gifInfo.height).toBe(expectedSize.height);
  });

  test('shows and hides progress indicator during export', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await page.selectOption('#export-fps', '10');

    const progress = page.locator('#export-progress');
    await expect(progress).toBeHidden();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-gif'),
    ]);

    await download.path();
    await expect(progress).toBeHidden();
  });

  test('cancels export on cancel button click (Review Focus 4)', async ({ page }) => {
    await page.goto('./?e2e=1');
    const chainLines = ['flowchart TD'];
    for (let i = 0; i < 100; i++) {
      chainLines.push(`N${i} --> N${i + 1}`);
    }
    await page.evaluate((text) => {
      (window as any).__studio.setText(text);
    }, chainLines.join('\n'));
    await page.waitForTimeout(400);

    await page.click('#btn-export');
    await page.selectOption('#export-fps', '25');

    let downloadTriggered = false;
    page.on('download', () => {
      downloadTriggered = true;
    });

    await page.click('#export-gif');
    await page.waitForTimeout(200);
    await page.click('#export-cancel');

    await page.waitForTimeout(2000);
    expect(downloadTriggered).toBe(false);

    await expect(page.locator('#export-message')).toContainText('Export cancelled.');
  });

  test('disables GIF export button when diagram is empty', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();
    expect(await page.locator('#export-gif').isDisabled()).toBe(true);
  });
});
