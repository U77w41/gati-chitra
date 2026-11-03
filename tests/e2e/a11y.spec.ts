import { test, expect } from '@playwright/test';
import { contrastRatio } from '../support/contrast';

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
    await expect(pauseBtn).toHaveText('Play');
  });

  test('every form control has a name', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    const checkControls = async () => {
      const controls = await page.locator('input, select, textarea, progress').all();
      for (const ctrl of controls) {
        const id = await ctrl.getAttribute('id');
        const isVisible = await ctrl.isVisible();
        if (!isVisible && id !== 'inline-edit') continue;
        const ariaLabel = await ctrl.getAttribute('aria-label');
        const ariaLabelledBy = await ctrl.getAttribute('aria-labelledby');
        let hasLabel = !!ariaLabel || !!ariaLabelledBy;
        if (!hasLabel && id) {
          hasLabel = (await page.locator(`label[for="${id}"]`).count()) > 0;
        }
        if (!hasLabel) {
          hasLabel = await ctrl.evaluate((el) => !!el.closest('label'));
        }
        expect(hasLabel, `control #${id || 'unnamed'} should have a label`).toBe(true);
      }
    };

    await checkControls();
    await page.click('#btn-export');
    await page.waitForTimeout(100);
    await checkControls();
  });

  test('Enter opens Templates', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);
    const btnTemplates = page.locator('#btn-templates');
    await btnTemplates.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await expect(page.locator('#gallery')).toBeVisible();
  });

  test('sliders show their value', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);
    const speedVal = page.locator('#anim-speed-value');
    await expect(speedVal).toHaveText('1×');
    const speedSlider = page.locator('#anim-speed');
    await speedSlider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(speedVal).toHaveText('1.25×');
  });

  test('diagnostics are buttons', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);
    const source = page.locator('#source');
    await source.fill('flowchart TD\nBROKEN LINE ???\nC --> D');
    await page.waitForTimeout(400);
    const diagBtn = page.locator('#diagnostics button').first();
    await expect(diagBtn).toBeVisible();
    await diagBtn.focus();
    await page.keyboard.press('Enter');
    const sel = await source.evaluate((el: HTMLTextAreaElement) => ({
      start: el.selectionStart,
      value: el.value.slice(0, el.selectionStart),
    }));
    const lineNum = sel.value.split('\n').length;
    expect(lineNum).toBe(2);
  });

  test('control borders meet 3:1', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);

    const getColors = async () => {
      return page.evaluate(() => {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        return {
          border: style.getPropertyValue('--border').trim(),
          bg:
            style.getPropertyValue('--body-background').trim() ||
            style.getPropertyValue('--card-background').trim(),
        };
      });
    };

    const light = await getColors();
    expect(contrastRatio(light.border, light.bg)).toBeGreaterThanOrEqual(3);

    await page.click('#theme-toggle');
    await page.waitForTimeout(100);
    const dark = await getColors();
    expect(contrastRatio(dark.border, dark.bg)).toBeGreaterThanOrEqual(3);
  });
});
