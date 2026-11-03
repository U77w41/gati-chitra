import { test, expect } from '@playwright/test';

test.describe('Branding and Meta Tags', () => {
  test('page head contains correct title, meta, canonical, and favicon links', async ({ page }) => {
    await page.goto('/?e2e=1');

    await expect(page).toHaveTitle('Gati-chitra · Ujjwal Chowdhury');

    const ogSiteName = page.locator('meta[property="og:site_name"]');
    await expect(ogSiteName).toHaveAttribute('content', 'Ujjwal Chowdhury');

    const lightThemeMeta = page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    await expect(lightThemeMeta).toHaveAttribute('content', '#f5f5fa');

    const darkThemeMeta = page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    await expect(darkThemeMeta).toHaveAttribute('content', '#303030');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://u77w41.github.io/gati-chitra/');

    // Check SVG favicon
    const svgFavicon = page.locator('link[rel="icon"][type="image/svg+xml"]');
    const svgFaviconHref = await svgFavicon.getAttribute('href');
    expect(svgFaviconHref).toBeTruthy();
    const svgRes = await page.request.get(svgFaviconHref!);
    expect(svgRes.status()).toBe(200);
    expect(svgRes.headers()['content-type']).toContain('image/svg+xml');

    // Check ICO favicon
    const icoFavicon = page.locator('link[rel="alternate icon"]');
    const icoFaviconHref = await icoFavicon.getAttribute('href');
    expect(icoFaviconHref).toBeTruthy();
    const icoRes = await page.request.get(icoFaviconHref!);
    expect(icoRes.status()).toBe(200);

    // Check apple-touch-icon
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    const appleIconHref = await appleIcon.getAttribute('href');
    expect(appleIconHref).toBeTruthy();
    const appleRes = await page.request.get(appleIconHref!);
    expect(appleRes.status()).toBe(200);

    // Verify no unreplaced %VITE_ tokens
    const content = await page.content();
    expect(content).not.toContain('%VITE_');
  });
});
