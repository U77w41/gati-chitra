import { MINDMAP } from '../../core/constants';
import type {
  Decoration,
  GroupBox,
  MeasureText,
  NodeBox,
  ParsedDoc,
  Point,
  SceneLayout,
} from '../../core/types';
import { growBounds } from '../../layout/decor-bounds';
import { routeEdges } from '../../layout/geometry';
import { computeBounds } from '../../layout/layout';
import { sizeNode } from '../../layout/measure';
import { boxFor } from '../../layout/node-box';
import { placeTitle } from '../../layout/title';

export function layoutMindmap(doc: ParsedDoc, measure: MeasureText): SceneLayout {
  if (doc.nodes.length === 0) {
    return {
      nodes: {},
      groups: {},
      edges: {},
      decorations: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      title: null,
    };
  }

  const mindmapData = doc.data?.mindmap;
  const rootId = mindmapData?.root ?? (doc.nodes[0]?.id ?? '');
  const childrenMap = mindmapData?.children ?? {};

  const nodeSizes: Record<string, { width: number; height: number }> = {};
  for (const node of doc.nodes) {
    nodeSizes[node.id] = sizeNode(node, measure);
  }

  const subHeights: Record<string, number> = {};
  function computeSubH(id: string): number {
    const h = nodeSizes[id]?.height ?? 30;
    const children = childrenMap[id] ?? [];
    if (children.length === 0) {
      subHeights[id] = h;
      return h;
    }
    const sumChildren = children.reduce((sum, ch) => sum + computeSubH(ch), 0);
    const res = Math.max(h, sumChildren + MINDMAP.siblingGap * (children.length - 1));
    subHeights[id] = res;
    return res;
  }

  if (rootId) {
    computeSubH(rootId);
  }

  const nodeCenters: Record<string, Point> = {};
  if (rootId) {
    nodeCenters[rootId] = { x: 0, y: 0 };
    const rootChildren = childrenMap[rootId] ?? [];
    const half = Math.ceil(rootChildren.length / 2);
    const rightChildren = rootChildren.slice(0, half);
    const leftChildren = rootChildren.slice(half);

    function placeBranch(
      vCenter: Point,
      vWidth: number,
      chList: string[],
      side: 'left' | 'right',
    ) {
      if (chList.length === 0) return;
      const totalH =
        chList.reduce((sum, ch) => sum + (subHeights[ch] ?? 30), 0) +
        (chList.length - 1) * MINDMAP.siblingGap;
      let curY = vCenter.y - totalH / 2;
      for (const chId of chList) {
        const chH = subHeights[chId] ?? 30;
        const chY = curY + chH / 2;
        const chW = nodeSizes[chId]?.width ?? 50;
        const chX =
          side === 'right'
            ? vCenter.x + vWidth / 2 + MINDMAP.levelGap + chW / 2
            : vCenter.x - vWidth / 2 - MINDMAP.levelGap - chW / 2;
        nodeCenters[chId] = { x: chX, y: chY };
        curY += chH + MINDMAP.siblingGap;
        placeBranch({ x: chX, y: chY }, chW, childrenMap[chId] ?? [], side);
      }
    }

    const rootW = nodeSizes[rootId]?.width ?? 50;
    placeBranch({ x: 0, y: 0 }, rootW, rightChildren, 'right');
    placeBranch({ x: 0, y: 0 }, rootW, leftChildren, 'left');
  }

  const nodes: Record<string, NodeBox> = {};
  for (const node of doc.nodes) {
    const center = nodeCenters[node.id] ?? { x: 0, y: 0 };
    nodes[node.id] = boxFor(node, measure, 'TB', center);
  }

  const groups: Record<string, GroupBox> = {};
  const edges = routeEdges(doc, nodes, groups);
  const decorations: Decoration[] = [];
  let bounds = computeBounds(
    doc,
    { nodes, groups, edges, bounds: { x: 0, y: 0, width: 0, height: 0 }, title: null },
    measure,
  );
  bounds = growBounds(bounds, decorations);
  const placed = placeTitle(bounds, doc.title, measure);

  return { nodes, groups, edges, decorations, bounds: placed.bounds, title: placed.title };
}
