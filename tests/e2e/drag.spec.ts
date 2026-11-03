import { test, expect } from '@playwright/test';

test.describe('Selection, drag and history', () => {
  test('drags node to create pin, supports undo and redo, autolayout', async ({ page }) => {
    await page.goto('./?e2e=1');

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    const initialText = await page.locator('#source').inputValue();
    const preDragSnap = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      return c?.toDataURL();
    });

    const aScreen = await page.evaluate(() => {
      return (window as any).__studio.getNodeScreenCenter('A');
    });
    expect(aScreen).not.toBeNull();

    // Mouse drag A by 60 px down
    await page.mouse.move(aScreen.x, aScreen.y);
    await page.mouse.down();
    await page.mouse.move(aScreen.x, aScreen.y + 60, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const postDragText = await page.locator('#source').inputValue();
    expect(postDragText).toContain('%% studio:pos A ');
    expect(postDragText).toContain('%% studio:layout v1');

    const summary = await page.evaluate(() => (window as any).__studio.getSummary());
    expect(summary.ok).toBe(true);

    const postDragSnap = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('#canvas');
      return c?.toDataURL();
    });
    expect(postDragSnap).not.toEqual(preDragSnap);

    // Undo
    await page.click('#btn-undo');
    await page.waitForTimeout(300);
    const undoText = await page.locator('#source').inputValue();
    expect(undoText).toBe(initialText);

    // Redo
    await page.click('#btn-redo');
    await page.waitForTimeout(300);
    const redoText = await page.locator('#source').inputValue();
    expect(redoText).toBe(postDragText);

    // Autolayout clears pins
    await page.click('#btn-autolayout');
    await page.waitForTimeout(300);
    const autoText = await page.locator('#source').inputValue();
    expect(autoText).not.toContain('%% studio:pos');
    expect(autoText).not.toContain('%% studio:layout');
  });

  test('cancels drag on mid-drag text change (Review Focus 3)', async ({ page }) => {
    await page.goto('./?e2e=1');

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => {
      return (window as any).__studio.getNodeScreenCenter('A');
    });

    await page.mouse.move(aScreen.x, aScreen.y);
    await page.mouse.down();
    await page.mouse.move(aScreen.x, aScreen.y + 60, { steps: 5 });

    // Mid-drag text change
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nX');
    });
    await page.waitForTimeout(100);

    await page.mouse.up();
    await page.waitForTimeout(300);

    const finalSource = await page.locator('#source').inputValue();
    expect(finalSource).not.toContain('%% studio:pos A');
    expect(finalSource).toContain('X');
  });

  test('shows error message when dragging with invalid text', async ({ page }) => {
    await page.goto('./?e2e=1');

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => {
      return (window as any).__studio.getNodeScreenCenter('A');
    });

    // Make text invalid
    await page.evaluate(() => {
      (window as any).__studio.setText('nonsense');
    });
    await page.waitForTimeout(300);

    // Try to drag node A
    await page.mouse.move(aScreen.x, aScreen.y);
    await page.mouse.down();
    await page.mouse.move(aScreen.x, aScreen.y + 60, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const text = await page.locator('#source').inputValue();
    expect(text).not.toContain('%% studio:pos');

    const msg = page.locator('#message');
    await expect(msg).toContainText('Fix the errors in the text first.');
  });
});
