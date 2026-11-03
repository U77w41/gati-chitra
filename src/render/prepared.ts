import type { GraphEdge, ParsedDoc, Scene } from '../core/types';

export interface PreparedScene {
  depths: Record<string, number>;
  edgesById: Map<string, GraphEdge>;
  groupOrder: string[];
}

export function computeDepths(doc: ParsedDoc): Record<string, number> {
  const adj = new Map<string, string[]>();
  const incoming = new Map<string, number>();

  for (const node of doc.nodes) {
    adj.set(node.id, []);
    incoming.set(node.id, 0);
  }

  for (const edge of doc.edges) {
    if (edge.from !== edge.to) {
      adj.get(edge.from)?.push(edge.to);
      incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    }
  }

  const depths: Record<string, number> = {};
  const queue: string[] = [];

  for (const node of doc.nodes) {
    if ((incoming.get(node.id) ?? 0) === 0) {
      depths[node.id] = 0;
      queue.push(node.id);
    }
  }

  while (queue.length > 0) {
    const u = queue.shift()!;
    const currDepth = depths[u];
    for (const v of adj.get(u) ?? []) {
      if (depths[v] === undefined) {
        depths[v] = currDepth + 1;
        queue.push(v);
      }
    }
  }

  for (const node of doc.nodes) {
    if (depths[node.id] === undefined) {
      depths[node.id] = 0;
      queue.push(node.id);
      while (queue.length > 0) {
        const u = queue.shift()!;
        const currDepth = depths[u];
        for (const v of adj.get(u) ?? []) {
          if (depths[v] === undefined) {
            depths[v] = currDepth + 1;
            queue.push(v);
          }
        }
      }
    }
  }

  return depths;
}

const cache = new WeakMap<Scene, PreparedScene>();

export function prepare(scene: Scene): PreparedScene {
  const hit = cache.get(scene);
  if (hit) return hit;

  const depths = computeDepths(scene.doc);
  const edgesById = new Map<string, GraphEdge>();
  for (const edge of scene.doc.edges) {
    edgesById.set(edge.id, edge);
  }
  const groups = Object.values(scene.layout.groups);
  groups.sort((a, b) => a.depth - b.depth);
  const groupOrder = groups.map((g) => g.id);

  const entry: PreparedScene = { depths, edgesById, groupOrder };
  cache.set(scene, entry);
  return entry;
}
