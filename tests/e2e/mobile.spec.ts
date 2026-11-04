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

  test('spreading two fingers raises __studio.getView().zoom', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome');
    await page.goto('./?e2e=1');
    const client = await page.context().newCDPSession(page);

    const initialZoom = await page.evaluate(() => window.__studio!.getView().zoom);
    const canvasBox = (await page.locator('#canvas').boundingBox())!;
    const cx = canvasBox.x + canvasBox.width / 2;
    const cy = canvasBox.y + canvasBox.height / 2;

    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: cx - 20, y: cy, id: 1 },
        { x: cx + 20, y: cy, id: 2 },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: cx - 50, y: cy, id: 1 },
        { x: cx + 50, y: cy, id: 2 },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const newZoom = await page.evaluate(() => window.__studio!.getView().zoom);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test('one finger dragging node A adds a studio:pos A line', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome');
    await page.goto('./?e2e=1');
    const client = await page.context().newCDPSession(page);

    const aCenter = (await page.evaluate(() => window.__studio!.getNodeScreenCenter('A')))!;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: Math.round(aCenter.x), y: Math.round(aCenter.y), id: 1 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: Math.round(aCenter.x) + 30, y: Math.round(aCenter.y) + 30, id: 1 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const textAfterDrag = await page.evaluate(() => window.__studio!.getText());
    expect(textAfterDrag).toMatch(/studio:pos A/);
  });

  test('one finger dragging empty space changes panX and leaves the text unchanged', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome');
    await page.goto('./?e2e=1');
    const client = await page.context().newCDPSession(page);

    const canvasBox = (await page.locator('#canvas').boundingBox())!;
    const textBeforePan = await page.evaluate(() => window.__studio!.getText());
    const initialPanX = await page.evaluate(() => window.__studio!.getView().panX);
    const emptyX = canvasBox.x + 10;
    const emptyY = canvasBox.y + 10;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: emptyX, y: emptyY, id: 1 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: emptyX + 40, y: emptyY, id: 1 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const textAfterPan = await page.evaluate(() => window.__studio!.getText());
    const newPanX = await page.evaluate(() => window.__studio!.getView().panX);
    expect(textAfterPan).toBe(textBeforePan);
    expect(newPanX).not.toBe(initialPanX);
  });

  test('a 600 ms press on A shows #props', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome');
    await page.goto('./?e2e=1');
    const client = await page.context().newCDPSession(page);

    const aCenter = (await page.evaluate(() => window.__studio!.getNodeScreenCenter('A')))!;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: Math.round(aCenter.x), y: Math.round(aCenter.y), id: 1 }],
    });
    await page.waitForTimeout(650);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const props = page.locator('#props');
    await expect(props).toBeVisible();

    const propsBox = (await props.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(Math.abs(propsBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(propsBox.width - viewport.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(propsBox.y + propsBox.height - viewport.height)).toBeLessThanOrEqual(2);

    const propsClose = page.locator('#props-close');
    await expect(propsClose).toBeVisible();
    await propsClose.click();
    await expect(props).toBeHidden();
  });

  test('a double tap on empty space adds a node', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome');
    await page.goto('./?e2e=1');
    const client = await page.context().newCDPSession(page);

    const canvasBox = (await page.locator('#canvas').boundingBox())!;
    const nodesBefore = await page.evaluate(() => window.__studio!.getSummary().nodes.length);
    const dblX = canvasBox.x + 20;
    const dblY = canvasBox.y + 40;
    // tap 1
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: dblX, y: dblY, id: 1 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await page.waitForTimeout(50);
    // tap 2
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: dblX, y: dblY, id: 1 }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect.poll(async () => {
      return await page.evaluate(() => window.__studio!.getSummary().nodes.length);
    }).toBe(nodesBefore + 1);
  });

  test('mobile-safari touchscreen tap on node selects it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-safari');
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    const aCenter = (await page.evaluate(() => window.__studio!.getNodeScreenCenter('A')))!;
    await page.touchscreen.tap(aCenter.x, aCenter.y);
    await expect.poll(async () => {
      return await page.evaluate(() => window.__studio!.getSelection()?.id);
    }).toBe('A');
  });

  test('export on phone shares via navigator.share when available', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome');
    await page.addInitScript(() => {
      (window as any).__shareCalls = [];
      (navigator as any).canShare = () => true;
      (navigator as any).share = async (data: any) => {
        (window as any).__shareCalls.push(data);
      };
    });
    await page.goto('./?e2e=1');

    await page.locator('#btn-export').click();
    const dialog = page.locator('#export-panel');
    await expect(dialog).toBeVisible();

    await page.locator('#export-png').click();

    await expect.poll(async () => {
      return await page.evaluate(() => (window as any).__shareCalls?.length ?? 0);
    }).toBe(1);

    const sharedFile = await page.evaluate(() => {
      const call = (window as any).__shareCalls[0];
      const file = call?.files?.[0];
      return file ? { name: file.name, type: file.type } : null;
    });
    expect(sharedFile?.name).toBe('diagram.png');
  });
});
