import type { ParsedDoc, Point, Scene } from '../core/types';
import { getEngine } from '../diagrams/registry';
import { computeBounds, computeGroups, layoutDoc } from './layout';
import { routeEdges } from './geometry';
import type { MeasureText } from './measure';

export function tryBuildScene(doc: ParsedDoc, measure: MeasureText): Scene | null {
  try {
    return buildScene(doc, measure);
  } catch {
    return null;
  }
}

export function buildScene(doc: ParsedDoc, measure: MeasureText): Scene {
  const kind = doc.kind ?? 'flowchart';
  if (kind !== 'flowchart') {
    const engine = getEngine(kind);
    if (engine?.layout) return { doc, layout: engine.layout(doc, measure) };
  }

  if (doc.nodes.length === 0) {
    const layout = layoutDoc(doc, measure);
    return { doc, layout };
  }

  const layout = layoutDoc(doc, measure);
  const edges = routeEdges(doc, layout.nodes, layout.groups);
  const bounds = computeBounds(doc, { ...layout, edges }, measure);

  return {
    doc,
    layout: {
      ...layout,
      edges,
      bounds,
    },
  };
}

export function withNodeAt(
  scene: Scene,
  nodeId: string,
  center: Point,
  measure: MeasureText,
): Scene {
  const nodes = { ...scene.layout.nodes };
  if (nodes[nodeId]) {
    nodes[nodeId] = {
      ...nodes[nodeId],
      center: { ...center },
    };
  }

  const groups = computeGroups(scene.doc, nodes);
  const edges = routeEdges(scene.doc, nodes, groups);
  const bounds = computeBounds(
    scene.doc,
    { nodes, groups, edges, bounds: scene.layout.bounds, title: scene.layout.title },
    measure,
  );

  return {
    doc: scene.doc,
    layout: {
      nodes,
      groups,
      edges,
      bounds,
      title: scene.layout.title,
    },
  };
}
