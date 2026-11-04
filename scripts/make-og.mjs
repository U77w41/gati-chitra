import fs from 'node:fs';
import path from 'node:path';
import { preview } from 'vite';
import { chromium } from '@playwright/test';

const distPath = path.resolve('dist');
if (!fs.existsSync(distPath)) {
  console.error('dist does not exist. Run npm run build first.');
  process.exit(1);
}

const templatePath = path.resolve('public/templates/checkout.mmd');
if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}
const templateText = fs.readFileSync(templatePath, 'utf8');

const port = 4174;
const server = await preview({
  preview: { port },
});

try {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/?e2e=1`);
  await page.waitForFunction(() => window.__studio !== undefined);

  await page.evaluate((text) => {
    window.__studio?.setText(text);
  }, templateText);

  await page.waitForFunction(() => {
    const s = window.__studio?.getSummary();
    return Boolean(s?.ok && s.nodes.length > 0);
  });

  const dataUrl = await page.evaluate(async () => {
    return await window.__studio?.ogImage();
  });

  await browser.close();

  if (!dataUrl) {
    throw new Error('No image returned from ogImage');
  }

  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const outPath = path.resolve('public/og-image.png');
  fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
  console.log(`Wrote ${outPath}`);
} finally {
  await server.close();
}
