import { test, expect } from '@playwright/test';
import { MESSAGES } from '../../src/core/constants';

test.describe('Site Chrome and Scheme', () => {
  test('header renders brand, theme toggle, and nav links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');

    const header = page.locator('.site-header');
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(72);

    await expect(page.locator('.brand-name')).toHaveText('Gati Chitra');
    const brandSvg = page.locator('.brand svg.brand-icon');
    await expect(brandSvg).toBeVisible();

    const hireLink = page.locator('.site-nav a[href="https://u77w41.github.io/resume/"]');
    await expect(hireLink).toContainText('Hire Me');

    const supportLink = page.locator('.site-nav a[href="https://u77w41.github.io/support-my-work/"]');
    await expect(supportLink).toContainText('Support my work');

    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toHaveAttribute('aria-label', /colour scheme/i);

    const installBtn = page.locator('#btn-install');
    await expect(installBtn).toBeVisible();
    await expect(installBtn).toContainText('Install');
    await expect(installBtn.locator('svg.icon-install')).toBeVisible();

    const helpBtn = page.locator('#btn-help');
    await expect(helpBtn).toBeVisible();
    await expect(helpBtn).toContainText('Help');
    await expect(helpBtn.locator('svg.icon-help')).toBeVisible();

    await helpBtn.click();
    await expect(page.locator('#help-dialog')).toBeVisible();
    await page.locator('#help-close').click();
  });

  test('footer renders copyright, meta, and navigation links', async ({ page }) => {
    await page.goto('./?e2e=1');

    const copyright = page.locator('.copyright');
    await expect(copyright).toHaveText(/^© 2026( – \d{4})? Ujjwal Chowdhury$/);

    const footer = page.locator('.site-footer');
    await expect(footer).toContainText('Runs entirely in your browser');

    const footerNav = page.locator('.footer-nav');
    await expect(footerNav.locator('a', { hasText: 'Hire Me' })).toHaveAttribute(
      'href',
      'https://u77w41.github.io/resume/',
    );
    await expect(footerNav.locator('a', { hasText: 'Diff Checker' })).toHaveAttribute(
      'href',
      'https://u77w41.github.io/diff-checker/',
    );
    await expect(footerNav.locator('a', { hasText: 'Anurup' })).toHaveAttribute(
      'href',
      'https://u77w41.github.io/anurup/',
    );

    const sourceLink = footerNav.locator('a', { hasText: 'Source' });
    const sourceHref = await sourceLink.getAttribute('href');
    expect(sourceHref).toMatch(/^https:\/\/github\.com\//);

    const footerSupport = page.locator('[data-testid="support-link-footer"]');
    await expect(footerSupport).toHaveAttribute(
      'href',
      'https://u77w41.github.io/support-my-work/',
    );
    await expect(footerSupport).toContainText('Support my work');
  });

  test('scheme follows system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./?e2e=1');

    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
    const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bgDark).toBe('rgb(48, 48, 48)');

    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./?e2e=1');

    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'light');
    const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bgLight).toBe('rgb(245, 245, 250)');
  });

  test('theme toggle switches scheme and persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./?e2e=1');

    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'light');

    // Click toggle -> switches to dark
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
    const stored1 = await page.evaluate(() => localStorage.getItem('StackColorScheme'));
    expect(stored1).toBe('dark');

    // Click toggle again -> switches back to auto (which evaluates to light)
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'light');
    const stored2 = await page.evaluate(() => localStorage.getItem('StackColorScheme'));
    expect(stored2).toBe('auto');

    // Set to dark in localStorage, reload, verify no flash
    await page.evaluate(() => localStorage.setItem('StackColorScheme', 'dark'));
    await page.reload();
    const schemeOnLoad = await page.evaluate(
      () => document.documentElement.getAttribute('data-scheme'),
    );
    expect(schemeOnLoad).toBe('dark');
  });

  test('canvas follows page scheme when set to Match page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await page.selectOption('#theme', 'auto');

    // Wait until canvas has drawn with light background (255, 255, 255)
    await page.waitForFunction(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      const ctx = c?.getContext('2d');
      if (!ctx || !c || c.width === 0) return false;
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return p[0] === 255 && p[1] === 255 && p[2] === 255 && p[3] === 255;
    });

    // Light scheme canvas corner pixel
    const lightCorner = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const ctx = c.getContext('2d')!;
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return [p[0], p[1], p[2]];
    });
    expect(lightCorner).toEqual([255, 255, 255]);

    // Switch to dark
    await page.click('#theme-toggle');
    await page.waitForFunction(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      const ctx = c?.getContext('2d');
      if (!ctx || !c || c.width === 0) return false;
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return p[0] === 15 && p[1] === 23 && p[2] === 42;
    });

    const darkCorner = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const ctx = c.getContext('2d')!;
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return [p[0], p[1], p[2]];
    });
    expect(darkCorner).toEqual([15, 23, 42]);

    // Explicit Lagoon theme does not change on page scheme toggle
    await page.selectOption('#theme', 'lagoon');
    await page.waitForFunction(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      const ctx = c?.getContext('2d');
      if (!ctx || !c || c.width === 0) return false;
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return !(p[0] === 15 && p[1] === 23 && p[2] === 42);
    });
    const lagoonCorner1 = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const ctx = c.getContext('2d')!;
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return [p[0], p[1], p[2]];
    });

    await page.click('#theme-toggle');
    await page.waitForTimeout(200);
    const lagoonCorner2 = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas')!;
      const ctx = c.getContext('2d')!;
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return [p[0], p[1], p[2]];
    });
    expect(lagoonCorner1).toEqual(lagoonCorner2);
  });

  test('works with storage disabled', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error('Access denied');
      };
      Storage.prototype.setItem = () => {
        throw new Error('Access denied');
      };
    });

    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./?e2e=1');
    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'light');

    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
  });

  test('responsive layout on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto('./?e2e=1');

    const brandBox = await page.locator('.brand').boundingBox();
    const navBox = await page.locator('.site-nav').boundingBox();
    expect(navBox!.y).toBeGreaterThanOrEqual(brandBox!.y + brandBox!.height);

    await expect(page.locator('.site-nav .nav-label').first()).toBeHidden();
    await expect(page.locator('.site-nav .mobile-hide')).toBeHidden();
    await expect(page.locator('[data-testid="support-link-footer"]')).toBeVisible();

    const navBtnBox = await page.locator('.site-nav a.nav-text-desktop').boundingBox();
    expect(Math.round(navBtnBox!.width)).toBe(40);
    expect(Math.round(navBtnBox!.height)).toBe(40);
  });

  test('tools dropdown menu interactions', async ({ page }) => {
    await page.goto('./?e2e=1');

    const toggle = page.locator('#tools-toggle');
    const panel = page.locator('#menu-social-dropdown-tools');

    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Click toggle to open
    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toContainText('Diff Checker');
    await expect(panel).toContainText('ANURUP');

    // Escape closes and restores focus
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();

    // Click to open, then click outside to close
    await toggle.click();
    await expect(panel).toBeVisible();
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(panel).toBeHidden();
  });

  test('present mode hides site header and footer', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(200);

    await page.click('#btn-present');
    await expect(page.locator('body')).toHaveClass(/presenting/);
    await expect(page.locator('.site-header')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('.site-footer')).toBeVisible();
  });

  test('a failed template says so', async ({ page }) => {
    await page.route('**/templates/checkout.mmd', (route) => route.abort());
    await page.goto('./?e2e=1');
    await page.waitForTimeout(200);

    await page.click('#btn-templates');
    await page.locator('.gallery-card', { hasText: 'Order checkout' }).click();
    await expect(page.locator('#message')).toHaveText(MESSAGES.templateFailed);
  });

  test('export footer fits a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./?e2e=1');
    await page.waitForTimeout(200);

    await page.click('#btn-export');
    await page.waitForTimeout(100);

    const buttons = page.locator('#export-panel .dialog-footer button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375 + 1); // 1px tolerance
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(812 + 1);
    }
  });

  test('groups toolbar buttons into File, Edit and View', async ({ page }) => {
    await page.goto('./?e2e=1');
    const fileGroup = page.getByRole('group', { name: 'File' });
    await expect(fileGroup).toBeVisible();
    await expect(fileGroup.locator('#btn-templates')).toBeVisible();

    const editGroup = page.getByRole('group', { name: 'Edit' });
    await expect(editGroup).toBeVisible();

    const viewGroup = page.getByRole('group', { name: 'View' });
    await expect(viewGroup).toBeVisible();
  });

  test('pressing ? opens help dialog listing Undo', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.locator('body').focus();
    await page.keyboard.press('?');
    const dialog = page.locator('#help-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Undo');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('resizable splitter adjusts panel widths and keyboard controls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    const splitter = page.locator('#splitter');
    await expect(splitter).toBeVisible();

    await splitter.focus();
    const initialVal = Number(await splitter.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowRight');
    const newVal = Number(await splitter.getAttribute('aria-valuenow'));
    expect(newVal).toBe(initialVal + 5);

    const textPanel = page.locator('#text-panel');
    const initialBox = await textPanel.boundingBox();
    const splitBox = await splitter.boundingBox();

    await page.mouse.move(splitBox!.x + splitBox!.width / 2, splitBox!.y + splitBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(splitBox!.x + 100, splitBox!.y + splitBox!.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(200);

    const widenedBox = await textPanel.boundingBox();
    expect(widenedBox!.width).toBeGreaterThan(initialBox!.width + 50);

    await page.reload();
    await page.waitForTimeout(200);
    const reloadedBox = await page.locator('#text-panel').boundingBox();
    expect(reloadedBox!.width).toBeGreaterThan(initialBox!.width + 50);
  });
});
