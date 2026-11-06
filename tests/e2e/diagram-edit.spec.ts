import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

export const CASES: { kind: string; file: string; nodeId: string; newLabel: string; canAdd: boolean; canDelete: boolean }[] = [
  { kind: 'state', file: 'state.mmd', nodeId: 'Paying', newLabel: 'Charging', canAdd: true, canDelete: true },
  { kind: 'class', file: 'class.mmd', nodeId: 'Fish', newLabel: 'Trout', canAdd: true, canDelete: true },
  { kind: 'er', file: 'er.mmd', nodeId: 'PRODUCT', newLabel: 'Item', canAdd: true, canDelete: true },
  { kind: 'requirement', file: 'requirement.mmd', nodeId: 'load_test', newLabel: 'soak_test', canAdd: true, canDelete: true },
  { kind: 'usecase', file: 'usecase.mmd', nodeId: 'Pay', newLabel: 'Pay online', canAdd: true, canDelete: true },
  { kind: 'architecture', file: 'architecture.mmd', nodeId: 'files', newLabel: 'Blobs', canAdd: true, canDelete: true },
  { kind: 'sequence', file: 'sequence.mmd', nodeId: 'P', newLabel: 'Bank', canAdd: true, canDelete: true },
  { kind: 'gitgraph', file: 'gitgraph.mmd', nodeId: 'c3', newLabel: 'urgent fix', canAdd: true, canDelete: true },
];

async function load(page: Page, file: string): Promise<void> {
  const text = fs.readFileSync(path.join('public/templates', file), 'utf8');
  await page.evaluate((t) => (window as any).__studio.setText(t), text);
  await expect.poll(() => page.evaluate(() => (window as any).__studio.getSummary().ok), { timeout: 10_000 }).toBe(true);
}

for (const c of CASES) {
  test(`${c.kind}: rename, delete and add on the canvas write the text`, async ({ page }) => {
    await page.goto('./?e2e=1');
    await load(page, c.file);
    const initialSummary = await page.evaluate(() => (window as any).__studio.getSummary());
    const initialCount = initialSummary.nodes.length;

    const center = await page.evaluate((id) => (window as any).__studio.getNodeScreenCenter(id), c.nodeId);
    expect(center).not.toBeNull();
    await page.mouse.dblclick(center.x, center.y);
    const inlineEdit = page.locator('#inline-edit');
    await expect(inlineEdit).toBeVisible();
    await inlineEdit.fill(c.newLabel);
    await page.keyboard.press('Enter');
    await expect.poll(async () => {
      const text = await page.evaluate(() => (window as any).__studio.getText());
      const sum = await page.evaluate(() => (window as any).__studio.getSummary());
      return text.includes(c.newLabel) && sum.ok;
    }).toBe(true);

    if (c.canDelete) {
      const deleteId = (await page.evaluate((id) => (window as any).__studio.getNodeScreenCenter(id), c.nodeId))
        ? c.nodeId
        : c.newLabel;
      const currentCenter = await page.evaluate((id) => (window as any).__studio.getNodeScreenCenter(id), deleteId);
      expect(currentCenter).not.toBeNull();
      await page.mouse.click(currentCenter.x, currentCenter.y);
      await page.keyboard.press('Delete');
      await expect.poll(async () => {
        const sum = await page.evaluate(() => (window as any).__studio.getSummary());
        return sum.ok && sum.nodes.length < initialCount;
      }).toBe(true);
    }

    if (c.canAdd) {
      const beforeAddCount = (await page.evaluate(() => (window as any).__studio.getSummary())).nodes.length;
      await page.click('#btn-add-node');
      await expect.poll(async () => {
        const sum = await page.evaluate(() => (window as any).__studio.getSummary());
        return sum.ok && sum.nodes.length === beforeAddCount + 1;
      }).toBe(true);
    }
  });
}
