import { test, expect } from '@playwright/test';

test.describe('PNG export', () => {
  test('exports PNG with correct filename, IHDR dimensions, scale and mode', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    // Open export panel
    await page.click('#btn-export');
    const panel = page.locator('#export-panel');
    await expect(panel).toBeVisible();

    // Export 1x content
    const [download1] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-png'),
    ]);
    expect(download1.suggestedFilename()).toBe('diagram.png');

    const stream1 = await download1.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream1) chunks.push(Buffer.from(chunk));
    const buf1 = Buffer.concat(chunks);

    // PNG signature 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < 8; i++) {
      expect(buf1[i]).toBe(pngSignature[i]);
    }

    // IHDR width and height
    const w1 = buf1.readUInt32BE(16);
    const h1 = buf1.readUInt32BE(20);
    const expectedSize1 = await page.evaluate(() => (window as any).__studio.getExportSize('content', 1));
    expect(w1).toBe(expectedSize1.width);
    expect(h1).toBe(expectedSize1.height);

    // Scale 2x
    await page.selectOption('#export-scale', '2');
    const [download2] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-png'),
    ]);
    const stream2 = await download2.createReadStream();
    const chunks2: Buffer[] = [];
    for await (const chunk of stream2) chunks2.push(Buffer.from(chunk));
    const buf2 = Buffer.concat(chunks2);
    const w2 = buf2.readUInt32BE(16);
    const h2 = buf2.readUInt32BE(20);
    expect(Math.abs(w2 - w1 * 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(h2 - h1 * 2)).toBeLessThanOrEqual(1);

    // Slide mode 1x and 2x
    await page.selectOption('#export-mode', 'slide');
    await page.selectOption('#export-scale', '1');
    const [downloadSlide1] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-png'),
    ]);
    const streamSlide1 = await downloadSlide1.createReadStream();
    const chunksS1: Buffer[] = [];
    for await (const chunk of streamSlide1) chunksS1.push(Buffer.from(chunk));
    const bufS1 = Buffer.concat(chunksS1);
    expect(bufS1.readUInt32BE(16)).toBe(1280);
    expect(bufS1.readUInt32BE(20)).toBe(720);

    await page.selectOption('#export-scale', '2');
    const [downloadSlide2] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-png'),
    ]);
    const streamSlide2 = await downloadSlide2.createReadStream();
    const chunksS2: Buffer[] = [];
    for await (const chunk of streamSlide2) chunksS2.push(Buffer.from(chunk));
    const bufS2 = Buffer.concat(chunksS2);
    expect(bufS2.readUInt32BE(16)).toBe(2560);
    expect(bufS2.readUInt32BE(20)).toBe(1440);
  });

  test('supports transparent background and custom filename', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await page.fill('#export-name', 'My Flow');
    await page.check('#export-transparent');

    const [downloadTrans] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-png'),
    ]);
    expect(downloadTrans.suggestedFilename()).toBe('my-flow.png');

    const stream = await downloadTrans.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const base64 = Buffer.concat(chunks).toString('base64');

    const alphaTrans = await page.evaluate(async (b64) => {
      return new Promise<number>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
          resolve(pixel[3]);
        };
        img.src = 'data:image/png;base64,' + b64;
      });
    }, base64);
    expect(alphaTrans).toBe(0);

    // Opaque background
    await page.uncheck('#export-transparent');
    const [downloadOpaque] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-png'),
    ]);
    const streamOpaque = await downloadOpaque.createReadStream();
    const chunksOp: Buffer[] = [];
    for await (const chunk of streamOpaque) chunksOp.push(Buffer.from(chunk));
    const base64Op = Buffer.concat(chunksOp).toString('base64');

    const alphaOpaque = await page.evaluate(async (b64) => {
      return new Promise<number>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
          resolve(pixel[3]);
        };
        img.src = 'data:image/png;base64,' + b64;
      });
    }, base64Op);
    expect(alphaOpaque).toBe(255);
  });

  test('disables export when diagram is empty (Review Focus 4)', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();
    await expect(page.locator('#export-message')).toContainText('Nothing to export. Add a node first.');
    expect(await page.locator('#export-png').isDisabled()).toBe(true);
  });
});
