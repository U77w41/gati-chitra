import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Mobile phone layout', () => {
  test('tabs, toolbar, panels, and accessibility on mobile', async ({ page }) => {
    await page.goto('./?e2e=1');

    // the tabs are visible, and the Diagram tab is selected
    const tabs = page.locator('#view-tabs');
    await expect(tabs).toBeVisible();
    const tabDiagram = page.locator('#view-tabs button[role="tab"]', { hasText: 'Diagram' });
    const tabText = page.locator('#view-tabs button[role="tab"]', { hasText: 'Text' });
    await expect(tabDiagram).toHaveAttribute('aria-selected', 'true');
    await expect(tabText).toHaveAttribute('aria-selected', 'false');

    // tapping Text shows the editor and hides the canvas
    await tabText.click();
    await expect(tabText).toHaveAttribute('aria-selected', 'true');
    await expect(tabDiagram).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#text-panel')).toBeVisible();
    await expect(page.locator('#canvas-panel')).toBeHidden();

    // switch back to diagram
    await tabDiagram.click();
    await expect(page.locator('#canvas-panel')).toBeVisible();
    await expect(page.locator('#text-panel')).toBeHidden();

    // document.scrollingElement.scrollWidth <= innerWidth
    const noHorizontalScroll = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      return el.scrollWidth <= window.innerWidth;
    });
    expect(noHorizontalScroll).toBe(true);

    // the toolbar's height is 100 px or less
    const toolbar = page.locator('#toolbar');
    const toolbarBox = await toolbar.boundingBox();
    expect(toolbarBox).toBeTruthy();
    expect(toolbarBox!.height).toBeLessThanOrEqual(100);

    // More opens a menu that contains "Templates"
    const btnMore = page.locator('#btn-more');
    await expect(btnMore).toBeVisible();
    await btnMore.click();
    const moreMenu = page.locator('#more-menu');
    await expect(moreMenu).toBeVisible();
    await expect(moreMenu).toContainText('Templates');

    // axe on this layout finds no violations
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
