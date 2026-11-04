import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build as viteBuild, type Plugin } from 'vite';
import { precacheUrls } from '../src/sw/sw-logic';

function listPublicFiles(dir: string, baseDir: string = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...listPublicFiles(fullPath, baseDir));
    } else {
      result.push(path.relative(baseDir, fullPath));
    }
  }
  return result;
}

export function siteFilesPlugin(): Plugin {
  let siteUrl = '';

  return {
    name: 'site-files-plugin',
    configResolved(config) {
      siteUrl = process.env.VITE_SITE_URL || (config.env?.VITE_SITE_URL ?? '');
    },
    generateBundle() {
      if (siteUrl) {
        const date = new Date().toISOString().slice(0, 10);
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${date}</lastmod>
  </url>
</urlset>
`;
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: sitemap,
        });
      }
    },
  };
}

export function swPlugin(): Plugin {
  let base = '/';

  return {
    name: 'sw-plugin',
    configResolved(config) {
      base = config.base;
    },
    async generateBundle(_options, bundle) {
      const emittedFiles = Object.entries(bundle)
        .filter(([, v]) => !(v.type === 'chunk' && (!v.code || v.code.length === 0)))
        .map(([k]) => k);
      if (fs.existsSync('404.html')) {
        emittedFiles.push('404.html');
      }
      const publicFiles = listPublicFiles(path.resolve('public'));
      const allFiles = Array.from(new Set([...emittedFiles, ...publicFiles])).sort();

      const urls = precacheUrls(allFiles, base);
      const sortedUrls = [...urls].sort();
      const buildId = crypto
        .createHash('sha256')
        .update(sortedUrls.join('\n'))
        .digest('hex')
        .slice(0, 10);

      const buildResult = await viteBuild({
        configFile: false,
        logLevel: 'silent',
        build: {
          write: false,
          minify: true,
          lib: {
            entry: path.resolve('src/sw/sw.ts'),
            formats: ['iife'],
            name: 'gcsw',
            fileName: () => 'sw.js',
          },
        },
      });

      const rollupOutput = Array.isArray(buildResult) ? buildResult[0] : buildResult;
      const chunk = 'output' in rollupOutput ? rollupOutput.output[0] : null;
      let code = chunk && 'code' in chunk ? chunk.code : '';

      code = code
        .replaceAll('self.__PRECACHE__', JSON.stringify(urls))
        .replaceAll('self.__BUILD_ID__', JSON.stringify(buildId));

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: code,
      });
    },
  };
}
