import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function checkAxe(page: any, stateName: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  if (results.violations.length > 0) {
    const summary = results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map(n => n.target),
    }));
    console.error(`Axe violations in ${stateName}:`, JSON.stringify(summary, null, 2));
  }
  expect(results.violations, `Expected no accessibility violations in ${stateName}`).toEqual([]);
}

test.describe('Automated accessibility checks (WCAG 2.1 AA)', () => {
  test('the page loaded in the light scheme', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await checkAxe(page, 'light scheme');
  });

  test('the page loaded in the dark scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await checkAxe(page, 'dark scheme');
  });

  test('the Export dialog open', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await page.click('#btn-export');
    await page.waitForTimeout(200);
    await expect(page.locator('#export-panel')).toBeVisible();
    await checkAxe(page, 'Export dialog open');
  });

  test('the Templates dialog open', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await page.click('#btn-templates');
    await page.waitForTimeout(200);
    await expect(page.locator('#gallery')).toBeVisible();
    await checkAxe(page, 'Templates dialog open');
  });

  test('present mode', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await page.click('#btn-present');
    await page.waitForTimeout(200);
    await expect(page.locator('body')).toHaveClass(/present/);
    await checkAxe(page, 'present mode');
  });

  test('a parse error showing', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nInvalid @@@ Line');
    });
    await page.waitForTimeout(300);
    await expect(page.locator('#diagnostics li')).toHaveCount(1);
    await checkAxe(page, 'parse error showing');
  });
});
