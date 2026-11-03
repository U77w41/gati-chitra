import { test, expect } from '@playwright/test';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test.describe('Share links and templates', () => {
  test('shares diagram and loads it via URL hash without overwriting storage until edited', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    // Initial state: autosave will save sample
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    // Wait for autosave (500ms debounce)
    await page.waitForTimeout(700);

    // Now change to P-->Q and share
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart LR\nP-->Q');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-share');

    const shareUrl = await expect
      .poll(async () => {
        const shareInput = page.locator('#share-url');
        if (await shareInput.isVisible()) {
          return shareInput.inputValue();
        }
        return page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
      })
      .toContain('#v1=');

    const resolvedUrl = await page.evaluate(async () => {
      const input = document.querySelector<HTMLInputElement>('#share-url');
      if (input && input.value) return input.value;
      return navigator.clipboard.readText();
    });

    // Open shared URL in a new page with previously autosaved diagram A-->B
    const page2 = await context.newPage();
    await page2.addInitScript(() => {
      localStorage.setItem('gati-chitra:v1:doc', 'flowchart TD\nA-->B');
    });
    await page2.goto(resolvedUrl);
    await page2.waitForTimeout(300);

    expect(await page2.locator('#source').inputValue()).toBe('flowchart LR\nP-->Q');
    expect(page2.url()).not.toContain('#');

    // Reload page2: should restore autosaved diagram (A-->B), not the shared one
    await page2.reload();
    await page2.waitForTimeout(300);
    expect(await page2.locator('#source').inputValue()).toBe('flowchart TD\nA-->B');
  });

  test('shows error message on invalid share link and falls back to default', async ({ page }) => {
    await page.goto('/?e2e=1#v1=!!!');
    await page.waitForTimeout(300);

    await expect(page.locator('#message')).toContainText(
      'The share link could not be read. Showing the sample diagram.',
    );
    expect(await page.locator('#source').inputValue()).not.toBe('');
  });

  test('opens template gallery and loads selected template', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    await page.click('#btn-templates');
    const gallery = page.locator('#gallery');
    await expect(gallery).toBeVisible();

    const buttons = gallery.locator('.template');
    await expect(buttons).toHaveCount(5);

    await gallery.getByText('Data pipeline').click();
    await expect(gallery).toBeHidden();

    const sourceText = await page.locator('#source').inputValue();
    expect(sourceText).toContain('subgraph ingest');
  });

  test('supports uncompressed fallback when CompressionStream is unavailable (Review Focus 5)', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      // @ts-ignore
      delete window.CompressionStream;
      // @ts-ignore
      delete window.DecompressionStream;
    });

    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nPlain-->Fallback');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-share');

    await expect
      .poll(async () => {
        const shareInput = page.locator('#share-url');
        if (await shareInput.isVisible()) {
          return shareInput.inputValue();
        }
        return page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
      })
      .toContain('#v1p=');

    const shareUrl = await page.evaluate(async () => {
      const input = document.querySelector<HTMLInputElement>('#share-url');
      if (input && input.value) return input.value;
      return navigator.clipboard.readText();
    });

    const page2 = await context.newPage();
    await page2.addInitScript(() => {
      // @ts-ignore
      delete window.CompressionStream;
      // @ts-ignore
      delete window.DecompressionStream;
    });
    await page2.goto(shareUrl);
    await page2.waitForTimeout(300);

    expect(await page2.locator('#source').inputValue()).toBe('flowchart TD\nPlain-->Fallback');
  });

  test('shows error when diagram is too large for share link', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    // 15000 random characters using seeded PRNG so it cannot compress under SHARE.maxUrlChars
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const rng = mulberry32(7);
    let rand = '';
    for (let i = 0; i < 15000; i++) {
      rand += chars[Math.floor(rng() * chars.length)];
    }
    await page.evaluate((text) => {
      (window as any).__studio.setText(text);
    }, `flowchart TD\nA["${rand}"]`);
    await page.waitForTimeout(400);

    await page.click('#btn-share');
    await expect(page.locator('#message')).toContainText(
      'This diagram is too large for a link. Save it as a .mmd file instead.',
    );
  });
});
