import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { DiagramKind } from '../core/types';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import { parseDocument } from './parse-any';
import { LOADERS, loadEngine } from './registry';
const DIR = path.resolve(__dirname, '../../tests/fixtures/diagrams');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.mmd'));
beforeAll(async () => { for (const k of Object.keys(LOADERS)) await loadEngine(k as DiagramKind); });
describe('diagram corpus', () => {
  for (const f of files) {
    it(`${f} parses with no errors or warnings and lays out`, () => {
      const text = fs.readFileSync(path.join(DIR, f), 'utf8');
      const want = JSON.parse(fs.readFileSync(path.join(DIR, f.replace(/\.mmd$/, '.json')), 'utf8'));
      const doc = parseDocument(text);
      expect(doc.diagnostics.filter((d) => d.severity !== 'info')).toEqual([]);
      expect({ kind: doc.kind, nodes: doc.nodes.length, edges: doc.edges.length, groups: doc.groups.length }).toEqual(want);
      expect(() => buildScene(doc, testMeasure)).not.toThrow();
    });
  }
});
