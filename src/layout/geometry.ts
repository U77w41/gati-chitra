import { LAYOUT, TOUCH } from '../core/constants';
import type {
  EdgePath,
  GroupBox,
  NodeBox,
  ParsedDoc,
  Point,
  Scene,
  ShapeKind,
} from '../core/types';
import { borderPoint, handlePoint, rectBorderPoint, shapePolygon } from './polygon';

export { borderPoint, handlePoint, rectBorderPoint, shapePolygon };

export type Hit =
  | { kind: 'handle'; id: string }
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | { kind: 'group'; id: string };

export function pointOnPath(path: EdgePath, u: number): Point {
  if (path.kind === 'straight' || !path.control) {
    return {
      x: path.from.x + u * (path.to.x - path.from.x),
      y: path.from.y + u * (path.to.y - path.from.y),
    };
  }
  const oneMinusU = 1 - u;
  const a = oneMinusU * oneMinusU;
  const b = 2 * oneMinusU * u;
  const c = u * u;
  return {
    x: a * path.from.x + b * path.control.x + c * path.to.x,
    y: a * path.from.y + b * path.control.y + c * path.to.y,
  };
}

export function tangentAt(path: EdgePath, u: number): Point {
  let dx = 0;
  let dy = 0;
  if (path.kind === 'straight' || !path.control) {
    dx = path.to.x - path.from.x;
    dy = path.to.y - path.from.y;
  } else {
    dx = 2 * (1 - u) * (path.control.x - path.from.x) + 2 * u * (path.to.x - path.control.x);
    dy = 2 * (1 - u) * (path.control.y - path.from.y) + 2 * u * (path.to.y - path.control.y);
  }
  const len = Math.hypot(dx, dy);
  if (len === 0) {
    return { x: 1, y: 0 };
  }
  return { x: dx / len, y: dy / len };
}

export function routeEdges(
  doc: ParsedDoc,
  nodes: Record<string, NodeBox>,
  groupBoxes: Record<string, GroupBox> = {},
): Record<string, EdgePath> {
  const nodeShapeMap = new Map<string, ShapeKind>();
  for (const n of doc.nodes) {
    nodeShapeMap.set(n.id, n.shape);
  }

  const groups = new Map<string, typeof doc.edges>();
  for (const edge of doc.edges) {
    if (edge.kind === 'invisible') continue;
    const pair =
      edge.from < edge.to ? `${edge.from}|${edge.to}` : `${edge.to}|${edge.from}`;
    let list = groups.get(pair);
    if (!list) {
      list = [];
      groups.set(pair, list);
    }
    list.push(edge);
  }

  const result: Record<string, EdgePath> = {};

  for (const list of groups.values()) {
    list.sort((a, b) => a.index - b.index);
    const n = list.length;

    for (let i = 0; i < n; i++) {
      const edge = list[i];
      let fromCenter: Point;
      let toCenter: Point;
      let fromShape: ShapeKind = 'rect';
      let toShape: ShapeKind = 'rect';

      if (edge.fromIsGroup) {
        const g = groupBoxes[edge.from];
        if (!g) continue;
        fromCenter = { x: g.rect.x + g.rect.width / 2, y: g.rect.y + g.rect.height / 2 };
      } else {
        const fromBox = nodes[edge.from];
        if (!fromBox) continue;
        fromCenter = fromBox.center;
        fromShape = nodeShapeMap.get(edge.from) ?? 'rect';
      }

      if (edge.toIsGroup) {
        const g = groupBoxes[edge.to];
        if (!g) continue;
        toCenter = { x: g.rect.x + g.rect.width / 2, y: g.rect.y + g.rect.height / 2 };
      } else {
        const toBox = nodes[edge.to];
        if (!toBox) continue;
        toCenter = toBox.center;
        toShape = nodeShapeMap.get(edge.to) ?? 'rect';
      }

      let pathKind: 'straight' | 'quad' | 'loop' = 'straight';
      let p0: Point;
      let p1: Point;
      let control: Point | null = null;

      if (edge.from === edge.to && !edge.fromIsGroup) {
        pathKind = 'loop';
        const cx = fromCenter.x;
        const cy = fromCenter.y;
        const fromBox = nodes[edge.from]!;
        const w = fromBox.width;
        const h = fromBox.height;
        const size = LAYOUT.selfLoopSize;
        p0 = { x: cx + w / 2 - 14, y: cy - h / 2 };
        p1 = { x: cx + w / 2, y: cy - h / 2 + 14 };
        control = { x: cx + w / 2 + size, y: cy - h / 2 - size };
      } else {
        let sx = 0, sy = 0, nrm = { x: 0, y: 0 }, offset = 0;
        if (n > 1) {
          pathKind = 'quad';
          const centerA = edge.from < edge.to ? fromCenter : toCenter;
          const centerB = edge.from < edge.to ? toCenter : fromCenter;
          const vx = centerB.x - centerA.x, vy = centerB.y - centerA.y;
          const vlen = Math.hypot(vx, vy) || 1;
          nrm = { x: -vy / vlen, y: vx / vlen };
          offset = (i - (n - 1) / 2) * LAYOUT.parallelOffset;
          sx = nrm.x * offset * LAYOUT.parallelEndShare;
          sy = nrm.y * offset * LAYOUT.parallelEndShare;
        }

        const clipEnd = (isGroup: boolean, id: string, shape: ShapeKind, toward: Point) => {
          const base = isGroup ? rectBorderPoint(groupBoxes[id]!.rect, toward) : borderPoint(nodes[id]!, shape, toward);
          if (n <= 1) return base;
          const target = { x: base.x + sx, y: base.y + sy };
          return isGroup ? rectBorderPoint(groupBoxes[id]!.rect, target) : borderPoint(nodes[id]!, shape, target);
        };
        p0 = clipEnd(edge.fromIsGroup, edge.from, fromShape, toCenter);
        p1 = clipEnd(edge.toIsGroup, edge.to, toShape, fromCenter);

        if (n > 1) {
          control = {
            x: (p0.x + p1.x) / 2 + nrm.x * (offset * 2),
            y: (p0.y + p1.y) / 2 + nrm.y * (offset * 2),
          };
        }
      }

      const partialPath: EdgePath = {
        id: edge.id,
        kind: pathKind,
        from: p0,
        to: p1,
        control,
        labelPoint: { x: 0, y: 0 },
        length: 0,
      };

      const labelPoint = pointOnPath(partialPath, 0.5);
      partialPath.labelPoint = labelPoint;

      let length = 0;
      if (pathKind === 'straight') {
        length = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      } else {
        let prev = pointOnPath(partialPath, 0);
        for (let k = 1; k <= 16; k++) {
          const pt = pointOnPath(partialPath, k / 16);
          length += Math.hypot(pt.x - prev.x, pt.y - prev.y);
          prev = pt;
        }
      }
      partialPath.length = length;

      result[edge.id] = partialPath;
    }
  }

  return result;
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x, aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}

export function hitTest(
  scene: Scene,
  p: Point,
  handleNodeId: string | null,
  tolerance: number = LAYOUT.hitTolerance,
): Hit | null {
  if (handleNodeId && scene.layout.nodes[handleNodeId]) {
    const hp = handlePoint(scene.doc, scene.layout.nodes[handleNodeId]);
    const hr = tolerance > LAYOUT.hitTolerance ? TOUCH.handleRadius : LAYOUT.handleRadius;
    if (Math.hypot(p.x - hp.x, p.y - hp.y) <= hr + 8) {
      return { kind: 'handle', id: handleNodeId };
    }
  }

  for (let i = scene.doc.nodes.length - 1; i >= 0; i--) {
    const node = scene.doc.nodes[i];
    const box = scene.layout.nodes[node.id];
    if (!box) continue;

    if (node.shape === 'circle') {
      const rx = box.width / 2;
      const ry = box.height / 2;
      const dx = (p.x - box.center.x) / rx;
      const dy = (p.y - box.center.y) / ry;
      if (dx * dx + dy * dy <= 1) {
        return { kind: 'node', id: node.id };
      }
    } else {
      const poly = shapePolygon(box, node.shape);
      if (poly !== null) {
        let inside = false;
        for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
          const xi = poly[j].x;
          const yi = poly[j].y;
          const xk = poly[k].x;
          const yk = poly[k].y;
          const intersect =
            yi > p.y !== yk > p.y && p.x < ((xk - xi) * (p.y - yi)) / (yk - yi) + xi;
          if (intersect) inside = !inside;
        }
        if (inside) {
          return { kind: 'node', id: node.id };
        }
      } else {
        const halfW = box.width / 2, halfH = box.height / 2;
        if (Math.abs(p.x - box.center.x) <= halfW && Math.abs(p.y - box.center.y) <= halfH) {
          return { kind: 'node', id: node.id };
        }
      }
    }
  }

  let nearestEdgeId: string | null = null;
  let nearestDistance = Infinity;

  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    const path = scene.layout.edges[edge.id];
    if (!path) continue;

    let edgeMinDist = Infinity;
    let prev = pointOnPath(path, 0);
    for (let k = 1; k <= 16; k++) {
      const curr = pointOnPath(path, k / 16);
      const d = pointToSegmentDistance(p, prev, curr);
      if (d < edgeMinDist) edgeMinDist = d;
      prev = curr;
    }

    if (edgeMinDist <= tolerance && edgeMinDist < nearestDistance) {
      nearestDistance = edgeMinDist;
      nearestEdgeId = edge.id;
    }
  }

  if (nearestEdgeId !== null) {
    return { kind: 'edge', id: nearestEdgeId };
  }

  const groupList = Object.values(scene.layout.groups);
  groupList.sort((a, b) => b.depth - a.depth);

  for (const g of groupList) {
    const r = g.rect;
    if (p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + LAYOUT.groupTitleH) {
      return { kind: 'group', id: g.id };
    }
  }

  return null;
}
