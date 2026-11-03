import { test, expect } from '@playwright/test';
import { encodeShare } from '../../src/share/share';
import { MESSAGES } from '../../src/core/constants';
import { editorText, setEditorText } from '../support/editor';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test.describe('Share links and templates', () => {
  test('shares diagram and loads it via URL hash without overwriting storage until edited', async ({
    page,
    context,
    browserName,
  }) => {
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    // Initial state: autosave will save sample
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nA-->B');
    });
    // Wait for autosave (500ms debounce)
    await page.waitForTimeout(700);

    // Now change to P-->Q and share
    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart LR\nP-->Q');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-share');

    const shareInput = page.locator('#share-url');
    await expect(shareInput).toHaveValue(/#v1=/);
    const resolvedUrl = await shareInput.inputValue();

    // Open shared URL in a new page with previously autosaved diagram A-->B
    const page2 = await context.newPage();
    await page2.addInitScript(() => {
      localStorage.setItem('gati-chitra:v1:doc', 'flowchart TD\nA-->B');
    });
    await page2.goto(resolvedUrl);
    await page2.waitForTimeout(300);

    expect(await editorText(page2)).toBe('flowchart LR\nP-->Q');
    expect(page2.url()).not.toContain('#');

    // Reload page2: should restore autosaved diagram (A-->B), not the shared one
    await page2.reload();
    await page2.waitForTimeout(300);
    expect(await editorText(page2)).toBe('flowchart TD\nA-->B');
  });

  test('shows error message on invalid share link and falls back to default', async ({ page }) => {
    await page.goto('./?e2e=1#v1=!!!');
    await page.waitForTimeout(300);

    await expect(page.locator('#message')).toContainText(
      'The share link could not be read. Showing the sample diagram.',
    );
    expect(await editorText(page)).not.toBe('');
  });

  test('opens template gallery and loads selected template', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await page.click('#btn-templates');
    const gallery = page.locator('#gallery');
    await expect(gallery).toBeVisible();

    const buttons = gallery.locator('.template');
    await expect(buttons).toHaveCount(5);

    await gallery.getByText('Data pipeline').click();
    await expect(gallery).toBeHidden();

    const sourceText = await editorText(page);
    expect(sourceText).toContain('subgraph ingest');
  });

  test('supports uncompressed fallback when CompressionStream is unavailable (Review Focus 5)', async ({
    page,
    context,
    browserName,
  }) => {
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await page.addInitScript(() => {
      // @ts-ignore
      delete window.CompressionStream;
      // @ts-ignore
      delete window.DecompressionStream;
    });

    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      (window as any).__studio.setText('flowchart TD\nPlain-->Fallback');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-share');

    const shareInput = page.locator('#share-url');
    await expect(shareInput).toHaveValue(/#v1p=/);
    const shareUrl = await shareInput.inputValue();

    const page2 = await context.newPage();
    await page2.addInitScript(() => {
      // @ts-ignore
      delete window.CompressionStream;
      // @ts-ignore
      delete window.DecompressionStream;
    });
    await page2.goto(shareUrl);
    await page2.waitForTimeout(300);

    expect(await editorText(page2)).toBe('flowchart TD\nPlain-->Fallback');
  });

  test('shows error when diagram is too large for share link', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    // 15000 random characters using seeded PRNG so it cannot compress under SHARE.maxUrlChars
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const rng = mulberry32(7);
    let rand = '';
    for (let i = 0; i < 15000; i++) {
      rand += chars[Math.floor(rng() * chars.length)];
    }
    await page.evaluate((text) => {
      (window as any).__studio.setText(text);
    }, `flowchart TD\nA["${rand}"]`);
    await page.waitForTimeout(400);

    await page.click('#btn-share');
    await expect(page.locator('#message')).toContainText(
      'This diagram is too large for a link. Save it as a .mmd file instead.',
    );
  });

  test('duplicate subgraph ids in share link do not break the app', async ({ page }) => {
    const enc = (await encodeShare('flowchart TD\nsubgraph X\nsubgraph X\nA\nend\nend')) as { hash: string };
    await page.goto(`./?e2e=1#${enc.hash}`);
    await page.waitForTimeout(300);
    const summary = await page.evaluate(() => (window as any).__studio.getSummary());
    expect(summary.nodes).toContain('A');
    expect(await page.locator('#btn-share').isEnabled()).toBe(true);
  });

  test('share link keeps the autosave undoable', async ({ page, context }) => {
    const enc = (await encodeShare('flowchart TD\nSharedDiagram')) as { hash: string };

    await page.addInitScript(() => {
      localStorage.setItem('gati-chitra:v1:doc', 'flowchart TD\nSavedDiagram');
    });

    await page.goto(`./?e2e=1#${enc.hash}`);
    await page.waitForTimeout(300);

    await expect(page.locator('#message')).toHaveText(MESSAGES.shareOpened);
    expect(await editorText(page)).toContain('SharedDiagram');

    await page.locator('body').focus();
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForTimeout(200);

    expect(await editorText(page)).toBe('flowchart TD\nSavedDiagram');
  });

  test('a new hash loads', async ({ page }) => {
    const enc1 = (await encodeShare('flowchart TD\nDiagramOne')) as { hash: string };
    const enc2 = (await encodeShare('flowchart TD\nDiagramTwo')) as { hash: string };

    await page.goto(`./?e2e=1#${enc1.hash}`);
    await page.waitForTimeout(300);
    expect(await editorText(page)).toContain('DiagramOne');

    await page.evaluate((h) => {
      location.hash = h;
    }, enc2.hash);
    await page.waitForTimeout(300);
    expect(await editorText(page)).toContain('DiagramTwo');
  });

  test('typing right before a reload is kept', async ({ page }) => {
    await page.goto('./?e2e=1');
    await page.waitForTimeout(300);

    await setEditorText(page, 'flowchart TD\nKeptOnReload');
    await page.reload();
    await page.waitForTimeout(300);

    expect(await editorText(page)).toContain('KeptOnReload');
  });

  test('a second tab follows', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto('/?e2e=1');
    await page2.goto('/?e2e=1');
    await page1.waitForTimeout(300);
    await page2.waitForTimeout(300);

    await setEditorText(page2, 'flowchart TD\nSyncedToTab1');
    await page1.waitForTimeout(1200);
    expect(await editorText(page1)).toContain('SyncedToTab1');

    await setEditorText(page1, 'flowchart TD\nTab1Edits');
    await page1.waitForTimeout(500);

    await setEditorText(page2, 'flowchart TD\nTab2SecondChange');
    await page1.waitForTimeout(1200);

    const msg = page1.locator('#message');
    await expect(msg).toContainText(MESSAGES.changedInOtherTab);
    const loadBtn = msg.locator('button', { hasText: 'Load it' });
    await expect(loadBtn).toBeVisible();

    await loadBtn.click();
    await page1.waitForTimeout(200);
    expect(await editorText(page1)).toContain('Tab2SecondChange');
  });
});
