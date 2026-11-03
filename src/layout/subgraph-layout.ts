import dagre from '@dagrejs/dagre';
import { LAYOUT } from '../core/constants';
import type { GraphEdge, GraphGroup, GraphNode, ParsedDoc, Point, TextRun } from '../core/types';
import { sealedGroups } from '../mermaid/groups';
import type { MeasureText } from './measure';
import { parseInlineMarkdown } from './rich-text';

type DagreGraph = InstanceType<typeof dagre.graphlib.Graph>;

export function isNodeInGroup(node: GraphNode, groupId: string, groups: GraphGroup[]): boolean {
  let gId: string | null = node.group;
  const parentMap = new Map<string, string | null>(groups.map((g) => [g.id, g.parent]));
  while (gId) {
    if (gId === groupId) return true;
    gId = parentMap.get(gId) ?? null;
  }
  return false;
}

export function groupFirstMember(groupId: string, doc: ParsedDoc): string | null {
  const n = doc.nodes.find((node) => isNodeInGroup(node, groupId, doc.groups));
  return n ? n.id : null;
}

export function isGroupInsideSealedGroup(
  groupId: string,
  sealed: Set<string>,
  groups: GraphGroup[],
): boolean {
  const parentMap = new Map<string, string | null>(groups.map((g) => [g.id, g.parent]));
  let curr: string | null = parentMap.get(groupId) ?? null;
  while (curr) {
    if (sealed.has(curr)) return true;
    curr = parentMap.get(curr) ?? null;
  }
  return false;
}

export function isInsideSealedGroup(
  node: GraphNode,
  sealed: Set<string>,
  groups: GraphGroup[],
): boolean {
  let gId: string | null = node.group;
  const parentMap = new Map<string, string | null>(groups.map((g) => [g.id, g.parent]));
  while (gId) {
    if (sealed.has(gId)) return true;
    gId = parentMap.get(gId) ?? null;
  }
  return false;
}

function edgeLabelWidth(edge: GraphEdge, measure: MeasureText): number {
  if (!edge.label || edge.label.length === 0) return 0;
  if (edge.markdown) {
    return parseInlineMarkdown(edge.label).reduce(
      (sum, r) => sum + measure(r.text, LAYOUT.edgeLabelFontSize, r),
      0,
    );
  }
  return measure(edge.label, LAYOUT.edgeLabelFontSize);
}

export interface SealedBox {
  width: number;
  height: number;
  minX: number;
  minY: number;
  graph: DagreGraph;
  directNodes: GraphNode[];
  childGroups: GraphGroup[];
}

export function layoutSealedSubgraphs(
  doc: ParsedDoc,
  sizedNodes: Record<string, { width: number; height: number; lines: string[]; runs?: TextRun[][] }>,
  measure: MeasureText,
): {
  sealed: Set<string>;
  sealedBoxes: Record<string, SealedBox>;
  topLevelSealed: Set<string>;
} {
  const sealed = sealedGroups(doc);
  const sealedBoxes: Record<string, SealedBox> = {};
  const topLevelSealed = new Set<string>();

  if (sealed.size === 0) {
    return { sealed, sealedBoxes, topLevelSealed };
  }

  const groupMap = new Map<string, GraphGroup>(doc.groups.map((g) => [g.id, g]));
  function getDepth(gid: string): number {
    let d = 0, curr = groupMap.get(gid);
    while (curr?.parent) { d++; curr = groupMap.get(curr.parent); }
    return d;
  }

  const sealedOrdered = Array.from(sealed)
    .map((id) => ({ id, depth: getDepth(id) }))
    .sort((a, b) => b.depth - a.depth)
    .map((x) => x.id);

  for (const gid of sealedOrdered) {
    const g = groupMap.get(gid)!;
    const directNodes = doc.nodes.filter((n) => n.group === gid);
    const childGroups = doc.groups.filter((cg) => cg.parent === gid);

    const sg = new dagre.graphlib.Graph({ compound: true, multigraph: true });
    sg.setGraph({
      rankdir: g.direction ?? doc.direction,
      nodesep: LAYOUT.nodeSep, ranksep: LAYOUT.rankSep, edgesep: LAYOUT.edgeSep,
      marginx: 0, marginy: 0,
    });
    sg.setDefaultEdgeLabel(() => ({}));

    for (const n of directNodes) {
      const sz = sizedNodes[n.id];
      sg.setNode(n.id, { width: sz.width, height: sz.height });
    }

    for (const cg of childGroups) {
      if (sealed.has(cg.id)) {
        const cBox = sealedBoxes[cg.id];
        sg.setNode('group:' + cg.id, { width: cBox.width, height: cBox.height });
      } else {
        sg.setNode('group:' + cg.id, {});
        const cgMembers = doc.nodes.filter((n) => isNodeInGroup(n, cg.id, doc.groups));
        for (const m of cgMembers) {
          const sz = sizedNodes[m.id];
          sg.setNode(m.id, { width: sz.width, height: sz.height });
          sg.setParent(m.id, 'group:' + cg.id);
        }
      }
    }

    const insideNodeIds = new Set(
      doc.nodes.filter((n) => isNodeInGroup(n, gid, doc.groups)).map((n) => n.id),
    );

    for (const edge of doc.edges) {
      if (insideNodeIds.has(edge.from) && insideNodeIds.has(edge.to) && edge.from !== edge.to) {
        const lW = edgeLabelWidth(edge, measure);
        const lObj = {
          minlen: edge.length,
          ...(lW > 0 ? { width: lW + 2 * LAYOUT.edgeLabelPadX, height: LAYOUT.edgeLabelH, labelpos: 'c' } : {}),
        };
        sg.setEdge(edge.from, edge.to, lObj, edge.id);
      }
    }

    dagre.layout(sg);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, count = 0;
    const addBox = (pos: { x: number; y: number }, w: number, h: number) => {
      minX = Math.min(minX, pos.x - w / 2);
      maxX = Math.max(maxX, pos.x + w / 2);
      minY = Math.min(minY, pos.y - h / 2);
      maxY = Math.max(maxY, pos.y + h / 2);
      count++;
    };

    for (const n of directNodes) {
      const pos = sg.node(n.id);
      if (pos) addBox(pos, sizedNodes[n.id].width, sizedNodes[n.id].height);
    }

    for (const cg of childGroups) {
      const pos = sg.node('group:' + cg.id);
      if (pos) {
        const w = sealed.has(cg.id) ? sealedBoxes[cg.id].width : pos.width;
        const h = sealed.has(cg.id) ? sealedBoxes[cg.id].height : pos.height;
        addBox(pos, w, h);
      }
    }

    const contentW = count > 0 ? maxX - minX : 0;
    const contentH = count > 0 ? maxY - minY : 0;
    sealedBoxes[gid] = {
      width: contentW + 2 * LAYOUT.groupPad,
      height: contentH + 2 * LAYOUT.groupPad + LAYOUT.groupTitleH,
      minX: count > 0 ? minX : 0, minY: count > 0 ? minY : 0,
      graph: sg, directNodes, childGroups,
    };
  }

  for (const gid of sealed) {
    let curr = groupMap.get(gid)?.parent;
    let parentSealed = false;
    while (curr) {
      if (sealed.has(curr)) { parentSealed = true; break; }
      curr = groupMap.get(curr)?.parent ?? null;
    }
    if (!parentSealed) topLevelSealed.add(gid);
  }

  return { sealed, sealedBoxes, topLevelSealed };
}

export function populateMainGraph(
  g: DagreGraph,
  doc: ParsedDoc,
  sizedNodes: Record<string, { width: number; height: number; lines: string[]; runs?: TextRun[][] }>,
  measure: MeasureText,
  sealed: Set<string>,
  sealedBoxes: Record<string, SealedBox>,
  topLevelSealed: Set<string>,
): void {
  for (const group of doc.groups) {
    if (topLevelSealed.has(group.id)) {
      g.setNode('group:' + group.id, { width: sealedBoxes[group.id].width, height: sealedBoxes[group.id].height });
    } else if (!isGroupInsideSealedGroup(group.id, sealed, doc.groups)) {
      g.setNode('group:' + group.id, {});
    }
    if (group.parent) g.setParent('group:' + group.id, 'group:' + group.parent);
  }

  for (const node of doc.nodes) {
    if (isInsideSealedGroup(node, sealed, doc.groups)) continue;
    const sz = sizedNodes[node.id];
    g.setNode(node.id, { width: sz.width, height: sz.height });
    if (node.group) g.setParent(node.id, 'group:' + node.group);
  }

  for (const edge of doc.edges) {
    const from = edge.fromIsGroup ? groupFirstMember(edge.from, doc) : edge.from;
    const to = edge.toIsGroup ? groupFirstMember(edge.to, doc) : edge.to;
    if (!from || !to || from === to) continue;
    const fNode = doc.nodes.find((n) => n.id === from);
    const tNode = doc.nodes.find((n) => n.id === to);
    if (fNode && isInsideSealedGroup(fNode, sealed, doc.groups)) continue;
    if (tNode && isInsideSealedGroup(tNode, sealed, doc.groups)) continue;

    const lW = edgeLabelWidth(edge, measure);
    const lObj = {
      minlen: edge.length,
      ...(lW > 0 ? { width: lW + 2 * LAYOUT.edgeLabelPadX, height: LAYOUT.edgeLabelH, labelpos: 'c' } : {}),
    };
    g.setEdge(from, to, lObj, edge.id);
  }
}

export function placeSealedGroup(
  gid: string,
  centerX: number,
  centerY: number,
  sealedBoxes: Record<string, SealedBox>,
  sealed: Set<string>,
  positions: Record<string, Point>,
): void {
  const box = sealedBoxes[gid];
  if (!box) return;

  const groupLeft = centerX - box.width / 2;
  const groupTop = centerY - box.height / 2;
  const originX = groupLeft + LAYOUT.groupPad;
  const originY = groupTop + LAYOUT.groupTitleH + LAYOUT.groupPad;

  for (const n of box.directNodes) {
    const pos = box.graph.node(n.id) as { x: number; y: number } | undefined;
    if (pos) positions[n.id] = { x: originX + (pos.x - box.minX), y: originY + (pos.y - box.minY) };
  }

  for (const cg of box.childGroups) {
    const pos = box.graph.node('group:' + cg.id) as { x: number; y: number } | undefined;
    if (pos && sealed.has(cg.id)) {
      placeSealedGroup(cg.id, originX + (pos.x - box.minX), originY + (pos.y - box.minY), sealedBoxes, sealed, positions);
    }
  }
}
