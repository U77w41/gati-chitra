import type { Focus, ParsedDoc } from '../core/types';
import { computeDepths } from './anim';

export interface Step {
  nodes: string[];
  edges: string[];
}

export function buildSteps(doc: ParsedDoc): Step[] {
  if (doc.nodes.length === 0) return [];
  const depths = computeDepths(doc);
  let maxD = 0;
  for (const id of Object.keys(depths)) {
    if (depths[id] > maxD) maxD = depths[id];
  }

  const steps: Step[] = Array.from({ length: maxD + 1 }, () => ({
    nodes: [],
    edges: [],
  }));

  for (const node of doc.nodes) {
    const d = depths[node.id] ?? 0;
    steps[d].nodes.push(node.id);
  }

  for (const edge of doc.edges) {
    const fromDepth = depths[edge.from] ?? 0;
    const targetStep = Math.min(fromDepth + 1, maxD);
    steps[targetStep].edges.push(edge.id);
  }

  return steps;
}

export function focusAt(steps: Step[], index: number): Focus {
  if (steps.length === 0) {
    return { nodes: [], edges: [] };
  }
  const clamped = Math.max(0, Math.min(steps.length - 1, index));
  const nodes: string[] = [];
  const edges: string[] = [];
  for (let i = 0; i <= clamped; i++) {
    nodes.push(...steps[i].nodes);
    edges.push(...steps[i].edges);
  }
  return { nodes, edges };
}
