import { test, expect, type Page } from '@playwright/test';
import { setEditorText } from '../support/editor';
import { expectHoverName } from '../support/icons';

function longScript(lines: number): string {
  const out = ['flowchart TD'];
  for (let i = 0; i < lines; i++) out.push(`  N${i}[Step number ${i}] --> N${i + 1}`);
  return out.join('\n');
}

async function heights(page: Page) {
  return page.evaluate(() => {
    const h = (sel: string) => document.querySelector(sel)!.getBoundingClientRect().height;
    const scroller = document.querySelector('#source .cm-scroller')!;
    const main = document.querySelector('#main')!.getBoundingClientRect();
    return {
      page: document.documentElement.scrollHeight,
      window: window.innerHeight,
      mainBottom: main.bottom,
      textPanel: h('#text-panel'),
      canvas: h('#canvas'),
      editorScrolls: scroller.scrollHeight > scroller.clientHeight + 1,
    };
  });
}

test.describe('Workspace fits the window', () => {
  test('a long script scrolls inside the editor instead of growing the page or the canvas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    const before = await heights(page);

    await setEditorText(page, longScript(200));
    await page.waitForTimeout(400);
    const after = await heights(page);

    expect(after.page).toBeLessThanOrEqual(after.window);
    expect(after.mainBottom).toBeLessThanOrEqual(after.window + 1);
    expect(Math.abs(after.textPanel - before.textPanel)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.canvas - before.canvas)).toBeLessThanOrEqual(1);
    expect(after.editorScrolls).toBe(true);
  });

  test('the header and workspace fill a 1280 by 800 window with no footer below', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    const h = await heights(page);

    expect(h.page).toBeLessThanOrEqual(h.window);
    await expect(page.locator('.site-header')).toBeInViewport();
    // The workspace runs to the bottom edge of the window; nothing sits under it.
    expect(h.mainBottom).toBeGreaterThanOrEqual(h.window - 1);
    // The diagram is the main thing on the page, so it gets most of the workspace height.
    expect(h.canvas).toBeGreaterThanOrEqual(0.6 * h.textPanel);
  });

  test('selecting a node shows its properties without resizing the canvas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.click('#btn-fit');
    const canvasBox = async () => (await page.locator('#canvas').boundingBox())!;
    const before = await canvasBox();

    const center = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(center.x, center.y);
    await expect(page.locator('#props')).toBeVisible();

    const after = await canvasBox();
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
  });

  test('the animation and theme controls hide and show, and the choice is remembered', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    const toggle = page.locator('#dock-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#theme')).toBeVisible();
    const canvasHeight = async () => (await page.locator('#canvas').boundingBox())!.height;
    const before = await canvasHeight();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#dock-body')).toBeHidden();
    await expect.poll(canvasHeight).toBeGreaterThan(before + 50);

    await page.reload();
    await expect(page.locator('#dock-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#dock-body')).toBeHidden();

    await page.locator('#dock-toggle').click();
    await expect(page.locator('#theme')).toBeVisible();
  });

  test('status messages stay visible while the controls are hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await page.locator('#dock-toggle').click();
    await setEditorText(page, 'flowchart TD');
    await page.waitForTimeout(300);
    await page.click('#btn-present');
    await expect(page.locator('#message')).toContainText('Nothing to present');
    await expect(page.locator('#message')).toBeVisible();
  });

  test('the header stays in view as one slim row: the name, then icons only', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    const header = page.locator('#site-header');
    await expect(header).toBeInViewport({ ratio: 1 });
    const h = (await header.boundingBox())!;
    expect(h.y).toBeGreaterThanOrEqual(0);
    expect(h.height).toBeLessThanOrEqual(52);
    await expect(page.locator('.brand-name')).toHaveText('Gati Chitra');
    await expect(page.locator('.brand-name')).toBeVisible();
    const brand = (await page.locator('.brand').boundingBox())!;
    const brandMid = brand.y + brand.height / 2;
    for (const sel of ['#btn-install', '#btn-help', '#tools-toggle', '.site-nav a[href*="resume"]', '[data-testid="support-link"]']) {
      const item = page.locator(sel);
      await expect(item.locator('.action-label')).toBeHidden();
      const b = (await item.boundingBox())!;
      expect(b.width, sel).toBeLessThanOrEqual(40);
      expect(Math.abs(b.y + b.height / 2 - brandMid), sel).toBeLessThanOrEqual(4);
    }
    // Theme glide toggle sits on the same row.
    const switcherBox = (await page.locator('.switcher').boundingBox())!;
    expect(Math.abs(switcherBox.y + switcherBox.height / 2 - brandMid)).toBeLessThanOrEqual(4);
    // It stays put while you work.
    await page.mouse.move(640, 500);
    await page.waitForTimeout(500);
    expect((await header.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  });

  test('header icons show their names on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    for (const [sel, name] of [
      ['#btn-install', 'Install'], ['#btn-help', 'Help'], ['#tools-toggle', 'My Other Tools'],
      ['.site-nav a[href*="resume"]', 'Hire Me'], ['[data-testid="support-link"]', 'Support my work'],
    ] as const) {
      await expectHoverName(page, page.locator(sel), name);
    }
  });

  test('there is no toolbar row; the workspace sits right under the header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await expect(page.locator('#toolbar')).toHaveCount(0);
    await expect(page.locator('#btn-more')).toHaveCount(0);
    await expect(page.locator('#more-menu')).toHaveCount(0);
    const top = await page.evaluate(() => document.querySelector('#workspace')!.getBoundingClientRect().top);
    const headerBottom = await page.evaluate(() => document.querySelector('#site-header')!.getBoundingClientRect().bottom);
    expect(top - headerBottom).toBeLessThanOrEqual(20);
  });

  test('Fit, Auto-layout and Present sit on the diagram canvas, not in the toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    const canvas = (await page.locator('#canvas').boundingBox())!;
    for (const id of ['#btn-fit', '#btn-autolayout', '#btn-present']) {
      await expect(page.locator(`#toolbar ${id}`)).toHaveCount(0);
      await expect(page.locator(`#canvas-tools ${id}`)).toBeVisible();
      const b = (await page.locator(id).boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(canvas.x);
      expect(b.y).toBeGreaterThanOrEqual(canvas.y);
      expect(b.x + b.width).toBeLessThanOrEqual(canvas.x + canvas.width);
      expect(b.y + b.height).toBeLessThanOrEqual(canvas.y + canvas.height);
    }
  });

  test('the Grid toggle sits in the bottom-left corner of the canvas and works with the dock hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await expect(page.locator('#canvas-controls #canvas-grid')).toHaveCount(0);
    const grid = page.locator('#canvas-corner label', { has: page.locator('#canvas-grid') });
    await expect(grid).toBeVisible();

    const canvas = (await page.locator('#canvas').boundingBox())!;
    const b = (await grid.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(canvas.x);
    expect(b.x - canvas.x).toBeLessThanOrEqual(24);
    expect(b.y + b.height).toBeLessThanOrEqual(canvas.y + canvas.height);
    expect(canvas.y + canvas.height - (b.y + b.height)).toBeLessThanOrEqual(24);

    await page.locator('#dock-toggle').click();
    await expect(page.locator('#dock-body')).toBeHidden();
    await expect(grid).toBeVisible();
    await grid.click();
    await expect(page.locator('#canvas-grid')).toBeChecked();
  });

  test('Wrap text sits in the editor\'s bottom-right corner and still wraps lines', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await expect(page.locator('#text-panel-bar #editor-wrap')).toHaveCount(0);
    const wrap = page.locator('#source-corner label', { has: page.locator('#editor-wrap') });
    await expect(wrap).toBeVisible();

    const source = (await page.locator('#source').boundingBox())!;
    const b = (await wrap.boundingBox())!;
    expect(b.x + b.width).toBeLessThanOrEqual(source.x + source.width);
    expect(source.x + source.width - (b.x + b.width)).toBeLessThanOrEqual(28);
    expect(b.y + b.height).toBeLessThanOrEqual(source.y + source.height);
    expect(source.y + source.height - (b.y + b.height)).toBeLessThanOrEqual(28);

    await wrap.click();
    await expect(page.locator('#editor-wrap')).toBeChecked();
    await expect(page.locator('#source .cm-content')).toHaveClass(/cm-lineWrapping/);
  });

  test('the script title row stays one line when the editor is narrow', async ({ page }) => {
    await page.setViewportSize({ width: 1127, height: 760 });
    await page.goto('./?e2e=1');
    // Drag-free way to the narrowest editor: the splitter steps 5% per arrow key down to 20%.
    await page.locator('#splitter').focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#splitter')).toHaveAttribute('aria-valuenow', '20');
    const bar = (await page.locator('#text-panel-bar').boundingBox())!;
    expect(bar.height).toBeLessThanOrEqual(45);
  });

  test('the last line of a long script scrolls clear of the Wrap text toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, longScript(120));
    await page.waitForTimeout(300);
    const gap = await page.evaluate(async () => {
      const scroller = document.querySelector('#source .cm-scroller')!;
      scroller.scrollTop = scroller.scrollHeight;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const lines = document.querySelectorAll('#source .cm-line');
      const last = lines[lines.length - 1]!.getBoundingClientRect();
      const toggle = document.querySelector('#source-corner label')!.getBoundingClientRect();
      return toggle.top - last.bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(0);
  });

  test('Undo and Redo are icon buttons in the canvas\'s top-left corner and still work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.waitForTimeout(300);
    const canvas = (await page.locator('#canvas').boundingBox())!;
    for (const [id, name] of [['#btn-undo', 'Undo'], ['#btn-redo', 'Redo']] as const) {
      await expect(page.locator(`#toolbar ${id}`)).toHaveCount(0);
      const btn = page.locator(`#canvas-history ${id}`);
      await expect(btn).toHaveAccessibleName(name);
      await expect(btn.locator('svg')).toHaveCount(1);
      await expect(btn.locator('.action-label')).toHaveText(name);
      await expect(btn.locator('.action-label')).toBeHidden();
      const b = (await btn.boundingBox())!;
      expect(b.x - canvas.x).toBeGreaterThanOrEqual(0);
      expect(b.x - canvas.x).toBeLessThanOrEqual(90);
      expect(b.y - canvas.y).toBeGreaterThanOrEqual(0);
      expect(b.y - canvas.y).toBeLessThanOrEqual(24);
    }
    const text = () => page.evaluate(() => (window as any).__studio.getText() as string);
    const before = await text();
    await page.click('#tab-nodes');
    await page.locator('#node-palette button', { hasText: /^Rectangle$/ }).click();
    await expect.poll(text).not.toBe(before);
    await page.keyboard.press('Escape');
    await page.click('#btn-undo');
    await expect.poll(text).toBe(before);
  });

  test('Save .mmd, Share and Export are icons at the far right of the Animation & theme row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.waitForTimeout(300);
    const row = page.locator('.dock-header');
    const r = (await row.boundingBox())!;
    const xs: number[] = [];
    let exportRight = 0;
    for (const [id, name] of [['#btn-save-mmd', 'Save .mmd'], ['#btn-share', 'Share'], ['#btn-export', 'Export']] as const) {
      const btn = row.locator(id);
      await expect(btn).toHaveAccessibleName(name);
      await expect(btn).toBeEnabled();
      await expect(btn.locator('svg')).toHaveCount(1);
      // Only the icon shows until you point at it.
      await expect(btn.locator('.action-label')).toBeHidden();
      const b = (await btn.boundingBox())!;
      expect(b.width).toBeLessThanOrEqual(34);
      expect(Math.abs(b.y + b.height / 2 - (r.y + r.height / 2))).toBeLessThanOrEqual(2);
      xs.push(b.x);
      exportRight = b.x + b.width;
    }
    expect(xs[0]!).toBeLessThan(xs[1]!);
    expect(xs[1]!).toBeLessThan(xs[2]!);
    expect(r.x + r.width - exportRight).toBeLessThanOrEqual(16);

    // Still there with the controls hidden, and Export opens its panel.
    await page.click('#dock-toggle');
    await expect(page.locator('#btn-export')).toBeVisible();
    await page.click('#btn-export');
    await expect(page.locator('#export-panel')).toBeVisible();
  });

  test('pointing at a dock action widens it to show its name', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.waitForTimeout(300);
    for (const [id, name] of [['#btn-save-mmd', 'Save .mmd'], ['#btn-share', 'Share'], ['#btn-export', 'Export']] as const) {
      const btn = page.locator(id);
      const before = (await btn.boundingBox())!.width;
      await btn.hover();
      await expect(btn.locator('.action-label')).toBeVisible();
      await expect(btn.locator('.action-label')).toHaveText(name);
      await expect.poll(async () => (await btn.boundingBox())!.width).toBeGreaterThan(before + 25);
      await page.mouse.move(640, 300);
      await expect(btn.locator('.action-label')).toBeHidden();
    }
  });

  test('Save .mmd downloads the script', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    const download = page.waitForEvent('download');
    await page.click('#btn-save-mmd');
    expect((await download).suggestedFilename()).toBe('diagram.mmd');
  });

  test('New, Open and Templates are icons at the right of the script panel bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    const bar = page.locator('#text-panel-bar');
    const file = bar.getByRole('group', { name: 'File' });
    const xs: number[] = [];
    for (const [id, name] of [['#btn-new', 'New'], ['#btn-open', 'Open'], ['#btn-templates', 'Templates']] as const) {
      const btn = file.locator(id);
      await expect(btn).toHaveAccessibleName(name);
      await expect(btn.locator('svg')).toHaveCount(1);
      await expect(btn.locator('.action-label')).toBeHidden();
      xs.push((await btn.boundingBox())!.x);
    }
    expect(xs[0]!).toBeLessThan(xs[1]!);
    expect(xs[1]!).toBeLessThan(xs[2]!);

    await setEditorText(page, 'flowchart TD\n  A --> B');
    await page.click('#btn-new');
    await expect.poll(() => page.evaluate(() => (window as any).__studio.getText())).toBe('flowchart TD\n');

    const chooser = page.waitForEvent('filechooser');
    await page.click('#btn-open');
    await chooser;
  });

  test('the share link opens just above the Share icon', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.waitForTimeout(300);
    // The box only opens when the browser will not copy the link for us, so block copying.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('blocked')) }, configurable: true,
    }));
    await page.click('#btn-share');
    const shareBox = page.locator('#share-box');
    await expect(shareBox).toBeVisible();
    await expect(page.locator('#share-url')).toHaveValue(/#v1=/);
    const r = (await page.locator('.dock-header').boundingBox())!;
    const b = (await shareBox.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(r.y + 1);
    expect(r.x + r.width - (b.x + b.width)).toBeLessThanOrEqual(24);
    const canvas = (await page.locator('#canvas').boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(canvas.x);
  });

  test('Templates is an icon button at the right of the script panel bar and opens the gallery', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await expect(page.locator('#toolbar #btn-templates')).toHaveCount(0);
    const btn = page.locator('#text-panel-bar #btn-templates');
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveAccessibleName('Templates');
    await expect(btn.locator('svg')).toHaveCount(1);
    await expect(btn.locator('.action-label')).toBeHidden();
    const bar = (await page.locator('#text-panel-bar').boundingBox())!;
    const b = (await btn.boundingBox())!;
    expect(bar.x + bar.width - (b.x + b.width)).toBeLessThanOrEqual(16);
    await btn.click();
    await expect(page.locator('#gallery')).toBeVisible();
  });

  test('the script panel has two icon tabs, Mermaid script and Nodes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await expect(page.getByRole('tablist', { name: 'Editor panels' }).getByRole('tab')).toHaveCount(2);
    const script = page.locator('#tab-script');
    const nodes = page.locator('#tab-nodes');
    await expect(script).toHaveAccessibleName('Mermaid script');
    await expect(nodes).toHaveAccessibleName('Nodes');
    for (const tab of [script, nodes]) {
      await expect(tab.locator('svg')).toHaveCount(1);
    }
    // The active tab shows its text; the inactive tab hides it until selected.
    await expect(script.locator('.action-label')).toBeVisible();
    await expect(nodes.locator('.action-label')).toBeHidden();
    await expect(script).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#source')).toBeVisible();
    await expect(page.locator('#nodes-pane')).toBeHidden();

    await nodes.click();
    await expect(nodes).toHaveAttribute('aria-selected', 'true');
    await expect(nodes.locator('.action-label')).toBeVisible();
    await expect(script.locator('.action-label')).toBeHidden();
    await expect(page.locator('#nodes-pane')).toBeVisible();
    await expect(page.locator('#source')).toBeHidden();

    await page.mouse.move(0, 0);
    await page.keyboard.press('ArrowLeft');
    await expect(script).toBeFocused();
    await expect(script).toHaveAttribute('aria-selected', 'true');
    await expect(script.locator('.action-label')).toBeVisible();
    await expect(nodes.locator('.action-label')).toBeHidden();
    await expect(page.locator('#source')).toBeVisible();
  });

  test('the Nodes tab lists every shape with an icon and a name, and a click adds that node', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.waitForTimeout(300);
    await expect(page.locator('#btn-add-node')).toHaveCount(0);
    await expect(page.locator('#add-node-menu')).toHaveCount(0);
    await page.click('#tab-nodes');
    const items = page.locator('#node-palette button');
    await expect(items).toHaveCount(20);
    for (let i = 0; i < 20; i++) {
      await expect(items.nth(i).locator('svg')).toHaveCount(1);
      expect((await items.nth(i).innerText()).trim()).not.toBe('');
    }
    const count = () => page.evaluate(() => (window as any).__studio.getSummary().nodes.length as number);
    const text = () => page.evaluate(() => (window as any).__studio.getText() as string);
    const before = await count();
    await items.filter({ hasText: /^Diamond$/ }).click();
    await expect.poll(count).toBe(before + 1);
    // Diamond is the only shape here written with braces.
    await expect.poll(text).toMatch(/\{[^}]*\}/);
  });

  test('selecting a node on the diagram opens its format controls in the Nodes tab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.click('#btn-fit');
    await expect(page.locator('#tab-script')).toHaveAttribute('aria-selected', 'true');
    const center = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(center.x, center.y);
    await expect(page.locator('#tab-nodes')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#nodes-pane #props')).toBeVisible();
    await expect(page.locator('#prop-label')).toHaveValue('Start');
    // A node shows its own controls, not the arrow-only Kind and Reverse.
    await expect(page.locator('#prop-section-node')).toBeVisible();
    await expect(page.locator('#prop-section-edge')).toBeHidden();
    // Format is the pane's first section, so the controls show without scrolling.
    const offset = () => page.evaluate(() =>
      document.querySelector('.format-section')!.getBoundingClientRect().top
      - document.querySelector('#nodes-pane')!.getBoundingClientRect().top);
    await expect.poll(offset).toBeLessThanOrEqual(24);
  });

  test('a state diagram\'s Nodes tab offers its own node kind, not flowchart shapes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'stateDiagram-v2\n  [*] --> A\n  A --> B');
    await page.click('#tab-nodes');
    const items = page.locator('#node-palette button');
    await expect(items).toHaveCount(1);
    await expect(items).toHaveText('State');
    const count = () => page.evaluate(() => (window as any).__studio.getSummary().nodes.length as number);
    const before = await count();
    await items.click();
    await expect.poll(count).toBe(before + 1);
  });

  test('Fit, Auto-layout, Present and Grid are named icon controls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    for (const [sel, name] of [['#btn-fit', 'Fit'], ['#btn-autolayout', 'Auto-layout'], ['#btn-present', 'Present']] as const) {
      const btn = page.locator(sel);
      await expect(btn).toHaveAccessibleName(name);
      await expect(btn.locator('svg')).toHaveCount(1);
      await expect(btn.locator('.action-label')).toHaveText(name);
    }
    const grid = page.locator('#canvas-grid');
    await expect(grid).toHaveAccessibleName('Grid');
    const gridLabel = page.locator('#canvas-corner label');
    await expect(gridLabel.locator('svg')).toHaveCount(1);
    await gridLabel.click();
    await expect(grid).toBeChecked();
  });

  test('every canvas and panel icon shows its name on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.waitForTimeout(300);
    for (const [sel, name] of [
      ['#btn-fit', 'Fit'], ['#btn-present', 'Present'],
      ['#btn-zoom-out', 'Zoom out'], ['#btn-zoom-in', 'Zoom in'], ['#btn-pan', 'Move'],
      ['#canvas-corner label', 'Grid'],
      ['#tab-nodes', 'Nodes'],
      ['#btn-new', 'New'], ['#btn-open', 'Open'], ['#btn-templates', 'Templates'],
    ] as const) {
      await expectHoverName(page, page.locator(sel), name);
    }
  });

  test('zoom in, zoom out and move sit in the canvas\'s bottom-right corner and work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.click('#btn-fit');
    const canvas = (await page.locator('#canvas').boundingBox())!;
    for (const [sel, name] of [['#btn-zoom-out', 'Zoom out'], ['#btn-zoom-in', 'Zoom in'], ['#btn-pan', 'Move']] as const) {
      const btn = page.locator(`#canvas-zoom ${sel}`);
      await expect(btn).toHaveAccessibleName(name);
      await expect(btn.locator('svg')).toHaveCount(1);
      const b = (await btn.boundingBox())!;
      expect(b.x + b.width).toBeLessThanOrEqual(canvas.x + canvas.width);
      expect(canvas.x + canvas.width - (b.x + b.width)).toBeLessThanOrEqual(130);
      expect(canvas.y + canvas.height - (b.y + b.height)).toBeGreaterThanOrEqual(0);
      expect(canvas.y + canvas.height - (b.y + b.height)).toBeLessThanOrEqual(24);
    }
    const view = () => page.evaluate(() => (window as any).__studio.getView() as { panX: number; panY: number; zoom: number });
    const z0 = (await view()).zoom;
    await page.click('#btn-zoom-in');
    await expect.poll(async () => (await view()).zoom).toBeCloseTo(z0 * 1.25, 3);
    await page.click('#btn-zoom-out');
    await expect.poll(async () => (await view()).zoom).toBeCloseTo(z0, 3);

    // With Move on, dragging even from a node moves the view and leaves the diagram as it was.
    const move = page.locator('#btn-pan');
    await expect(move).toHaveAttribute('aria-pressed', 'false');
    await move.click();
    await expect(move).toHaveAttribute('aria-pressed', 'true');
    const text = () => page.evaluate(() => (window as any).__studio.getText() as string);
    const before = { text: await text(), view: await view() };
    const a = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x + 60, a.y + 40, { steps: 6 });
    await page.mouse.up();
    const after = await view();
    expect(Math.abs(after.panX - before.view.panX) + Math.abs(after.panY - before.view.panY)).toBeGreaterThan(30);
    expect(await text()).toBe(before.text);
    await move.click();
    await expect(move).toHaveAttribute('aria-pressed', 'false');
  });

  test('the canvas tools work from the canvas and hide while presenting', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\n  A[Start] --> B[Next]');
    await page.waitForTimeout(300);
    await page.click('#btn-present');
    await expect(page.locator('body')).toHaveClass(/presenting/);
    await expect(page.locator('#canvas-tools')).toBeHidden();
    await expect(page.locator('#canvas-history')).toBeHidden();
    await expect(page.locator('#canvas-corner label')).toBeHidden();
    await expect(page.locator('#canvas-zoom')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('#canvas-tools')).toBeVisible();
    await expect(page.locator('#canvas-history')).toBeVisible();
    await expect(page.locator('#canvas-corner label')).toBeVisible();
  });

  test('Lock background and Wrap text are switches', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    const lock = page.locator('#bg-lock');
    await expect(lock).toHaveAttribute('role', 'switch');
    await expect(lock).toHaveAttribute('aria-checked', 'false');
    await expect(lock).toHaveText('Lock background');
    await expect(lock.locator('.switch-track')).toBeVisible();
    const track = () => lock.locator('.switch-track').evaluate((el) => getComputedStyle(el).backgroundColor);
    const off = await track();
    await lock.click();
    await expect(lock).toHaveAttribute('aria-checked', 'true');
    await expect(lock).toHaveText('Lock background');
    await expect.poll(track).not.toBe(off);

    const wrap = page.locator('#editor-wrap');
    await expect(wrap).toHaveAttribute('role', 'switch');
    await expect(page.locator('#source-corner .switch-track')).toBeVisible();
    await page.locator('#source-corner label').click();
    await expect(wrap).toBeChecked();
    await expect(page.locator('#source .cm-content')).toHaveClass(/cm-lineWrapping/);
  });

  test('in a short window the page scrolls but the editor stays bounded', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 480 });
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    const before = await heights(page);

    await setEditorText(page, longScript(200));
    await page.waitForTimeout(400);
    const after = await heights(page);

    expect(Math.abs(after.textPanel - before.textPanel)).toBeLessThanOrEqual(1);
    expect(after.editorScrolls).toBe(true);
    expect(after.canvas).toBeGreaterThanOrEqual(200);
  });
});
