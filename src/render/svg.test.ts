import { describe, expect, it } from 'vitest';
import { THEMES } from './themes';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import { CORPUS } from '../../tests/support/corpus';
import { escapeXml, fmt, renderSvg, type SvgOptions } from './svg';
import type { Theme } from '../core/types';

function svg(text: string, opts?: Partial<SvgOptions>, theme?: Theme): string {
  const doc = parseMermaid(text);
  const scene = buildScene(doc, testMeasure);
  const fullOpts: SvgOptions = {
    mode: 'content',
    transparent: false,
    ...opts,
  };
  return renderSvg(scene, theme ?? THEMES.daylight, fullOpts, testMeasure);
}

function count(s: string, needle: string): number {
  return s.split(needle).length - 1;
}

describe('SVG export', () => {
  it('formats numbers correctly with fmt', () => {
    expect(fmt(1.5)).toBe('1.5');
    expect(fmt(2)).toBe('2');
    expect(fmt(-0)).toBe('0');
    expect(fmt(3.14159)).toBe('3.14');
    expect(fmt(0.004)).toBe('0');
  });

  it('escapes XML special characters with escapeXml', () => {
    expect(escapeXml(`a&b<c>"d'`)).toBe('a&amp;b&lt;c&gt;&quot;d&apos;');
  });

  it('renders standard document structure for a simple graph', () => {
    const s = svg('flowchart TD\nA[Start] --> B{Check}');
    expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(s.endsWith('</svg>')).toBe(true);
    expect(s).toContain('<title id="gc-title">Flowchart</title>');
    expect(s).toContain('>Start</text>');
    expect(s).toContain('>Check</text>');
    expect(count(s, '<rect ')).toBe(2);
    expect(count(s, '<polygon ')).toBe(2);
    expect(count(s, '<path ')).toBe(1);
  });

  it('escapes XML entities in node labels (Review Focus 4)', () => {
    const sXml = svg('flowchart TD\nA["a & b < c"]');
    expect(sXml).toContain('a &amp; b &lt; c');
    expect(sXml).not.toContain('a & b');
  });

  it('SVG draws two rings for a double circle and fills a junction', () => {
    const s = svg('flowchart TD\nA(((x)))\nB@{ shape: f-circ }');
    expect(s.match(/<circle/g)!.length).toBeGreaterThanOrEqual(3);
    expect(s).toMatch(/<circle[^>]*fill="(?!none)/);
  });

  it('renders dashed and thick edge strokes', () => {
    expect(svg('flowchart TD\nA -.-> B')).toContain('stroke-dasharray="3 5"');
    expect(svg('flowchart TD\nA ==> B')).toContain('stroke-width="4"');
  });

  it('supports transparent background', () => {
    const sTrans = svg('flowchart TD\nA --> B', { mode: 'content', transparent: true });
    const sOpaque = svg('flowchart TD\nA --> B', { mode: 'content', transparent: false });
    expect(count(sTrans, '<rect ')).toBe(count(sOpaque, '<rect ') - 1);
    expect(sTrans).not.toContain('url(#bg)');
  });

  it('supports gradient theme (Lagoon)', () => {
    const sLagoon = svg('flowchart TD\nA', { mode: 'content', transparent: false }, THEMES.lagoon);
    expect(sLagoon).toContain('<linearGradient id="bg"');
    expect(sLagoon).toContain('fill="url(#bg)"');
  });

  it('supports slide mode dimensions', () => {
    const sSlide = svg('flowchart TD\nA', { mode: 'slide', transparent: false });
    expect(sSlide).toContain('width="1280" height="720"');
  });

  it('renders cylinder and subroutine node shapes', () => {
    expect(count(svg('flowchart TD\nA[(DB)]'), '<path ')).toBe(2);
    expect(count(svg('flowchart TD\nA[[S]]'), '<line ')).toBe(2);
  });

  it('renders circle end and bidirectional arrowheads', () => {
    expect(svg('flowchart TD\nA --o B')).toContain('<circle ');
    const sBi = svg('flowchart TD\nA <--> B');
    expect(count(sBi, '<polygon ')).toBe(2);
  });

  it('renders edge labels', () => {
    expect(svg('flowchart TD\nA -->|yes| B')).toContain('>yes</text>');
  });

  it('produces valid and deterministic SVG across all ok CORPUS diagrams', () => {
    for (const c of CORPUS) {
      if (c.ok) {
        const res = svg(c.text);
        expect(res).not.toContain('NaN');
        expect(res).not.toContain('undefined');
        expect(res).not.toContain('Infinity');
        expect(res).not.toContain('-0 ');
        expect(count(res, '<text ')).toBeGreaterThanOrEqual(c.nodes);
        expect(svg(c.text)).toBe(res);
      }
    }
  });

  it('two-ended kinds draw two markers', () => {
    expect(svg('flowchart LR\nA o--o B').match(/class="marker-circle"/g)).toHaveLength(2);
    expect(svg('flowchart LR\nA x--x B').match(/class="marker-cross"/g)).toHaveLength(2);
    expect(svg('flowchart LR\nA <-.-> B').match(/class="marker-arrow"/g)).toHaveLength(2);
  });

  it('writes tspans in SVG', () => {
    expect(svg('flowchart TD\nA["`**Hi** there`"]')).toContain(
      '<tspan font-weight="bold">Hi</tspan><tspan> there</tspan>',
    );
  });

  it('writes accessible SVG with safe links', () => {
    const s = svg('flowchart TD\naccTitle: Orders\nA\nclick A "https://x.org/?a=1&b=2" "Tip" _blank');
    expect(s).toContain('<title id="gc-title">Orders</title>');
    expect(s).toContain('<a href="https://x.org/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer"><title>Tip</title>');
  });

  it('draws label pills', () => {
    expect(svg('flowchart LR\nA -->|yes| B')).toMatch(/<rect[^>]*rx="6"/);
  });

  it('writes extra markers in SVG', () => {
    const doc = parseMermaid('flowchart LR\nA --- B');
    doc.edges[0].markers = { start: 'none', end: 'triangle' };
    expect(renderSvg(buildScene(doc, testMeasure), THEMES.daylight, { mode: 'content', transparent: false }, testMeasure)).toContain('class="marker-extra"');
  });
});
