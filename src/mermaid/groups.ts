import type { GraphGroup, ParsedDoc } from '../core/types';

export function getSubtreeGroupIds(rootId: string, groups: GraphGroup[]): Set<string> {
  const result = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const g of groups) {
      if (g.parent && result.has(g.parent) && !result.has(g.id)) {
        result.add(g.id);
        added = true;
      }
    }
  }
  return result;
}

export function sealedGroups(doc: ParsedDoc): Set<string> {
  const sealed = new Set<string>();

  for (const group of doc.groups) {
    if (group.direction === null) continue;

    const subtreeGroups = getSubtreeGroupIds(group.id, doc.groups);
    const insideNodes = new Set(
      doc.nodes.filter(n => n.group !== null && subtreeGroups.has(n.group)).map(n => n.id)
    );

    const isInside = (endpoint: string, isGroup: boolean): boolean => {
      if (isGroup) {
        return subtreeGroups.has(endpoint);
      }
      return insideNodes.has(endpoint) || subtreeGroups.has(endpoint);
    };

    let hasOutsideEdge = false;
    for (const edge of doc.edges) {
      const fromIn = isInside(edge.from, edge.fromIsGroup);
      const toIn = isInside(edge.to, edge.toIsGroup);
      if (fromIn !== toIn) {
        hasOutsideEdge = true;
        break;
      }
    }

    if (!hasOutsideEdge) {
      sealed.add(group.id);
    }
  }

  return sealed;
}
