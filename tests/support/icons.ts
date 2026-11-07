import { expect, type Locator, type Page } from '@playwright/test';

// Icon controls show only their icon; pointing at one widens it to show its name, and moving
// away hides the name again.
export async function expectHoverName(page: Page, control: Locator, name: string): Promise<void> {
  const label = control.locator('.action-label');
  await expect(label).toBeHidden();
  await control.hover();
  await expect(label).toBeVisible();
  await expect(label).toHaveText(name);
  await page.mouse.move(2, 400);
  await expect(label).toBeHidden();
}
