import { expect, test } from '@playwright/test';
import { editorText } from '../support/editor';

test.describe('Keyboard navigation and operations', () => {
  test('selects, moves, connects and cycles with keyboard', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    // Load the approval template
    await page.click('#btn-templates');
    await page.getByText('Approval flow').click();
    await expect(page.locator('#gallery')).toBeHidden();
    await expect(page.locator('#btn-templates')).toBeFocused();
    await expect.poll(async () => editorText(page)).toContain('Start');

    const canvas = page.locator('#canvas');
    await canvas.focus();
    await expect(canvas).toBeFocused();

    const status = page.locator('#canvas-status');

    // 1. ArrowDown: #canvas-status reads Node A, Start, Rectangle. 0 in, 1 out.
    await page.keyboard.press('ArrowDown');
    await expect(status).toHaveText('Node A, Start, Rectangle. 0 in, 1 out.');

    // 2. ArrowDown: node B is selected.
    await page.keyboard.press('ArrowDown');
    await expect(status).toHaveText('Node B, Valid?, Diamond. 2 in, 2 out.');

    // 3. Shift+ArrowRight: the text gains a %% studio:pos B line.
    await page.keyboard.press('Shift+ArrowRight');
    expect(await editorText(page)).toContain('%% studio:pos B');

    // 4. Enter: #inline-edit is visible. Escape closes it.
    await page.keyboard.press('Enter');
    const inlineEdit = page.locator('#inline-edit');
    await expect(inlineEdit).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(inlineEdit).toBeHidden();

    // 5. ]: an arrow is selected.
    await canvas.focus();
    await page.keyboard.press(']');
    await expect(status).toContainText('Arrow from');

    // 6. Escape, then select B with ArrowDown. Choose E in #prop-connect and activate #prop-connect-go: the text has a new B --> E line.
    await page.keyboard.press('Escape');
    await expect(status).toHaveText('No selection.');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(status).toContainText('Node B');

    const propConnect = page.locator('#prop-connect');
    await propConnect.selectOption('E');
    await page.click('#prop-connect-go');
    expect(await editorText(page)).toContain('B --> E');
  });
});
