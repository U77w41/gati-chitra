import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const base = process.env.BASE_PATH ?? '/';
const dist = 'dist';
const INITIAL_JS_BUDGET_KB = 150;
const LAZY_CHUNK_BUDGET_KB = 80;

const htmlPath = path.join(dist, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error(`dist/index.html not found`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const refs = new Set();

const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+\.js)["']/g;
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  refs.add(m[1]);
}

const linkRegex1 = /<link\b[^>]*\bhref=["']([^"']+\.js)["'][^>]*\brel=["']modulepreload["']/g;
while ((m = linkRegex1.exec(html)) !== null) {
  refs.add(m[1]);
}

const linkRegex2 = /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+\.js)["']/g;
while ((m = linkRegex2.exec(html)) !== null) {
  refs.add(m[1]);
}

if (refs.size === 0) {
  console.error('No script found in dist/index.html');
  process.exit(1);
}

let totalGz = 0;
const initialFiles = new Set();

for (const ref of refs) {
  if (!ref.startsWith(base)) {
    console.error(`Asset URL does not start with BASE_PATH: ${ref}`);
    process.exit(1);
  }

  const relative = ref.slice(base.length);
  const filePath = path.join(dist, relative);
  initialFiles.add(path.resolve(filePath));

  if (!fs.existsSync(filePath)) {
    console.error(`Asset file not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath);
  const gz = zlib.gzipSync(content, { level: 9 }).length;
  totalGz += gz;
  console.log(`${relative}: ${(gz / 1024).toFixed(2)} KB (gzip)`);
}

console.log(`Total initial JS: ${(totalGz / 1024).toFixed(2)} KB (gzip)`);

if (totalGz > INITIAL_JS_BUDGET_KB * 1024) {
  console.error(`Initial JavaScript is over the ${INITIAL_JS_BUDGET_KB} KB budget`);
  process.exit(1);
}

const assetsDir = path.join(dist, 'assets');
let largestLazy = null;

if (fs.existsSync(assetsDir)) {
  const assetFiles = fs.readdirSync(assetsDir);
  for (const file of assetFiles) {
    if (!file.endsWith('.js')) continue;
    const filePath = path.resolve(path.join(assetsDir, file));
    if (initialFiles.has(filePath)) continue;

    const content = fs.readFileSync(filePath);
    const gz = zlib.gzipSync(content, { level: 9 }).length;
    const sizeKb = gz / 1024;

    if (!largestLazy || sizeKb > largestLazy.sizeKb) {
      largestLazy = { name: file, sizeKb };
    }

    if (gz > LAZY_CHUNK_BUDGET_KB * 1024) {
      console.error(`Lazy chunk ${file} is over the ${LAZY_CHUNK_BUDGET_KB} KB budget`);
      process.exit(1);
    }
  }
}

if (largestLazy) {
  console.log(`Largest lazy chunk: ${largestLazy.name} ${largestLazy.sizeKb.toFixed(2)} KB (gzip)`);
}

const templatesIndexPath = path.join(dist, 'templates', 'index.json');
if (!fs.existsSync(templatesIndexPath)) {
  console.error(`Missing ${templatesIndexPath}`);
  process.exit(1);
}

const templates = JSON.parse(fs.readFileSync(templatesIndexPath, 'utf8'));
for (const entry of templates) {
  const tFile = path.join(dist, 'templates', entry.file);
  if (!fs.existsSync(tFile)) {
    console.error(`Missing template file: ${tFile}`);
    process.exit(1);
  }
}

// 7. Check that brand assets exist in dist/
const brandFiles = ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'theme-init.js'];
for (const file of brandFiles) {
  const p = path.join(dist, file);
  if (!fs.existsSync(p)) {
    console.error(`Missing brand asset in dist: ${file}`);
    process.exit(1);
  }
}

// 8. Check that base URLs are applied in dist/index.html
const expectedAttrs = [
  `href="${base}favicon.svg"`,
  `href="${base}favicon.ico"`,
  `href="${base}apple-touch-icon.png"`,
  `src="${base}theme-init.js"`,
];
for (const expected of expectedAttrs) {
  if (!html.includes(expected)) {
    console.error(`Expected ${expected} in dist/index.html`);
    process.exit(1);
  }
}

// 9. Check that dist/index.html contains no %VITE_ placeholder
if (html.includes('%VITE_')) {
  console.error('Unreplaced environment placeholder in dist/index.html');
  process.exit(1);
}

// 10. Check that manifest.webmanifest and icons exist in dist/
const manifestPath = path.join(dist, 'manifest.webmanifest');
if (!fs.existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath}`);
  process.exit(1);
}

const manifestIcons = [
  path.join(dist, 'icons', 'icon-192.png'),
  path.join(dist, 'icons', 'icon-512.png'),
  path.join(dist, 'icons', 'icon-maskable-512.png'),
];
for (const iconPath of manifestIcons) {
  if (!fs.existsSync(iconPath)) {
    console.error(`Missing manifest icon: ${iconPath}`);
    process.exit(1);
  }
}

if (!html.includes(`<link rel="manifest" href="${base}manifest.webmanifest"`)) {
  console.error(`Expected <link rel="manifest" href="${base}manifest.webmanifest" in dist/index.html`);
  process.exit(1);
}

// 11. Check that sw.js exists, under 4 KB gzip, no unreplaced placeholders, precached URLs exist
const swPath = path.join(dist, 'sw.js');
if (!fs.existsSync(swPath)) {
  console.error(`Missing ${swPath}`);
  process.exit(1);
}

const swContent = fs.readFileSync(swPath, 'utf8');
const swGz = zlib.gzipSync(Buffer.from(swContent), { level: 9 }).length;
if (swGz > 4 * 1024) {
  console.error(`dist/sw.js is over 4 KB gzip budget: ${(swGz / 1024).toFixed(2)} KB`);
  process.exit(1);
}

if (swContent.includes('__PRECACHE__')) {
  console.error('dist/sw.js contains unreplaced __PRECACHE__');
  process.exit(1);
}

if (swContent.includes('__BUILD_ID__')) {
  console.error('dist/sw.js contains unreplaced __BUILD_ID__');
  process.exit(1);
}

const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const precachedUrls = [...swContent.matchAll(new RegExp(`"(${escapedBase}[^"]*)"`, 'g'))].map((match) => match[1]);
if (precachedUrls.length === 0) {
  console.error('No precached URLs found in dist/sw.js');
  process.exit(1);
}

for (const url of precachedUrls) {
  const rel = url.slice(base.length);
  const target = rel === '' ? path.join(dist, 'index.html') : path.join(dist, rel);
  if (!fs.existsSync(target)) {
    console.error(`Precached URL does not exist in dist: ${url} (checked ${target})`);
    process.exit(1);
  }
}

// 12. Check 404.html, sitemap.xml, og-image.png, and structured data
const notFoundPath = path.join(dist, '404.html');
if (!fs.existsSync(notFoundPath)) {
  console.error(`Missing ${notFoundPath}`);
  process.exit(1);
}
const notFoundHtml = fs.readFileSync(notFoundPath, 'utf8');
if (!notFoundHtml.includes(`href="${base}"`)) {
  console.error(`Expected href="${base}" in dist/404.html`);
  process.exit(1);
}

const siteUrl = process.env.VITE_SITE_URL;
if (siteUrl) {
  const sitemapPath = path.join(dist, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error(`Missing ${sitemapPath}`);
    process.exit(1);
  }
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemapXml.includes(`<loc>${siteUrl}</loc>`)) {
    console.error(`Expected <loc>${siteUrl}</loc> in dist/sitemap.xml`);
    process.exit(1);
  }
}

const ogPath = path.join(dist, 'og-image.png');
if (!fs.existsSync(ogPath)) {
  console.error(`Missing ${ogPath}`);
  process.exit(1);
}
const ogBuf = fs.readFileSync(ogPath);
if (ogBuf.readUInt32BE(16) !== 1200 || ogBuf.readUInt32BE(20) !== 630) {
  console.error(`Expected 1200x630 in dist/og-image.png, got ${ogBuf.readUInt32BE(16)}x${ogBuf.readUInt32BE(20)}`);
  process.exit(1);
}

if (!html.includes('summary_large_image')) {
  console.error('Expected summary_large_image in dist/index.html');
  process.exit(1);
}

if (!html.includes('application/ld+json')) {
  console.error('Expected application/ld+json in dist/index.html');
  process.exit(1);
}

console.log('OK');
process.exit(0);
