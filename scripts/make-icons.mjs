import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const svgPath = path.join(root, 'public/favicon.svg');
const icoPath = path.join(root, 'public/favicon.ico');
const touchPath = path.join(root, 'public/apple-touch-icon.png');

const svg = fs.readFileSync(svgPath, 'utf-8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const browser = await chromium.launch();
const context = await browser.newContext({ colorScheme: 'light' });
const page = await context.newPage();

// 1. 32x32 transparent favicon PNG for ICO
await page.setViewportSize({ width: 32, height: 32 });
await page.setContent(
  `<body style="margin:0; padding:0; overflow:hidden;"><img src="${dataUrl}" width="32" height="32" style="display:block;"></body>`,
);
const png32 = await page.screenshot({ omitBackground: true, type: 'png' });

// 2. Build .ico file
const icoHeader = Buffer.alloc(22);
// Header
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Image type (1 = icon)
icoHeader.writeUInt16LE(1, 4); // Number of images (1)
// Directory Entry
icoHeader.writeUInt8(32, 6); // Width
icoHeader.writeUInt8(32, 7); // Height
icoHeader.writeUInt8(0, 8); // Color count
icoHeader.writeUInt8(0, 9); // Reserved
icoHeader.writeUInt16LE(1, 10); // Color planes
icoHeader.writeUInt16LE(32, 12); // Bits per pixel
icoHeader.writeUInt32LE(png32.length, 14); // Image size in bytes
icoHeader.writeUInt32LE(22, 18); // Offset to image data

const icoBuf = Buffer.concat([icoHeader, png32]);
fs.writeFileSync(icoPath, icoBuf);

// 3. 180x180 apple-touch-icon
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(
  `<body style="margin:0; background:#f5f5fa; padding:25px; box-sizing:border-box; width:180px; height:180px; overflow:hidden;"><img src="${dataUrl}" width="130" height="130" style="display:block;"></body>`,
);
const touchPng = await page.screenshot({ type: 'png' });
fs.writeFileSync(touchPath, touchPng);

await browser.close();

console.log(`Wrote ${icoPath} (${icoBuf.length} bytes)`);
console.log(`Wrote ${touchPath} (${touchPng.length} bytes)`);
