import { test, expect } from '@playwright/test';

test.describe('Performance budgets', () => {
  test('renders 100-node binary tree under 33ms per frame in traffic style', async ({
    page,
  }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    const treeLines = ['flowchart TD'];
    for (let n = 1; n <= 100; n++) {
      if (2 * n <= 100) treeLines.push(`N${n}-->N${2 * n}`);
      if (2 * n + 1 <= 100) treeLines.push(`N${n}-->N${2 * n + 1}`);
    }
    const treeText = treeLines.join('\n');

    await page.evaluate((text) => {
      (window as any).__studio.setText(text);
    }, treeText);
    await page.waitForTimeout(300);

    await page.locator('#anim-style').selectOption('traffic');
    await page.waitForTimeout(100);

    const avgMs = await page.evaluate(async () => {
      return (window as any).__studio.measureFrames(30);
    });

    expect(avgMs).toBeLessThan(33);
  });

  test('idle canvas does not repaint', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await page.locator('#anim-pause').click();
    await page.waitForTimeout(300);

    const countBefore = await page.evaluate(() => (window as any).__studio.getDrawCount());
    await page.waitForTimeout(500);
    const countAfter = await page.evaluate(() => (window as any).__studio.getDrawCount());

    expect(countAfter).toBe(countBefore);
  });

  test('parses and lays out 300-node chain in under 3 seconds', async ({
    page,
  }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    const chainLines = ['flowchart TD'];
    for (let n = 0; n < 299; n++) {
      chainLines.push(`N${n}-->N${n + 1}`);
    }
    const chainText = chainLines.join('\n');

    const startTime = Date.now();
    await page.evaluate((text) => {
      (window as any).__studio.setText(text);
    }, chainText);

    await expect
      .poll(
        async () => {
          return page.evaluate(() => (window as any).__studio.getSummary()?.nodes?.length);
        },
        { timeout: 3000 },
      )
      .toBe(300);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(3000);
  });
});
