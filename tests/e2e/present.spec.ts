import { test, expect } from '@playwright/test';

test.describe('Present mode', () => {
  test('navigates through presentation steps and exits on Escape', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B\nB-->C');
    });
    await page.waitForTimeout(300);

    // Click present button
    await page.click('#btn-present');
    await expect(page.locator('body')).toHaveClass(/presenting/);

    const step0 = await page.evaluate(() => (window as any).__studio.getPresentStep());
    expect(step0).toBe(0);

    // Capture canvas at step 0
    const pixels0 = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const ctx = c.getContext('2d')!;
      return Array.from(ctx.getImageData(0, 0, 50, 50).data);
    });

    // Press ArrowRight to go to step 1
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    const step1 = await page.evaluate(() => (window as any).__studio.getPresentStep());
    expect(step1).toBe(1);

    // Press Home to return to step 0
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => (window as any).__studio.getPresentStep())).toBe(0);

    // Press Escape to exit
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/presenting/);
    expect(await page.evaluate(() => (window as any).__studio.getPresentStep())).toBeNull();
  });

  test('refuses to start present mode on empty diagram', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-present');
    await expect(page.locator('body')).not.toHaveClass(/presenting/);
    await expect(page.locator('#message')).toContainText(
      'Nothing to present. Add a node first.',
    );
  });

  test('does not trigger present shortcut when typing in source textarea', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    const source = page.locator('#source');
    await source.focus();
    await page.keyboard.press('p');

    await expect(page.locator('body')).not.toHaveClass(/presenting/);
    expect(await source.inputValue()).toContain('p');
  });
});
