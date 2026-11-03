import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMermaid } from './parse';

const FIXTURES_DIR = path.resolve(__dirname, '../../tests/fixtures/compat');

const fixtureNames = [
  '01-classic-shapes',
  '02-new-shapes',
  '03-arrow-forms',
  '04-link-length',
  '05-invisible-links',
  '06-edge-animation',
  '07-ampersand-chains',
  '08-markdown-strings',
  '09-entity-codes',
  '10-subgraph-direction',
  '11-arrows-to-subgraphs',
  '12-click-links',
  '13-comments-directives',
  '14-frontmatter-title',
  '15-accessibility',
  '16-styles-classes',
  '17-several-statements',
  '18-unicode-ids',
  '19-ci-pipeline',
  '20-login-flow',
];

function read(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf-8');
}

function readJson(name: string): { nodes: number; edges: number; groups: number } {
  return JSON.parse(read(name));
}

describe('Mermaid compatibility corpus', () => {
  for (const name of fixtureNames) {
    it(`${name} parses cleanly`, () => {
      const d = parseMermaid(read(`${name}.mmd`));
      expect(d.diagnostics.filter(x => x.severity !== 'info')).toEqual([]);
      expect({ nodes: d.nodes.length, edges: d.edges.length, groups: d.groups.length }).toEqual(readJson(`${name}.json`));
    });

    it(`${name}: every prefix parses without throwing and keeps every line`, () => {
      const lines = read(`${name}.mmd`).split('\n');
      for (let i = 1; i <= lines.length; i++) {
        const text = lines.slice(0, i).join('\n');
        expect(parseMermaid(text).lines.map(l => l.text).join('\n')).toBe(text);
      }
    });
  }
});
