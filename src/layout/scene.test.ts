import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { buildScene, withNodeAt } from './scene';
import { testMeasure } from '../../tests/support/measure';
import { CORPUS } from '../../tests/support/corpus';
import { LAYOUT } from '../core/constants';

describe('scene', () => {
  it('buildScene bounds contain every node rectangle, edge label chip and edge end point', () => {
    const scene = buildScene(parseMermaid(CORPUS[0].text), testMeasure);
    const b = scene.layout.bounds;

    // Node rectangles
    for (const node of Object.values(scene.layout.nodes)) {
      const left = node.center.x - node.width / 2;
      const right = node.center.x + node.width / 2;
      const top = node.center.y - node.height / 2;
      const bottom = node.center.y + node.height / 2;

      expect(left).toBeGreaterThanOrEqual(b.x);
      expect(right).toBeLessThanOrEqual(b.x + b.width + 0.001);
      expect(top).toBeGreaterThanOrEqual(b.y);
      expect(bottom).toBeLessThanOrEqual(b.y + b.height + 0.001);
    }

    // Edges
    for (const edge of scene.doc.edges) {
      const path = scene.layout.edges[edge.id];
      expect(path).toBeDefined();

      for (const pt of [path.from, path.to, path.control].filter(Boolean)) {
        expect(pt!.x).toBeGreaterThanOrEqual(b.x - 0.001);
        expect(pt!.x).toBeLessThanOrEqual(b.x + b.width + 0.001);
        expect(pt!.y).toBeGreaterThanOrEqual(b.y - 0.001);
        expect(pt!.y).toBeLessThanOrEqual(b.y + b.height + 0.001);
      }

      if (edge.label && edge.label.length > 0) {
        const chipW = testMeasure(edge.label, LAYOUT.edgeLabelFontSize) + 2 * LAYOUT.edgeLabelPadX;
        const chipH = LAYOUT.edgeLabelH;
        const cx = path.labelPoint.x;
        const cy = path.labelPoint.y;

        expect(cx - chipW / 2).toBeGreaterThanOrEqual(b.x - 0.001);
        expect(cx + chipW / 2).toBeLessThanOrEqual(b.x + b.width + 0.001);
        expect(cy - chipH / 2).toBeGreaterThanOrEqual(b.y - 0.001);
        expect(cy + chipH / 2).toBeLessThanOrEqual(b.y + b.height + 0.001);
      }
    }
  });

  it('withNodeAt moves the node, updates edge endpoints and does not mutate the original scene', () => {
    const origScene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure);
    const origCenterB = { ...origScene.layout.nodes.B.center };
    const origToE0 = { ...origScene.layout.edges.e0.to };

    const newScene = withNodeAt(origScene, 'B', { x: 300, y: 300 }, testMeasure);

    expect(newScene.layout.nodes.B.center).toEqual({ x: 300, y: 300 });
    expect(newScene.layout.edges.e0.to).not.toEqual(origToE0);

    // Original scene must not be mutated
    expect(origScene.layout.nodes.B.center).toEqual(origCenterB);
    expect(origScene.layout.edges.e0.to).toEqual(origToE0);
  });

  it('buildScene works for a 300-node chain in under 2000 ms', () => {
    const chainLines = ['flowchart TD'];
    for (let i = 0; i < 299; i++) {
      chainLines.push(`  N${i} --> N${i + 1}`);
    }
    const doc = parseMermaid(chainLines.join('\n'));

    const start = Date.now();
    const scene = buildScene(doc, testMeasure);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
    expect(Object.keys(scene.layout.nodes).length).toBe(300);
    expect(Object.keys(scene.layout.edges).length).toBe(299);
  });
});
