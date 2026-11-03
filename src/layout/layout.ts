import dagre from '@dagrejs/dagre';
import { LAYOUT } from '../core/constants';
import type { GraphGroup, GroupBox, NodeBox, ParsedDoc, Rect, SceneLayout } from '../core/types';
import { sizeNode, type MeasureText } from './measure';

let dagreRuns = 0;

export function dagreRunCount(): number {
  return dagreRuns;
}

export function computeGroups(
  doc: ParsedDoc,
  nodes: Record<string, NodeBox>,
): Record<string, GroupBox> {
  const groupMap = new Map<string, GraphGroup>();
  for (const group of doc.groups) {
    groupMap.set(group.id, group);
  }

  function getDepth(groupId: string): number {
    let depth = 0;
    let curr = groupMap.get(groupId);
    while (curr && curr.parent) {
      depth++;
      curr = groupMap.get(curr.parent);
    }
    return depth;
  }

  const groupsWithDepth = doc.groups.map((group) => ({
    group,
    depth: getDepth(group.id),
  }));

  groupsWithDepth.sort((a, b) => b.depth - a.depth);

  const groupBoxes: Record<string, GroupBox> = {};

  for (const { group, depth } of groupsWithDepth) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let count = 0;

    for (const node of doc.nodes) {
      if (node.group === group.id && nodes[node.id]) {
        const box = nodes[node.id];
        const left = box.center.x - box.width / 2;
        const right = box.center.x + box.width / 2;
        const top = box.center.y - box.height / 2;
        const bottom = box.center.y + box.height / 2;

        if (left < minX) minX = left;
        if (right > maxX) maxX = right;
        if (top < minY) minY = top;
        if (bottom > maxY) maxY = bottom;
        count++;
      }
    }

    for (const other of doc.groups) {
      if (other.parent === group.id && groupBoxes[other.id]) {
        const childBox = groupBoxes[other.id];
        const left = childBox.rect.x;
        const right = childBox.rect.x + childBox.rect.width;
        const top = childBox.rect.y;
        const bottom = childBox.rect.y + childBox.rect.height;

        if (left < minX) minX = left;
        if (right > maxX) maxX = right;
        if (top < minY) minY = top;
        if (bottom > maxY) maxY = bottom;
        count++;
      }
    }

    if (count === 0) {
      continue;
    }

    const rect: Rect = {
      x: minX - LAYOUT.groupPad,
      y: minY - LAYOUT.groupPad - LAYOUT.groupTitleH,
      width: maxX - minX + 2 * LAYOUT.groupPad,
      height: maxY - minY + 2 * LAYOUT.groupPad + LAYOUT.groupTitleH,
    };

    groupBoxes[group.id] = {
      id: group.id,
      rect,
      title: group.title,
      depth,
    };
  }

  return groupBoxes;
}

export function computeBounds(
  doc: ParsedDoc,
  layout: SceneLayout,
  measure: MeasureText,
): Rect {
  if (doc.nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const box of Object.values(layout.nodes)) {
    const left = box.center.x - box.width / 2;
    const right = box.center.x + box.width / 2;
    const top = box.center.y - box.height / 2;
    const bottom = box.center.y + box.height / 2;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
  }

  for (const gBox of Object.values(layout.groups)) {
    const left = gBox.rect.x;
    const right = gBox.rect.x + gBox.rect.width;
    const top = gBox.rect.y;
    const bottom = gBox.rect.y + gBox.rect.height;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
  }

  for (const edge of doc.edges) {
    const path = layout.edges[edge.id];
    if (!path) continue;

    for (const pt of [path.from, path.to, path.control]) {
      if (!pt) continue;
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    if (edge.label && edge.label.length > 0) {
      const chipW = measure(edge.label, LAYOUT.edgeLabelFontSize) + 2 * LAYOUT.edgeLabelPadX;
      const chipH = LAYOUT.edgeLabelH;
      const cx = path.labelPoint.x;
      const cy = path.labelPoint.y;
      const left = cx - chipW / 2;
      const right = cx + chipW / 2;
      const top = cy - chipH / 2;
      const bottom = cy + chipH / 2;

      if (left < minX) minX = left;
      if (right > maxX) maxX = right;
      if (top < minY) minY = top;
      if (bottom > maxY) maxY = bottom;
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function structureKey(doc: ParsedDoc, measure: MeasureText): string {
  const mSample = measure('W', 14);
  const nKey = doc.nodes.map((n) => `${n.id}\0${n.shape}\0${n.label}`).join('\x01');
  const eKey = doc.edges.map((e) => `${e.from}\0${e.to}\0${e.kind}\0${e.label}\0${(e as unknown as { length?: number }).length ?? 1}`).join('\x01');
  const gKey = doc.groups.map((g) => `${g.id}\0${g.parent ?? ''}\0${g.title}\0${g.direction ?? ''}`).join('\x01');
  return `${doc.direction}|${mSample}|${nKey}|${eKey}|${gKey}`;
}

interface LayoutCacheEntry {
  key: string;
  dagrePositions: Record<string, { x: number; y: number }>;
  sizedNodes: Record<string, { width: number; height: number; lines: string[] }>;
}

let lastEntry: LayoutCacheEntry | null = null;

export function layoutDoc(doc: ParsedDoc, measure: MeasureText): SceneLayout {
  if (doc.nodes.length === 0) {
    return {
      nodes: {},
      groups: {},
      edges: {},
      bounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  const key = structureKey(doc, measure);
  let dagrePositions: Record<string, { x: number; y: number }>;
  let sizedNodes: Record<string, { width: number; height: number; lines: string[] }>;

  if (lastEntry && lastEntry.key === key) {
    dagrePositions = lastEntry.dagrePositions;
    sizedNodes = lastEntry.sizedNodes;
  } else {
    sizedNodes = {};
    for (const node of doc.nodes) {
      sizedNodes[node.id] = sizeNode(node, measure, doc.direction);
    }

    const g = new dagre.graphlib.Graph({ compound: true, multigraph: true });
    g.setGraph({
      rankdir: doc.direction,
      nodesep: LAYOUT.nodeSep,
      ranksep: LAYOUT.rankSep,
      edgesep: LAYOUT.edgeSep,
      marginx: LAYOUT.margin,
      marginy: LAYOUT.margin,
    });
    g.setDefaultEdgeLabel(() => ({}));

    for (const group of doc.groups) {
      g.setNode('group:' + group.id, {});
      if (group.parent) {
        g.setParent('group:' + group.id, 'group:' + group.parent);
      }
    }

    for (const node of doc.nodes) {
      const sized = sizedNodes[node.id];
      g.setNode(node.id, { width: sized.width, height: sized.height });
      if (node.group) {
        g.setParent(node.id, 'group:' + node.group);
      }
    }

    for (const edge of doc.edges) {
      if (edge.fromIsGroup || edge.toIsGroup) continue;
      if (edge.from !== edge.to) {
        const hasLabel = edge.label && edge.label.length > 0;
        const labelObj = hasLabel
          ? {
              width: measure(edge.label, LAYOUT.edgeLabelFontSize) + 2 * LAYOUT.edgeLabelPadX,
              height: LAYOUT.edgeLabelH,
              labelpos: 'c',
            }
          : {};
        g.setEdge(edge.from, edge.to, labelObj, edge.id);
      }
    }

    dagreRuns++;
    dagre.layout(g);

    dagrePositions = {};
    for (const node of doc.nodes) {
      const dagreNode = g.node(node.id) as { x: number; y: number } | undefined;
      dagrePositions[node.id] = { x: dagreNode?.x ?? 0, y: dagreNode?.y ?? 0 };
    }

    lastEntry = { key, dagrePositions, sizedNodes };
  }

  const nodes: Record<string, NodeBox> = {};
  for (const node of doc.nodes) {
    const dagreNode = dagrePositions[node.id];
    const center = doc.pins[node.id]
      ? { ...doc.pins[node.id] }
      : { x: dagreNode?.x ?? 0, y: dagreNode?.y ?? 0 };
    const sized = sizedNodes[node.id];
    nodes[node.id] = {
      id: node.id,
      center,
      width: sized.width,
      height: sized.height,
      lines: sized.lines,
    };
  }

  const groups = computeGroups(doc, nodes);

  const bounds = computeBounds(
    doc,
    { nodes, groups, edges: {}, bounds: { x: 0, y: 0, width: 0, height: 0 } },
    measure,
  );

  return {
    nodes,
    groups,
    edges: {},
    bounds,
  };
}
