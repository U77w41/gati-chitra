import type { ParsedDoc } from '../core/types';
import { computeDepths } from '../render/prepared';

export interface Stages {
  node: Record<string, number>;
  edge: Record<string, number>;
  count: number;
}

export function animStages(doc: ParsedDoc): Stages {
  const node: Record<string, number> = {};
  const edge: Record<string, number> = {};

  if (doc.stages) {
    for (const n of doc.nodes) {
      node[n.id] = doc.stages.nodes[n.id] ?? 0;
    }
    for (const e of doc.edges) {
      edge[e.id] = doc.stages.edges[e.id] ?? node[e.from] ?? 0;
    }
  } else {
    const depths = computeDepths(doc);
    for (const n of doc.nodes) {
      node[n.id] = depths[n.id] ?? 0;
    }
    for (const e of doc.edges) {
      edge[e.id] = node[e.from] ?? 0;
    }
  }

  let maxVal = 0;
  for (const v of Object.values(node)) {
    if (v > maxVal) maxVal = v;
  }
  for (const v of Object.values(edge)) {
    if (v > maxVal) maxVal = v;
  }

  const count = 1 + Math.max(maxVal, 0);
  return { node, edge, count };
}
