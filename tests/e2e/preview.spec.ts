import { test, expect, type Page } from '@playwright/test';
import { editorText, setEditorText } from '../support/editor';

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
      // Background is white #ffffff
      if (a > 0 && (r < 250 || g < 250 || b < 250)) {
        nonBg++;
      }
    }
    return nonBg;
  });
}

test.describe('Live preview and app shell', () => {
  test('loads page with sample text and rendered canvas', async ({ page }) => {
    await page.goto('./?e2e=1');

    expect(await editorText(page)).not.toBe('');

    await expect.poll(() => nonBgPixels(page)).toBeGreaterThan(100);
  });

  test('updates summary and diagram when text is set via studio API', async ({ page }) => {
    await page.goto('./?e2e=1');

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart LR\nX-->Y');
    });
    await page.waitForTimeout(400);

    const summary = await page.evaluate(() => (window as any).__studio.getSummary());
    expect(summary).toEqual({ nodes: ['X', 'Y'], edges: 1, ok: true });
  });

  test('displays diagnostics on invalid syntax while preserving last good picture', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      (window as any).__studio.setText('pie title Pets');
    });
    await page.waitForTimeout(400);

    const diag = page.locator('#diagnostics li');
    await expect(diag).toContainText('Line 1: Pie chart is not supported yet');

    // The good picture is redrawn asynchronously, so wait for it to appear.
    await expect.poll(() => nonBgPixels(page)).toBeGreaterThan(100);
  });

  test('autosaves text after 800ms and restores on reload', async ({ page }) => {
    await page.goto('./?e2e=1');

    const testText = 'flowchart TD\nSavedNode-->B';
    await page.evaluate((t) => {
      (window as any).__studio.setText(t);
    }, testText);

    await page.waitForTimeout(800);
    await page.reload();

    expect(await editorText(page)).toBe(testText);
  });

  test('handles storage failure safely (Review Focus 5)', async ({ context, page }) => {
    await context.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceeded');
      };
    });

    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\nUnsaved-->Test');

    await page.waitForTimeout(1000);
    const msg = page.locator('#message');
    await expect(msg).toContainText('Browser storage is unavailable, so autosave is off.');
  });

  test('animation updates frames when active and freezes when paused', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit canvas readback is blank under CI CPU contention (see handoff.md section 6)');
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

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

  test('build animation resumes from the paused frame instead of skipping ahead', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit canvas readback is blank under CI CPU contention (see handoff.md section 6)');
    await page.goto('./?e2e=1');
    await page.selectOption('#anim-style', 'build');
    await page.waitForTimeout(300);

    await page.click('#anim-pause');
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas')!;
      (window as any).__pausedPixels = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    });
    // Half of the 4 s loop: before the fix, Play jumped this far into the build.
    await page.waitForTimeout(2000);
    await page.click('#anim-pause');
    await page.waitForTimeout(30);

    const changedShare = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const now = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      const before = (window as any).__pausedPixels as Uint8ClampedArray;
      let changed = 0;
      for (let i = 0; i < now.length; i += 4) {
        if (Math.abs(now[i] - before[i]) + Math.abs(now[i + 1] - before[i + 1]) + Math.abs(now[i + 2] - before[i + 2]) > 30) changed++;
      }
      return changed / (now.length / 4);
    });
    // Measured: under 0.001 with the fix, about 0.011 when Play skipped ahead.
    expect(changedShare).toBeLessThan(0.004);
  });

  test('wheel zoom over canvas changes view zoom', async ({ page }) => {
    await page.goto('./?e2e=1');

    const initialZoom = await page.evaluate(() => (window as any).__studio.getView().zoom);

    const canvas = page.locator('#canvas');
    await canvas.dispatchEvent('wheel', { deltaY: -200, clientX: 200, clientY: 200 });

    const newZoom = await page.evaluate(() => (window as any).__studio.getView().zoom);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test('keeps page responsive with large input', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('./?e2e=1');
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
