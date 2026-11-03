import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../core/constants';
import { parseMermaid } from '../mermaid/parse';
import { dagreRunCount, layoutDoc } from './layout';
import { testMeasure } from '../../tests/support/measure';
import { CORPUS } from '../../tests/support/corpus';
import type { SceneLayout } from '../core/types';

function L(text: string): SceneLayout {
  return layoutDoc(parseMermaid(text), testMeasure);
}

function assertNoOverlappingCenters(layout: SceneLayout): void {
  const nodeIds = Object.keys(layout.nodes);
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const a = layout.nodes[nodeIds[i]].center;
      const b = layout.nodes[nodeIds[j]].center;
      const same = a.x === b.x && a.y === b.y;
      expect(same).toBe(false);
    }
  }
}

describe('layout', () => {
  it('lays out basic directions correctly', () => {
    const tb = L('flowchart TD\nA-->B');
    expect(tb.nodes.B.center.y - tb.nodes.A.center.y).toBeGreaterThanOrEqual(100);
    expect(tb.nodes.B.center.y - tb.nodes.A.center.y).toBeLessThanOrEqual(140);
    expect(Math.abs(tb.nodes.B.center.x - tb.nodes.A.center.x)).toBeLessThan(1);

    const lr = L('flowchart LR\nA-->B');
    expect(lr.nodes.B.center.x).toBeGreaterThan(lr.nodes.A.center.x + 100);

    const bt = L('flowchart BT\nA-->B');
    expect(bt.nodes.B.center.y).toBeLessThan(bt.nodes.A.center.y);
  });

  it('respects pinned node positions', () => {
    const pinned = L('flowchart TD\nA-->B\n%% studio:pos B 500 500');
    expect(pinned.nodes.B.center).toEqual({ x: 500, y: 500 });
  });

  it('returns zero bounds for empty diagram', () => {
    expect(L('flowchart TD').bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('is deterministic over corpus diagram', () => {
    expect(L(CORPUS[0].text)).toEqual(L(CORPUS[0].text));
  });

  it('ensures every member box lies inside its group rectangle in CORPUS[1]', () => {
    const doc = parseMermaid(CORPUS[1].text);
    const layout = layoutDoc(doc, testMeasure);

    for (const node of doc.nodes) {
      if (node.group) {
        const group = layout.groups[node.group];
        expect(group).toBeDefined();
        const nb = layout.nodes[node.id];
        const nLeft = nb.center.x - nb.width / 2;
        const nRight = nb.center.x + nb.width / 2;
        const nTop = nb.center.y - nb.height / 2;
        const nBottom = nb.center.y + nb.height / 2;

        expect(nLeft).toBeGreaterThanOrEqual(group.rect.x);
        expect(nRight).toBeLessThanOrEqual(group.rect.x + group.rect.width);
        expect(nTop).toBeGreaterThanOrEqual(group.rect.y);
        expect(nBottom).toBeLessThanOrEqual(group.rect.y + group.rect.height);
      }
    }
  });

  it('ensures bounds contain every node and group rectangle', () => {
    for (const c of [CORPUS[0], CORPUS[1]]) {
      const layout = L(c.text);
      const b = layout.bounds;

      for (const node of Object.values(layout.nodes)) {
        const left = node.center.x - node.width / 2;
        const right = node.center.x + node.width / 2;
        const top = node.center.y - node.height / 2;
        const bottom = node.center.y + node.height / 2;

        expect(left).toBeGreaterThanOrEqual(b.x);
        expect(right).toBeLessThanOrEqual(b.x + b.width + 0.001);
        expect(top).toBeGreaterThanOrEqual(b.y);
        expect(bottom).toBeLessThanOrEqual(b.y + b.height + 0.001);
      }

      for (const g of Object.values(layout.groups)) {
        expect(g.rect.x).toBeGreaterThanOrEqual(b.x);
        expect(g.rect.x + g.rect.width).toBeLessThanOrEqual(b.x + b.width + 0.001);
        expect(g.rect.y).toBeGreaterThanOrEqual(b.y);
        expect(g.rect.y + g.rect.height).toBeLessThanOrEqual(b.y + b.height + 0.001);
      }
    }
  });

  it('satisfies Review Focus 2: handles cycles, multigraphs, self-loops, isolated nodes and large chains', () => {
    const cases = [
      'flowchart TD\nA-->A',
      'flowchart TD\nA-->B\nA-->B\nB-->A',
      'flowchart TD\nA-->B\nB-->C\nC-->A',
      'flowchart TD\nA\nB\nC',
    ];

    for (const code of cases) {
      const layout = L(code);
      if (Object.keys(layout.nodes).length > 1) {
        assertNoOverlappingCenters(layout);
      }
    }

    // 300-node chain: N0-->N1, N1-->N2, ..., N298-->N299
    const chainLines = ['flowchart TD'];
    for (let i = 0; i < 299; i++) {
      chainLines.push(`  N${i} --> N${i + 1}`);
    }
    const chainCode = chainLines.join('\n');

    const start = Date.now();
    const chainLayout = L(chainCode);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
    expect(Object.keys(chainLayout.nodes).length).toBe(300);
    assertNoOverlappingCenters(chainLayout);
  });

  it('moving a pin does not re-run dagre', () => {
    const a = parseMermaid('flowchart TD\nA --> B\nB --> C');
    const b = parseMermaid('flowchart TD\nA --> B\nB --> C\n%% studio:pos A 10 20');
    layoutDoc(a, testMeasure);
    const n = dagreRunCount();
    const lb = layoutDoc(b, testMeasure);
    expect(dagreRunCount()).toBe(n);
    expect(lb.nodes.A.center).toEqual({ x: 10, y: 20 });
  });

  it('longer links span more ranks', () => {
    const l = L('flowchart TD\nA --> B\nA ----> C');
    expect(l.nodes.C.center.y - l.nodes.A.center.y).toBeGreaterThan(
      l.nodes.B.center.y - l.nodes.A.center.y + LAYOUT.rankSep / 2,
    );
  });

  it('puts the title above the content', () => {
    const l = L('---\ntitle: Checkout\n---\nflowchart TD\nA');
    expect(l.title!.center.y).toBeLessThan(l.nodes.A.center.y - l.nodes.A.height / 2);
    expect(l.bounds.y).toBeLessThanOrEqual(l.title!.center.y - LAYOUT.titleFontSize / 2);
  });
});
