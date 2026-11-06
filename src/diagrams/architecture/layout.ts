import { ARCH } from '../../core/constants';
import type {
  EdgePath, NodeBox, ParsedDoc, Point, Rect, SceneLayout,
} from '../../core/types';
import { growBounds } from '../../layout/decor-bounds';
import { computeBounds, computeGroups } from '../../layout/layout';
import type { MeasureText } from '../../layout/measure';
import { sizeNode } from '../../layout/measure';
import { boxFor } from '../../layout/node-box';
import { makeEdgePath } from '../../layout/path';
import { placeTitle } from '../../layout/title';

function getSidePt(box: NodeBox | Rect, side: 'L' | 'R' | 'T' | 'B'): Point {
  const cx = 'center' in box ? box.center.x : box.x + box.width / 2;
  const cy = 'center' in box ? box.center.y : box.y + box.height / 2;
  const w = box.width;
  const h = box.height;
  switch (side) {
    case 'R': return { x: cx + w / 2, y: cy };
    case 'L': return { x: cx - w / 2, y: cy };
    case 'T': return { x: cx, y: cy - h / 2 };
    case 'B': return { x: cx, y: cy + h / 2 };
  }
}

export function layoutArchitecture(doc: ParsedDoc, measure: MeasureText): SceneLayout {
  let maxW = 40;
  let maxH = 40;
  for (const node of doc.nodes) {
    const s = sizeNode(node, measure, 'TB');
    maxW = Math.max(maxW, s.width);
    maxH = Math.max(maxH, s.height);
  }

  const cellW = maxW + ARCH.gapX;
  const cellH = maxH + ARCH.gapY;

  const nodeCells = new Map<string, { c: number; r: number }>();
  const cellMap = new Map<string, string>();
  let maxCol = 0;

  const cellKey = (c: number, r: number) => `${c},${r}`;
  const dirVec: Record<'L' | 'R' | 'T' | 'B', { c: number; r: number }> = {
    R: { c: 1, r: 0 },
    L: { c: -1, r: 0 },
    T: { c: 0, r: -1 },
    B: { c: 0, r: 1 },
  };

  for (const node of doc.nodes) {
    if (nodeCells.has(node.id)) continue;
    const startC = nodeCells.size === 0 ? 0 : maxCol + 2;
    const startR = 0;
    nodeCells.set(node.id, { c: startC, r: startR });
    cellMap.set(cellKey(startC, startR), node.id);
    maxCol = Math.max(maxCol, startC);

    const queue: string[] = [node.id];
    while (queue.length > 0) {
      const currId = queue.shift()!;
      const currPos = nodeCells.get(currId)!;

      for (const edge of doc.edges) {
        const sides = doc.data?.architecture?.sides[edge.id];
        if (!sides) continue;

        if (edge.from === currId && !edge.toIsGroup && !nodeCells.has(edge.to)) {
          const vec = dirVec[sides.from];
          let nextC = currPos.c + vec.c;
          let nextR = currPos.r + vec.r;
          while (cellMap.has(cellKey(nextC, nextR))) {
            nextC += vec.c;
            nextR += vec.r;
          }
          nodeCells.set(edge.to, { c: nextC, r: nextR });
          cellMap.set(cellKey(nextC, nextR), edge.to);
          maxCol = Math.max(maxCol, nextC);
          queue.push(edge.to);
        }

        if (edge.to === currId && !edge.fromIsGroup && !nodeCells.has(edge.from)) {
          const vec = dirVec[sides.to];
          let nextC = currPos.c + vec.c;
          let nextR = currPos.r + vec.r;
          while (cellMap.has(cellKey(nextC, nextR))) {
            nextC += vec.c;
            nextR += vec.r;
          }
          nodeCells.set(edge.from, { c: nextC, r: nextR });
          cellMap.set(cellKey(nextC, nextR), edge.from);
          maxCol = Math.max(maxCol, nextC);
          queue.push(edge.from);
        }
      }
    }
  }

  const nodes: Record<string, NodeBox> = {};
  for (const node of doc.nodes) {
    const pos = nodeCells.get(node.id) ?? { c: 0, r: 0 };
    let center: Point = { x: pos.c * cellW, y: pos.r * cellH };
    if (doc.pins[node.id]) {
      center = { ...doc.pins[node.id] };
    }
    nodes[node.id] = boxFor(node, measure, 'TB', center);
  }

  const groups = computeGroups(doc, nodes);

  const edges: Record<string, EdgePath> = {};
  for (const edge of doc.edges) {
    const sides = doc.data?.architecture?.sides[edge.id] ?? { from: 'R', to: 'L' };
    const fromBox = edge.fromIsGroup ? groups[edge.from]?.rect : nodes[edge.from];
    const toBox = edge.toIsGroup ? groups[edge.to]?.rect : nodes[edge.to];
    if (!fromBox || !toBox) continue;

    const fromPt = getSidePt(fromBox, sides.from);
    const toPt = getSidePt(toBox, sides.to);
    const dx = toPt.x - fromPt.x;
    const dy = toPt.y - fromPt.y;

    let control: Point | null = null;
    if (Math.abs(dx) >= 1 && Math.abs(dy) >= 1) {
      if (sides.from === 'L' || sides.from === 'R') {
        control = { x: toPt.x, y: fromPt.y };
      } else {
        control = { x: fromPt.x, y: toPt.y };
      }
    }
    edges[edge.id] = makeEdgePath(edge.id, fromPt, toPt, control);
  }

  let bounds = computeBounds(
    doc,
    {
      nodes,
      groups,
      edges,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      title: null,
    },
    measure,
  );
  bounds = growBounds(bounds, []);
  const placed = placeTitle(bounds, doc.title, measure);

  return {
    nodes,
    groups,
    edges,
    decorations: [],
    bounds: placed.bounds,
    title: placed.title,
  };
}
