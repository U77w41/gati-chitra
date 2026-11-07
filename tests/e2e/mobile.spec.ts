import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Mobile phone layout', () => {
  test('tabs, toolbar, panels, and accessibility on mobile', async ({ page }) => {
    await page.goto('./?e2e=1');

    // the tabs are visible, and the Canvas tab is selected
    const tabs = page.locator('#view-tabs');
    await expect(tabs).toBeVisible();
    // The phone tabs are named Canvas and Editor.
    const tabDiagram = page.locator('#view-tabs button[role="tab"]', { hasText: 'Canvas' });
    const tabText = page.locator('#view-tabs button[role="tab"]', { hasText: 'Editor' });
    await expect(page.locator('#view-tabs [role="tab"]')).toHaveText(['Canvas', 'Editor']);
    await expect(tabDiagram).toHaveAttribute('aria-selected', 'true');
    await expect(tabText).toHaveAttribute('aria-selected', 'false');

    // tapping Text shows the editor and hides the canvas
    await tabText.click();
    await expect(tabText).toHaveAttribute('aria-selected', 'true');
    await expect(tabDiagram).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#text-panel')).toBeVisible();
    await expect(page.locator('#canvas-panel')).toBeHidden();
    // New, Open and Templates sit in the Editor tab's panel bar on phones.
    await expect(page.locator('#text-panel-bar #btn-new')).toBeVisible();
    await expect(page.locator('#text-panel-bar #btn-open')).toBeVisible();
    await expect(page.locator('#text-panel-bar #btn-templates')).toBeVisible();
    // Wrap text sits in the editor's bottom-right corner on phones too.
    const sourceBox = (await page.locator('#source').boundingBox())!;
    const wrapBox = (await page.locator('#source-corner label').boundingBox())!;
    expect(wrapBox.x + wrapBox.width).toBeLessThanOrEqual(sourceBox.x + sourceBox.width);
    expect(wrapBox.y + wrapBox.height).toBeLessThanOrEqual(sourceBox.y + sourceBox.height);

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

    // There is no toolbar row: New and Open sit in the Editor tab's panel bar, Save .mmd in the
    // Canvas tab's Animation & theme row, and Fit, Auto-layout and Present on the diagram.
    await expect(page.locator('#toolbar')).toHaveCount(0);
    await expect(page.locator('#btn-more')).toHaveCount(0);
    await expect(page.locator('.dock-header #btn-save-mmd')).toBeVisible();
    await expect(page.locator('#canvas-tools #btn-fit')).toBeVisible();
    const canvasBox = (await page.locator('#canvas').boundingBox())!;
    const fitBox = (await page.locator('#btn-fit').boundingBox())!;
    expect(fitBox.y).toBeGreaterThanOrEqual(canvasBox.y);
    expect(fitBox.x + fitBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width);
    // Export sits at the right of the Animation & theme row on phones too.
    await expect(page.locator('.dock-header #btn-export')).toBeVisible();
    // Undo sits in the canvas's top-left corner on phones too.
    await expect(page.locator('#canvas-history #btn-undo')).toBeVisible();
    const undoBox = (await page.locator('#btn-undo').boundingBox())!;
    expect(undoBox.x).toBeGreaterThanOrEqual(canvasBox.x);
    expect(undoBox.y).toBeGreaterThanOrEqual(canvasBox.y);
    // Grid sits in the canvas's bottom-left corner on phones too.
    const gridBox = (await page.locator('#canvas-corner label').boundingBox())!;
    expect(gridBox.x).toBeGreaterThanOrEqual(canvasBox.x);
    expect(gridBox.y + gridBox.height).toBeLessThanOrEqual(canvasBox.y + canvasBox.height);

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
    // Below the Undo/Redo group in the top-left corner, so the taps land on bare canvas.
    const dblX = canvasBox.x + 20;
    const dblY = canvasBox.y + 80;
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x!, y!)?.id, [dblX, dblY])).toBe('canvas');
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

  test('a long script scrolls inside the Editor tab instead of growing the page', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.locator('#view-tabs button[role="tab"]', { hasText: 'Editor' }).click();
    const panelHeight = () => page.evaluate(() => document.querySelector('#text-panel')!.getBoundingClientRect().height);
    const before = await panelHeight();

    const lines = ['flowchart TD'];
    for (let i = 0; i < 200; i++) lines.push(`  N${i}[Step number ${i}] --> N${i + 1}`);
    await page.evaluate((t) => (window as any).__studio.setText(t), lines.join('\n'));
    await page.waitForTimeout(400);

    expect(Math.abs((await panelHeight()) - before)).toBeLessThanOrEqual(1);
    const fits = await page.evaluate(() => {
      const scroller = document.querySelector('#source .cm-scroller')!;
      const panel = document.querySelector('#text-panel')!.getBoundingClientRect();
      return { scrolls: scroller.scrollHeight > scroller.clientHeight + 1, panel: panel.height, window: window.innerHeight };
    });
    expect(fits.scrolls).toBe(true);
    expect(fits.panel).toBeLessThanOrEqual(fits.window);
  });

  test('adding a node from the Nodes tab shows it on the diagram', async ({ page }) => {
    await page.goto('./?e2e=1');
    const count = () => page.evaluate(() => window.__studio!.getSummary().nodes.length);
    await expect.poll(count).toBeGreaterThan(0);
    const before = await count();
    await page.locator('#tab-text').click();
    await page.locator('#tab-nodes').click();
    await page.locator('#node-palette button', { hasText: /^Rectangle$/ }).click();
    await expect(page.locator('#tab-diagram')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#canvas')).toBeVisible();
    await expect.poll(count).toBe(before + 1);
  });

  test('the header stays in the page on phones', async ({ page }) => {
    await page.goto('./?e2e=1');
    // On phones it scrolls with the page instead of sliding away, so scrolling to the top shows it whole.
    const position = await page.locator('#site-header').evaluate((el) => getComputedStyle(el).position);
    expect(position).not.toBe('fixed');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('#site-header')).toBeInViewport({ ratio: 1 });
    expect((await page.locator('#site-header').boundingBox())!.y).toBeGreaterThanOrEqual(0);
  });
});
