import { test, expect } from '@playwright/test';

test.describe('Accessibility and reduced motion', () => {
  test('satisfies basic accessibility requirements', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    // html lang="en"
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');

    // canvas role and aria-label
    const canvas = page.locator('#canvas');
    await expect(canvas).toHaveAttribute('role', 'img');
    const ariaLabel = await canvas.getAttribute('aria-label');
    expect(ariaLabel?.startsWith('Flowchart with')).toBe(true);

    // every button has an accessible name
    const buttons = await page.locator('button').all();
    for (const b of buttons) {
      const name = await b.evaluate((el) => {
        return (
          el.getAttribute('aria-label') ||
          el.textContent?.trim() ||
          (el as HTMLInputElement).value ||
          ''
        );
      });
      expect(name.length).toBeGreaterThan(0);
    }

    // Tab from page start reaches #btn-new first
    await page.keyboard.press('Tab');
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('btn-new');
  });

  test('dialog focus management: moves focus inside on open and returns on close', async ({
    page,
  }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    const btnExport = page.locator('#btn-export');
    await btnExport.focus();
    await btnExport.click();

    const dialog = page.locator('#export-panel');
    await expect(dialog).toBeVisible();

    // Check focus is inside dialog
    const isFocusInside = await page.evaluate(() => {
      const d = document.querySelector('#export-panel');
      return d?.contains(document.activeElement);
    });
    expect(isFocusInside).toBe(true);

    // Close dialog
    await page.click('#export-close');
    await expect(dialog).toBeHidden();

    // Focus returns to #btn-export
    const returnedFocusId = await page.evaluate(() => document.activeElement?.id);
    expect(returnedFocusId).toBe('btn-export');
  });

  test('respects prefers-reduced-motion media query', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    const pauseBtn = page.locator('#anim-pause');
    await expect(pauseBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(pauseBtn).toHaveText('Play');
  });
});
