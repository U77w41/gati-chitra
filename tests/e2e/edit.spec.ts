import { test, expect } from '@playwright/test';
import { CORPUS } from '../support/corpus';
import { editorText, setEditorText, typeInEditor } from '../support/editor';

test.describe('Editing, connecting and properties panel', () => {
  test('connects nodes by dragging from handle to node', async ({ page }) => {
    await page.goto('./?e2e=1');
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

    const text = await editorText(page);
    expect(text).toContain('A --> B');
  });

  test('drags from handle to empty space to add connected node and renames in place', async ({ page }) => {
    await page.goto('./?e2e=1');
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

    const textAfterDrop = await editorText(page);
    expect(textAfterDrop).toContain('n1[New]');
    expect(textAfterDrop).toContain('A --> n1');
    expect(textAfterDrop).toContain('%% studio:pos n1');

    // Inline edit should be visible
    const inlineEdit = page.locator('#inline-edit');
    await expect(inlineEdit).toBeVisible();

    await inlineEdit.fill('Next');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const textAfterEdit = await editorText(page);
    expect(textAfterEdit).toContain('n1[Next]');

    // One undo click removes node, arrow, and pin
    await page.click('#btn-undo');
    await page.waitForTimeout(300);
    const textAfterUndo = await editorText(page);
    expect(textAfterUndo).not.toContain('n1');
    expect(textAfterUndo).not.toContain('A -->');
  });

  test('double-clicks empty canvas to add node and opens editor', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\n');
    });
    await page.waitForTimeout(300);

    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.dblclick(box!.x + 150, box!.y + 150);
    await page.waitForTimeout(300);

    const text = await editorText(page);
    expect(text).toContain('n1[New]');
    await expect(page.locator('#inline-edit')).toBeVisible();
  });

  test('double-clicks node to rename in place', async ({ page }) => {
    await page.goto('./?e2e=1');
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

    const text = await editorText(page);
    expect(text).toContain('A[Alpha]');
  });

  test('selects node and presses Delete to remove it', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    const text = await editorText(page);
    expect(text).not.toContain('A');
  });

  test('changes node shape via properties panel', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    await page.selectOption('#prop-shape', 'diamond');
    await page.waitForTimeout(300);

    const text = await editorText(page);
    expect(text).toContain('A{A}');
  });

  test('changes node fill colour via properties panel', async ({ page }) => {
    await page.goto('./?e2e=1');
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

    const text = await editorText(page);
    expect(text).toContain('style A fill:#ffcc00');
  });

  test('changes node text colour via properties panel', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    await page.locator('#prop-text-color').fill('#e63946');
    await page.locator('#prop-text-color').dispatchEvent('change');
    await page.waitForTimeout(300);

    const text = await editorText(page);
    expect(text).toContain('style A color:#e63946');
  });

  test('edits edge properties: kind, reverse, delete', async ({ page }) => {
    await page.goto('./?e2e=1');
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
    let text = await editorText(page);
    expect(text).toContain('A -.-> B');

    // Reverse edge
    await page.click('#prop-reverse');
    await page.waitForTimeout(300);
    text = await editorText(page);
    expect(text).toContain('B -.-> A');

    // Delete edge
    await page.click('#prop-delete');
    await page.waitForTimeout(300);
    text = await editorText(page);
    expect(text).toContain('A');
    expect(text).toContain('B');
    expect(text).not.toContain('->');
  });

  test('undo restores text after any edit operation (Review Focus 3)', async ({ page }) => {
    await page.goto('./?e2e=1');
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
    const restored = await editorText(page);
    expect(restored).toBe(initial);
  });

  test('handles invalid text safely: disables props or shows error message', async ({ page }) => {
    await page.goto('./?e2e=1');
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
    await page.goto('./?e2e=1');
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
    await page.goto('./?e2e=1');
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
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    await setEditorText(page, 'flowchart TD\nCustomLine');
    await page.click('#btn-new');
    await page.locator('body').focus();
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForTimeout(200);
    expect(await editorText(page)).toContain('CustomLine');
  });

  test('the same file opens twice', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    const file = {
      name: 'diagram.mmd',
      mimeType: 'text/plain',
      buffer: Buffer.from('flowchart TD\nFromFile'),
    };
    await page.locator('#file-picker').setInputFiles(file);
    await page.waitForTimeout(200);
    expect(await editorText(page)).toContain('FromFile');

    await setEditorText(page, 'flowchart TD\nEditedInBetween');
    await page.locator('#file-picker').setInputFiles(file);
    await page.waitForTimeout(200);
    expect(await editorText(page)).toContain('FromFile');
  });

  test('inline editor sits on the node', async ({ page }) => {
    await page.goto('./?e2e=1');
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

  test('the label editor is a compact pill on the label, in the label\'s font, that grows as you type', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./?e2e=1');
    await page.evaluate(() => (window as any).__studio.setText('flowchart LR\n  A[Start] --> B((Circle))'));
    await page.waitForTimeout(300);
    await page.click('#btn-fit');
    const center = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('B'));
    await page.mouse.dblclick(center.x, center.y);
    const editor = page.locator('#inline-edit');
    await expect(editor).toBeVisible();

    const zoom = await page.evaluate(() => (window as any).__studio.getView().zoom as number);
    const style = await editor.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { align: cs.textAlign, font: parseFloat(cs.fontSize), outline: cs.outlineStyle, lineHeight: parseFloat(cs.lineHeight) };
    });
    expect(style.align).toBe('center');
    expect(Math.abs(style.font - Math.min(24, Math.max(12, Math.round(16 * zoom))))).toBeLessThanOrEqual(0.5);
    expect(style.outline).toBe('none');

    // One line tall and centred on the label, so the node's shape stays visible around it.
    const box = (await editor.boundingBox())!;
    expect(box.height).toBeLessThanOrEqual(style.lineHeight + 14);
    expect(Math.abs(box.x + box.width / 2 - center.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.y + box.height / 2 - center.y)).toBeLessThanOrEqual(2);

    await page.keyboard.type('A much longer label for this circle node');
    const wider = (await editor.boundingBox())!;
    expect(wider.width).toBeGreaterThan(box.width + 40);
    expect(wider.width).toBeLessThanOrEqual(320);
    expect(Math.abs(wider.x + wider.width / 2 - center.x)).toBeLessThanOrEqual(2);
  });

  test('opening a Markdown file strips the fences', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    const file = {
      name: 'diagram.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('```mermaid\nflowchart TD\nFromMd\n```'),
    };
    await page.locator('#file-picker').setInputFiles(file);
    await page.waitForTimeout(200);
    const val = await editorText(page);
    expect(val).toBe('flowchart TD\nFromMd');
  });

  test('properties list every shape', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA[Start]');
    });
    await page.waitForTimeout(300);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    await page.mouse.click(aScreen.x, aScreen.y);
    await page.waitForTimeout(100);

    const options = page.locator('#prop-shape option');
    await expect(options).toHaveCount(20);

    await page.selectOption('#prop-shape', { label: 'Document' });
    await page.waitForTimeout(200);

    const text = await editorText(page);
    expect(text).toContain('A@{ shape: doc, label: "Start" }');
  });

  test('one undo history', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);
    const startText = await editorText(page);

    await typeInEditor(page, '\nA --> X');
    await page.waitForTimeout(1100);

    const aScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('A'));
    expect(aScreen).not.toBeNull();
    await page.mouse.move(aScreen.x, aScreen.y);
    await page.mouse.down();
    await page.mouse.move(aScreen.x + 50, aScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const textAfterDrag = await editorText(page);
    expect(textAfterDrag).toContain('studio:pos A');

    // Focus the editor and press Ctrl+Z: text has A --> X and no studio:pos A line
    await page.locator('.cm-content').focus();
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForTimeout(200);

    const textAfterUndo1 = await editorText(page);
    expect(textAfterUndo1).toContain('A --> X');
    expect(textAfterUndo1).not.toContain('studio:pos A');

    // Click the page body and press Ctrl+Z: text equals starting text
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForTimeout(200);

    const textAfterUndo2 = await editorText(page);
    expect(textAfterUndo2).toBe(startText);

    // Press Ctrl+Y twice: the drag is back
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(100);
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(200);

    const textAfterRedo = await editorText(page);
    expect(textAfterRedo).toContain('studio:pos A');
  });

  test('caret stays after a canvas edit', async ({ page }) => {
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\nA[First]\nB[Second]\nC[Third]');
    await page.waitForTimeout(300);

    // Put caret at end of line 2
    await page.evaluate(() => {
      const view = (window as any).__studioEditor;
      if (view) {
        const line2 = view.state.doc.line(2);
        view.dispatch({ selection: { anchor: line2.to } });
        view.focus();
      }
    });

    const caretBefore = await page.evaluate(() => (window as any).__studio.getCaret());
    expect(caretBefore.line).toBe(2);

    // Rename node C defined on line 4 from properties panel
    const cScreen = await page.evaluate(() => (window as any).__studio.getNodeScreenCenter('C'));
    await page.mouse.click(cScreen.x, cScreen.y);
    await page.waitForTimeout(100);

    await page.fill('#prop-label', 'RenamedC');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    const caretAfter = await page.evaluate(() => (window as any).__studio.getCaret());
    expect(caretAfter.line).toBe(2);
  });

  test('line numbers show', async ({ page }) => {
    await page.goto('./?e2e=1');
    await setEditorText(page, 'flowchart TD\nA\nB\nC');
    await page.waitForTimeout(300);

    const gutters = page.locator('.cm-lineNumbers .cm-gutterElement');
    const count = await gutters.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('pasting fenced text strips the fences', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions only supported in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await setEditorText(page, '');
    await page.evaluate(() => {
      navigator.clipboard.writeText('```mermaid\nflowchart TD\nPasted\n```');
    });

    await page.locator('.cm-content').focus();
    await page.keyboard.press('ControlOrMeta+v');
    await page.waitForTimeout(300);

    const text = await editorText(page);
    expect(text).not.toContain('```');
    expect(text).toContain('flowchart TD');
    expect(text).toContain('Pasted');
  });

  test('shows lint marker in gutter on error and diagnostic button focuses line', async ({ page }) => {
    await page.goto('./?e2e=1');
    await setEditorText(page, '%% line 1\n%% line 2\nnot a diagram');
    await page.waitForTimeout(400);

    const marker = page.locator('.cm-lint-marker-error');
    await expect(marker).toBeVisible();

    const diagBtn = page.locator('#diagnostics button').first();
    await expect(diagBtn).toBeVisible();
    await diagBtn.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const caret = await page.evaluate(() => (window as any).__studio.getCaret());
    expect(caret.line).toBe(3);
  });
});
