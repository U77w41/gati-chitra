import { test, expect } from '@playwright/test';
import { CORPUS } from '../support/corpus';

test.describe('Editing, connecting and properties panel', () => {
  test('connects nodes by dragging from handle to node', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA\nB');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    const bScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('B'));
    expect(aScreen).not.toBeNull();
    expect(bScreen).not.toBeNull();

    // Click A to select it and reveal handle
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    const aHandle = await page.evaluate(() => (window as any).__studio.getNodeHandleScreen?.('A'));
    expect(aHandle).not.toBeNull();

    // Drag from handle to B center
    await page.mouse.move(aHandle.x, aHandle.y);
    await page.mouse.down();
    await page.mouse.move(bScreen.x, bScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const text = await page.locator('#source').inputValue();
    expect(text).toContain('A --> B');
  });

  test('drags from handle to empty space to add connected node and renames in place', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    const aHandle = await page.evaluate(() => (window as any).__studio.getNodeHandleScreen?.('A'));

    // Drag from handle to empty space
    await page.mouse.move(aHandle.x, aHandle.y);
    await page.mouse.down();
    await page.mouse.move(aHandle.x + 120, aHandle.y + 120, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const textAfterDrop = await page.locator('#source').inputValue();
    expect(textAfterDrop).toContain('n1[New]');
    expect(textAfterDrop).toContain('A --> n1');
    expect(textAfterDrop).toContain('%% studio:pos n1');

    // Inline edit should be visible
    const inlineEdit = page.locator('#inline-edit');
    await expect(inlineEdit).toBeVisible();

    await inlineEdit.fill('Next');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const textAfterEdit = await page.locator('#source').inputValue();
    expect(textAfterEdit).toContain('n1[Next]');

    // One undo click removes node, arrow, and pin
    await page.click('#btn-undo');
    await page.waitForTimeout(300);
    const textAfterUndo = await page.locator('#source').inputValue();
    expect(textAfterUndo).not.toContain('n1');
    expect(textAfterUndo).not.toContain('A -->');
  });

  test('double-clicks empty canvas to add node and opens editor', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\n');
    });
    await page.waitForTimeout(300);

    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.dblclick(box!.x + 150, box!.y + 150);
    await page.waitForTimeout(300);

    const text = await page.locator('#source').inputValue();
    expect(text).toContain('n1[New]');
    await expect(page.locator('#inline-edit')).toBeVisible();
  });

  test('double-clicks node to rename in place', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.dblclick(aScreen.x, aScreen.y);
    await page.waitForTimeout(300);

    const inlineEdit = page.locator('#inline-edit');
    await expect(inlineEdit).toBeVisible();
    await inlineEdit.fill('Alpha');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const text = await page.locator('#source').inputValue();
    expect(text).toContain('A[Alpha]');
  });

  test('selects node and presses Delete to remove it', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    const text = await page.locator('#source').inputValue();
    expect(text).not.toContain('A');
  });

  test('changes node shape via properties panel', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    await page.selectOption('#prop-shape', 'diamond');
    await page.waitForTimeout(300);

    const text = await page.locator('#source').inputValue();
    expect(text).toContain('A{A}');
  });

  test('changes node fill colour via properties panel', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    await page.locator('#prop-fill').fill('#ffcc00');
    await page.locator('#prop-fill').dispatchEvent('change');
    await page.waitForTimeout(300);

    const text = await page.locator('#source').inputValue();
    expect(text).toContain('style A fill:#ffcc00');
  });

  test('edits edge properties: kind, reverse, delete', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA --> B');
    });
    await page.waitForTimeout(300);

    const edgeMid = await page.evaluate(() => (window as any).__studio.getEdgeScreenMid('e0'));
    expect(edgeMid).not.toBeNull();
    await page.mouse.click(edgeMid.x, edgeMid.y);
    await page.waitForTimeout(100);

    // Change kind to dottedArrow
    await page.selectOption('#prop-kind', 'dottedArrow');
    await page.waitForTimeout(300);
    let text = await page.locator('#source').inputValue();
    expect(text).toContain('A -.-> B');

    // Reverse edge
    await page.click('#prop-reverse');
    await page.waitForTimeout(300);
    text = await page.locator('#source').inputValue();
    expect(text).toContain('B -.-> A');

    // Delete edge
    await page.click('#prop-delete');
    await page.waitForTimeout(300);
    text = await page.locator('#source').inputValue();
    expect(text).toContain('A');
    expect(text).toContain('B');
    expect(text).not.toContain('->');
  });

  test('undo restores text after any edit operation (Review Focus 3)', async ({ page }) => {
    await page.goto('/?e2e=1');
    const initial = 'flowchart TD\nA-->B';
    await page.evaluate((t) => {
      (window as any).__studio.setText(t);
    }, initial);
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    await page.selectOption('#prop-shape', 'diamond');
    await page.waitForTimeout(300);

    await page.click('#btn-undo');
    await page.waitForTimeout(300);
    const restored = await page.locator('#source').inputValue();
    expect(restored).toBe(initial);
  });

  test('handles invalid text safely: disables props or shows error message', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('nonsense');
    });
    await page.waitForTimeout(300);

    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.dblclick(box!.x + 100, box!.y + 100);
    await page.waitForTimeout(300);

    await expect(page.locator('#message')).toContainText('Fix the errors in the text first.');
  });

  test('refuses group deletion with message (Review Focus 3)', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate((corpusText) => {
      (window as any).__studio.setText(corpusText);
    }, CORPUS[1].text);
    await page.waitForTimeout(300);

    // Click ingest group title band
    const gScreen = await page.evaluate(() => (window as any).__studio.getGroupTitleScreen?.('ingest'));
    expect(gScreen).not.toBeNull();
    await page.mouse.click(gScreen.x, gScreen.y);
    await page.waitForTimeout(100);

    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    await expect(page.locator('#message')).toContainText('Groups are edited in the text.');
  });

  test('typed label survives a mouse move', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);
    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);
    const labelInput = page.locator('#prop-label');
    await labelInput.focus();
    await labelInput.fill('Renamed');
    const canvas = page.locator('#canvas');
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.move(box.x + 100, box.y + 100);
    expect(await labelInput.inputValue()).toBe('Renamed');
  });

  test('New is undoable', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);
    const source = page.locator('#source');
    await source.focus();
    await source.fill('flowchart TD\nCustomLine');
    await page.click('#btn-new');
    await page.locator('body').focus();
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForTimeout(200);
    expect(await source.inputValue()).toContain('CustomLine');
  });

  test('the same file opens twice', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(300);
    const file = {
      name: 'diagram.mmd',
      mimeType: 'text/plain',
      buffer: Buffer.from('flowchart TD\nFromFile'),
    };
    await page.locator('#file-picker').setInputFiles(file);
    await page.waitForTimeout(200);
    expect(await page.locator('#source').inputValue()).toContain('FromFile');

    await page.locator('#source').fill('flowchart TD\nEditedInBetween');
    await page.locator('#file-picker').setInputFiles(file);
    await page.waitForTimeout(200);
    expect(await page.locator('#source').inputValue()).toContain('FromFile');
  });

  test('inline editor sits on the node', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);
    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.dblclick(aScreen.x, aScreen.y);
    await page.waitForTimeout(200);
    const editBox = (await page.locator('#inline-edit').boundingBox())!;
    const editCenter = { x: editBox.x + editBox.width / 2, y: editBox.y + editBox.height / 2 };
    expect(Math.abs(editCenter.x - aScreen.x)).toBeLessThanOrEqual(4);
    expect(Math.abs(editCenter.y - aScreen.y)).toBeLessThanOrEqual(4);
  });
});
