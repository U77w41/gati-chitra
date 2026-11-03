import type { Page } from '@playwright/test';

export async function setEditorText(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => (window as any).__studio.setText(t), text);
  await page.waitForTimeout(100);
}

export async function typeInEditor(page: Page, text: string): Promise<void> {
  const content = page.locator('.cm-content');
  if (await content.count() > 0) {
    await content.focus();
    await page.evaluate(() => {
      const view = (window as unknown as { __studioEditor?: { dispatch: (tr: unknown) => void; state: { doc: { length: number } }; focus: () => void } }).__studioEditor;
      if (view) {
        view.dispatch({ selection: { anchor: view.state.doc.length } });
        view.focus();
      }
    });
    await page.keyboard.type(text);
  } else {
    const source = page.locator('#source');
    await source.focus();
    await page.keyboard.type(text);
  }
}

export async function editorText(page: Page): Promise<string> {
  return await page.evaluate(() => (window as any).__studio.getText());
}
