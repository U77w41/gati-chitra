import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { buildSteps } from '../anim/steps';
import {
  borderPoint,
  handlePoint,
  hitTest,
  pointOnPath,
  routeEdges,
  shapePolygon,
  tangentAt,
} from './geometry';
import { buildScene } from './scene';
import { testMeasure } from '../../tests/support/measure';
import { CORPUS } from '../../tests/support/corpus';
import type { NodeBox } from '../core/types';

function box(id: string, x: number, y: number, w = 100, h = 40): NodeBox {
  return { id, center: { x, y }, width: w, height: h, lines: [id] };
}

describe('geometry', () => {
  it('calculates borderPoint and shapePolygon correctly', () => {
    expect(borderPoint(box('A', 0, 0), 'rect', { x: 200, y: 0 })).toEqual({ x: 50, y: 0 });
    expect(borderPoint(box('A', 0, 0), 'rect', { x: 0, y: 100 })).toEqual({ x: 0, y: 20 });
    expect(borderPoint(box('A', 0, 0), 'rect', { x: 100, y: 100 })).toEqual({ x: 20, y: 20 });
    expect(borderPoint(box('A', 0, 0, 60, 60), 'circle', { x: 100, y: 0 })).toEqual({
      x: 30,
      y: 0,
    });

    const dia = box('A', 0, 0, 100, 60);
    expect(borderPoint(dia, 'diamond', { x: 100, y: 0 })).toEqual({ x: 50, y: 0 });
    expect(borderPoint(dia, 'diamond', { x: 0, y: 100 })).toEqual({ x: 0, y: 30 });
    expect(borderPoint(dia, 'diamond', { x: 100, y: 100 }).x).toBeCloseTo(18.75);

    expect(borderPoint(box('A', 0, 0), 'parallelogram', { x: 100, y: 0 }).x).toBeCloseTo(43);
    expect(shapePolygon(box('A', 0, 0), 'rect')).toBeNull();
  });

  it.each(['trapezoid', 'trapezoidAlt', 'asymmetric'] as const)('%s polygon stays inside its box', (shape) => {
    const b = { id: 'A', center: { x: 0, y: 0 }, width: 100, height: 40, lines: ['x'] };
    for (const p of shapePolygon(b, shape)!) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(50);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(20);
    }
  });

  it.each(['doubleCircle', 'smallCircle', 'filledCircle', 'framedCircle'] as const)('%s border point is on the outer circle', (shape) => {
    const b = { id: 'A', center: { x: 0, y: 0 }, width: 40, height: 40, lines: [] };
    const p = borderPoint(b, shape, { x: 100, y: 0 });
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(20, 1);
  });

  it('routes straight, quad and loop edges correctly', () => {
    const nodes = { A: box('A', 0, 0), B: box('B', 0, 200) };
    const one = routeEdges(parseMermaid('flowchart TD\nA-->B'), nodes).e0;
    expect(one).toMatchObject({
      kind: 'straight',
      from: { x: 0, y: 20 },
      to: { x: 0, y: 180 },
      length: 160,
      labelPoint: { x: 0, y: 100 },
    });

    const two = routeEdges(parseMermaid('flowchart TD\nA-->B\nB-->A'), nodes);
    expect([two.e0.kind, two.e1.kind]).toEqual(['quad', 'quad']);
    expect([two.e0.control!.x, two.e1.control!.x]).toEqual([14, -14]);

    const three = routeEdges(parseMermaid('flowchart TD\nA-->B\nA-->B\nA-->B'), nodes);
    expect([three.e0.control!.x, three.e1.control!.x, three.e2.control!.x]).toEqual([28, 0, -28]);

    const loop = routeEdges(parseMermaid('flowchart TD\nA-->A'), nodes).e0;
    expect(loop).toMatchObject({ kind: 'loop', control: { x: 50 + 28, y: -20 - 28 } });
  });

  it('evaluates pointOnPath and tangentAt', () => {
    expect(
      pointOnPath(
        {
          id: 'e',
          kind: 'quad',
          from: { x: 0, y: 0 },
          control: { x: 0, y: 100 },
          to: { x: 100, y: 0 },
          labelPoint: { x: 0, y: 0 },
          length: 0,
        },
        0.5,
      ),
    ).toEqual({ x: 25, y: 50 });

    expect(
      tangentAt(
        {
          id: 'e',
          kind: 'straight',
          from: { x: 0, y: 0 },
          to: { x: 0, y: 10 },
          control: null,
          labelPoint: { x: 0, y: 0 },
          length: 10,
        },
        0.3,
      ),
    ).toEqual({ x: 0, y: 1 });
  });

  it('computes handlePoint for TB and LR', () => {
    const b = box('A', 10, 20, 100, 40);
    const tbDoc = parseMermaid('flowchart TD\nA');
    expect(handlePoint(tbDoc, b)).toEqual({ x: 10, y: 40 });

    const lrDoc = parseMermaid('flowchart LR\nA');
    expect(handlePoint(lrDoc, b)).toEqual({ x: 60, y: 20 });
  });

  it('performs hitTest for nodes, handles, edges and group titles', () => {
    const scene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure);

    // centre of A -> node A
    const aCenter = scene.layout.nodes.A.center;
    expect(hitTest(scene, aCenter, null)).toEqual({ kind: 'node', id: 'A' });

    // a point far outside -> null
    expect(hitTest(scene, { x: 9999, y: 9999 }, null)).toBeNull();

    // the midpoint of the edge -> edge e0
    const edgeMid = pointOnPath(scene.layout.edges.e0, 0.5);
    expect(hitTest(scene, edgeMid, null)).toEqual({ kind: 'edge', id: 'e0' });

    // with handleNodeId 'A', the handle point of A -> handle A
    const hp = handlePoint(scene.doc, scene.layout.nodes.A);
    expect(hitTest(scene, hp, 'A')).toEqual({ kind: 'handle', id: 'A' });

    // the title band of a group (CORPUS[1]) -> group ingest
    const scenePipeline = buildScene(parseMermaid(CORPUS[1].text), testMeasure);
    const ingestGroup = scenePipeline.layout.groups.ingest;
    const titlePoint = { x: ingestGroup.rect.x + 10, y: ingestGroup.rect.y + 5 };
    expect(hitTest(scenePipeline, titlePoint, null)).toEqual({ kind: 'group', id: 'ingest' });
  });

  it('invisible links place nodes but are not drawn or hit', () => {
    const s = buildScene(parseMermaid('flowchart LR\nA ~~~ B'), testMeasure);
    expect(s.layout.nodes.B.center.x).toBeGreaterThan(s.layout.nodes.A.center.x);
    expect(s.layout.edges).toEqual({});
    expect(buildSteps(s.doc).flatMap((st) => st.edges)).toEqual([]);
  });
});
