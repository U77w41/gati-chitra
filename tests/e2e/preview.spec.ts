import { test, expect } from '@playwright/test';

test.describe('Live preview and app shell', () => {
  test('loads page with sample text and rendered canvas', async ({ page }) => {
    await page.goto('/?e2e=1');

    const source = page.locator('#source');
    await expect(source).not.toBeEmpty();

    const nonBgPixels = await page.evaluate(() => {
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
        // Background is white #ffffff
        if (a > 0 && (r < 250 || g < 250 || b < 250)) {
          nonBg++;
        }
      }
      return nonBg;
    });

    expect(nonBgPixels).toBeGreaterThan(100);
  });

  test('updates summary and diagram when text is set via studio API', async ({ page }) => {
    await page.goto('/?e2e=1');

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart LR\nX-->Y');
    });
    await page.waitForTimeout(400);

    const summary = await page.evaluate(() => (window as any).__studio.getSummary());
    expect(summary).toEqual({ nodes: ['X', 'Y'], edges: 1, ok: true });
  });

  test('displays diagnostics on invalid syntax while preserving last good picture', async ({ page }) => {
    await page.goto('/?e2e=1');

    await page.evaluate(() => {
      (window as any).__studio.setText('sequenceDiagram');
    });
    await page.waitForTimeout(400);

    const diag = page.locator('#diagnostics li');
    await expect(diag).toContainText("Line 1: Only flowchart diagrams are supported");

    const nonBgPixels = await page.evaluate(() => {
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
        if (a > 0 && (r < 250 || g < 250 || b < 250)) {
          nonBg++;
        }
      }
      return nonBg;
    });

    expect(nonBgPixels).toBeGreaterThan(100);
  });

  test('autosaves text after 800ms and restores on reload', async ({ page }) => {
    await page.goto('/?e2e=1');

    const testText = 'flowchart TD\nSavedNode-->B';
    await page.evaluate((t) => {
      (window as any).__studio.setText(t);
    }, testText);

    await page.waitForTimeout(800);
    await page.reload();

    const source = page.locator('#source');
    await expect(source).toHaveValue(testText);
  });

  test('handles storage failure safely (Review Focus 5)', async ({ context, page }) => {
    await context.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceeded');
      };
    });

    await page.goto('/?e2e=1');
    const source = page.locator('#source');
    await source.fill('flowchart TD\nUnsaved-->Test');

    await page.waitForTimeout(1000);
    const msg = page.locator('#message');
    await expect(msg).toContainText('Browser storage is unavailable, so autosave is off.');
  });

  test('animation updates frames when active and freezes when paused', async ({ page }) => {
    await page.goto('/?e2e=1');

    const snap1 = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      return c?.toDataURL();
    });
    await page.waitForTimeout(500);
    const snap2 = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      return c?.toDataURL();
    });
    expect(snap1).not.toEqual(snap2);

    await page.click('#anim-pause');
    await page.waitForTimeout(100);
    const snapPaused1 = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      return c?.toDataURL();
    });
    await page.waitForTimeout(300);
    const snapPaused2 = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      return c?.toDataURL();
    });
    expect(snapPaused1).toEqual(snapPaused2);
  });

  test('wheel zoom over canvas changes view zoom', async ({ page }) => {
    await page.goto('/?e2e=1');

    const initialZoom = await page.evaluate(() => (window as any).__studio.getView().zoom);

    const canvas = page.locator('#canvas');
    await canvas.dispatchEvent('wheel', { deltaY: -200, clientX: 200, clientY: 200 });

    const newZoom = await page.evaluate(() => (window as any).__studio.getView().zoom);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test('keeps page responsive with large input', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/?e2e=1');
    const longChain = ['flowchart TD'];
    for (let i = 0; i < 40; i++) {
      longChain.push(`  Node${i} --> Node${i + 1}`);
    }
    const longText = longChain.join('\n');

    await page.evaluate((t) => (window as any).__studio.setText(t), longText);
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });
});
