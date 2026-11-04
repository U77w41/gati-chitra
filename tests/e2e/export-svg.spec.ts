import { test, expect } from '@playwright/test';

test.describe('SVG export', () => {
  test('downloads diagram.svg and parses as valid XML matching export size', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    // Open export panel
    await page.click('#btn-export');
    const panel = page.locator('#export-panel');
    await expect(panel).toBeVisible();

    // Export SVG
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-svg'),
    ]);
    expect(download.suggestedFilename()).toBe('diagram.svg');

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const svgText = Buffer.concat(chunks).toString('utf-8');

    // Parse in page
    const parseResult = await page.evaluate((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) return { ok: false, error: parserError.textContent };
      const root = doc.documentElement;
      return {
        ok: true,
        width: parseInt(root.getAttribute('width') || '0', 10),
        height: parseInt(root.getAttribute('height') || '0', 10),
      };
    }, svgText);

    expect(parseResult.ok).toBe(true);
    const expectedSize = await page.evaluate(() =>
      (window as any).__studio.getExportSize('content', 1),
    );
    expect(parseResult.width).toBe(expectedSize.width);
    expect(parseResult.height).toBe(expectedSize.height);
  });

  test('renders SVG visually with >100 non-background pixels', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-svg'),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const svgText = Buffer.concat(chunks).toString('utf-8');

    const renderedPixelCount = await page.evaluate(async (svg) => {
      return new Promise<number>((resolve, reject) => {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          let nonBg = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r < 240 || g < 240 || b < 240) {
              nonBg++;
            }
          }
          resolve(nonBg);
        };
        img.onerror = (e) => reject(new Error('Failed to load SVG image: ' + e));
        img.src = url;
      });
    }, svgText);

    expect(renderedPixelCount).toBeGreaterThan(100);
  });

  test('supports slide mode and transparent background', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await page.selectOption('#export-mode', 'slide');
    await page.check('#export-transparent');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-svg'),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const svgText = Buffer.concat(chunks).toString('utf-8');

    expect(svgText).toContain('width="1280" height="720"');
    expect(svgText).not.toContain('fill="#ffffff"');
  });

  test('escapes special characters in XML', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA["x & y < z"]');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-svg'),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const svgText = Buffer.concat(chunks).toString('utf-8');

    expect(svgText).toContain('x &amp; y &lt; z');

    const hasParseError = await page.evaluate((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      return doc.querySelector('parsererror') !== null;
    }, svgText);
    expect(hasParseError).toBe(false);
  });

  test('disables SVG export when diagram is empty', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();
    await expect(page.locator('#export-message')).toContainText('Nothing to export');
    expect(await page.locator('#export-svg').isDisabled()).toBe(true);
  });

  test('copies SVG to clipboard on Chromium', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permission tests are Chromium only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();

    await page.click('#export-copy-svg');
    await expect(page.locator('#export-message')).toHaveText('Copied to the clipboard.');

    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text.startsWith('<svg')).toBe(true);
  });
});
