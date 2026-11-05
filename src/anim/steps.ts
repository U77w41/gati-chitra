import type { Focus, ParsedDoc } from '../core/types';
import { animStages } from './stages';

export interface Step {
  nodes: string[];
  edges: string[];
}

export function buildSteps(doc: ParsedDoc): Step[] {
  if (doc.nodes.length === 0) return [];
  const st = animStages(doc);

  const steps: Step[] = Array.from({ length: st.count }, () => ({
    nodes: [],
    edges: [],
  }));

  for (const node of doc.nodes) {
    const s = st.node[node.id] ?? 0;
    if (steps[s]) steps[s].nodes.push(node.id);
  }

  for (const edge of doc.edges) {
    if (edge.kind === 'invisible') continue;
    const targetStep = doc.stages
      ? st.edge[edge.id] ?? 0
      : Math.min((st.node[edge.from] ?? 0) + 1, st.count - 1);
    if (steps[targetStep]) steps[targetStep].edges.push(edge.id);
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
