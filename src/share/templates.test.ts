import { beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DiagramKind } from '../core/types';
import { parseDocument } from '../diagrams/parse-any';
import { LOADERS, loadEngine } from '../diagrams/registry';
import {
  loadTemplate,
  loadTemplateIndex,
  templateUrl,
  type TemplateInfo,
} from './templates';

describe('templates', () => {
  beforeAll(async () => {
    for (const k of Object.keys(LOADERS)) await loadEngine(k as DiagramKind);
  });
  it('formats template URLs with single slashes', () => {
    expect(templateUrl('/', 'a.mmd')).toBe('/templates/a.mmd');
    expect(templateUrl('/gati-chitra/', 'a.mmd')).toBe('/gati-chitra/templates/a.mmd');
    expect(templateUrl('/gati-chitra', 'a.mmd')).toBe('/gati-chitra/templates/a.mmd');
  });

  it('loads template index with fake fetch', async () => {
    const fakeEntries: TemplateInfo[] = [
      { id: 't1', title: 'T1', file: 't1.mmd' },
      { id: 't2', title: 'T2', file: 't2.mmd' },
    ];
    const okFetch = async () =>
      ({
        ok: true,
        json: async () => fakeEntries,
      }) as unknown as Response;

    const res = await loadTemplateIndex('/', okFetch);
    expect(res).toEqual(fakeEntries);

    const failFetch = async () =>
      ({
        ok: false,
        status: 404,
      }) as unknown as Response;
    expect(await loadTemplateIndex('/', failFetch)).toEqual([]);

    const rejectingFetch = async () => {
      throw new Error('Network error');
    };
    expect(await loadTemplateIndex('/', rejectingFetch)).toEqual([]);
  });

  it('loads single template text with fake fetch', async () => {
    const okFetch = async () =>
      ({
        ok: true,
        text: async () => 'flowchart TD\nA-->B',
      }) as unknown as Response;
    const res = await loadTemplate('/', { id: 't1', title: 'T1', file: 't1.mmd' }, okFetch);
    expect(res).toBe('flowchart TD\nA-->B');

    const failFetch = async () =>
      ({
        ok: false,
        status: 500,
      }) as unknown as Response;
    expect(
      await loadTemplate('/', { id: 't1', title: 'T1', file: 't1.mmd' }, failFetch),
    ).toBeNull();
  });

  it('ensures every template file exists and parses successfully', () => {
    const indexPath = path.resolve(process.cwd(), 'public/templates/index.json');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const templates: TemplateInfo[] = JSON.parse(indexContent);
    expect(templates.length).toBeGreaterThanOrEqual(5);

    for (const item of templates) {
      const filePath = path.resolve(process.cwd(), 'public/templates', item.file);
      expect(fs.existsSync(filePath)).toBe(true);
      const text = fs.readFileSync(filePath, 'utf-8');
      const doc = parseDocument(text);
      expect(doc.ok).toBe(true);
    }
  });
});
