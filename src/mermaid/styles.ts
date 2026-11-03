import type { GraphEdge, GraphNode, StyleMap } from '../core/types';

export function parseStyleString(s: string): StyleMap {
  const result: StyleMap = {};
  if (!s || !s.trim()) return result;

  const parts = s.split(/,(?=\s*[A-Za-z-]+\s*:)/);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.slice(0, colonIdx).trim();
    if (!key) continue;
    let val = part.slice(colonIdx + 1).trim();
    if (val.endsWith(';')) {
      val = val.slice(0, -1).trim();
    }
    result[key] = val;
  }

  return result;
}

export interface QueuedClass {
  ids: string[];
  className: string;
}

export interface QueuedStyle {
  id: string;
  style: StyleMap;
}

export interface QueuedLinkStyle {
  target: 'default' | number[];
  style: StyleMap;
}

export function applyComputedStyles(
  nodes: GraphNode[],
  edges: GraphEdge[],
  classDefs: Record<string, StyleMap>,
  queuedClasses: QueuedClass[],
  queuedStyles: QueuedStyle[],
  queuedLinkStyles: QueuedLinkStyle[]
): void {
  for (const { ids, className } of queuedClasses) {
    for (const id of ids) {
      const node = nodes.find(n => n.id === id);
      if (node && !node.classNames.includes(className)) {
        node.classNames.push(className);
      }
    }
  }

  for (const node of nodes) {
    const effective: StyleMap = {};
    for (const c of node.classNames) {
      if (classDefs[c]) {
        Object.assign(effective, classDefs[c]);
      }
    }
    for (const qs of queuedStyles) {
      if (qs.id === node.id) {
        Object.assign(effective, qs.style);
      }
    }
    node.style = effective;
  }

  for (const edge of edges) {
    const effective: StyleMap = {};
    for (const qls of queuedLinkStyles) {
      if (qls.target === 'default' || qls.target.includes(edge.index)) {
        Object.assign(effective, qls.style);
      }
    }
    edge.style = effective;
  }
}
