import { LAYOUT, SEQ } from '../../core/constants';
import type {
  Decoration, EdgePath, GraphEdge, GraphNode, GroupBox, MeasureText,
  NodeBox, ParsedDoc, Point, SceneLayout,
} from '../../core/types';
import { growBounds } from '../../layout/decor-bounds';
import { computeBounds } from '../../layout/layout';
import { sizeNode } from '../../layout/measure';
import { boxFor } from '../../layout/node-box';
import { makeEdgePath } from '../../layout/path';
import { placeTitle } from '../../layout/title';
import {
  buildBoxes, buildLifelines, closeRemainingActivations, widenColumns,
} from './layout-helpers';

interface OpenFrame {
  keyword: string;
  label?: string;
  startY: number;
  minCol: number;
  maxCol: number;
  dividers: { y: number; label?: string }[];
}

export function layoutSequence(doc: ParsedDoc, measure: MeasureText): SceneLayout {
  const data = doc.data?.sequence;
  const participantIds = data?.participants ?? [];
  const colMap = new Map<string, number>();
  participantIds.forEach((id, idx) => colMap.set(id, idx));

  const n = participantIds.length;
  const nodesMap = new Map<string, GraphNode>();
  for (const node of doc.nodes) nodesMap.set(node.id, node);

  const w: number[] = Array.from({ length: n }, () => SEQ.minParticipantW);
  const h: number[] = Array.from({ length: n }, () => SEQ.participantH);
  let topH: number = SEQ.participantH;

  for (let i = 0; i < n; i++) {
    const node = nodesMap.get(participantIds[i]);
    if (node) {
      const sized = sizeNode(node, measure, doc.direction);
      w[i] = Math.max(SEQ.minParticipantW, sized.width);
      h[i] = Math.max(SEQ.participantH, sized.height);
      if (h[i] > topH) topH = h[i];
    }
  }

  const x: number[] = Array.from({ length: n }, () => 0);
  if (n > 0) {
    x[0] = w[0] / 2;
    for (let i = 1; i < n; i++) {
      x[i] = x[i - 1] + w[i - 1] / 2 + SEQ.participantGap + w[i] / 2;
    }
  }

  const edgesMap = new Map<string, GraphEdge>();
  for (const edge of doc.edges) edgesMap.set(edge.id, edge);

  const events = data?.events ?? [];
  widenColumns(events, edgesMap, colMap, x, n, measure);

  const nodes: Record<string, NodeBox> = {};
  for (let i = 0; i < n; i++) {
    const id = participantIds[i];
    const node = nodesMap.get(id);
    if (node) {
      nodes[id] = boxFor(node, measure, doc.direction, { x: x[i], y: topH / 2 }, { width: w[i], height: h[i] });
    }
  }

  let y = topH + SEQ.firstRowGap;
  let lastY = y;
  const level: Record<string, number> = {};
  const actStart: Record<string, number[]> = {};
  for (const id of participantIds) {
    level[id] = 0;
    actStart[id] = [];
  }
  const openFrames: OpenFrame[] = [];
  const edges: Record<string, EdgePath> = {};
  const activationDecorations: Decoration[] = [];
  const frameDecorations: Decoration[] = [];
  const dividerDecorations: Decoration[] = [];
  const captionDecorations: Decoration[] = [];

  let msgCounter = 0;
  const auto = data?.autonumber;

  const off = (id: string) => {
    const lev = level[id] ?? 0;
    return lev > 0 ? SEQ.activationW / 2 + SEQ.activationStep * (lev - 1) : 0;
  };

  for (const ev of events) {
    if (ev.type === 'message') {
      const edge = edgesMap.get(ev.edgeId);
      if (!edge) continue;
      const a = colMap.get(edge.from);
      const b = colMap.get(edge.to);
      if (a === undefined || b === undefined) continue;

      const dir = x[b] >= x[a] ? 1 : -1;
      let p0: Point;
      if (a !== b) {
        p0 = { x: x[a] + dir * off(edge.from), y };
        const p1: Point = { x: x[b] - dir * off(edge.to), y };
        const midX = (p0.x + p1.x) / 2;
        edges[edge.id] = makeEdgePath(edge.id, p0, p1, null, { x: midX, y: y - SEQ.labelLift });
        lastY = y;
        y += SEQ.rowH;
      } else {
        const o = off(edge.from);
        p0 = { x: x[a] + o, y };
        const p1: Point = { x: x[a] + o, y: y + 24 };
        const control: Point = { x: x[a] + o + SEQ.selfLoopW, y: y + 12 };
        const labelW = measure(edge.label, LAYOUT.edgeLabelFontSize);
        const chipW = labelW + 2 * LAYOUT.edgeLabelPadX;
        const labelPoint: Point = { x: x[a] + o + SEQ.selfLoopW + 8 + chipW / 2, y: y + 12 };
        edges[edge.id] = makeEdgePath(edge.id, p0, p1, control, labelPoint);
        lastY = y + 24;
        y += SEQ.selfRowH;
      }

      if (auto) {
        captionDecorations.push({
          kind: 'text', role: 'caption', bold: true,
          text: String(auto.start + msgCounter * auto.step),
          at: { x: p0.x + dir * 14, y: p0.y - SEQ.labelLift },
          align: 'center',
        });
        msgCounter++;
      }

      for (const f of openFrames) {
        f.minCol = Math.min(f.minCol, a, b);
        f.maxCol = Math.max(f.maxCol, a, b);
      }
    } else if (ev.type === 'note') {
      const node = nodesMap.get(ev.nodeId);
      if (node) {
        const s = sizeNode(node, measure, doc.direction);
        let cx = 0;
        let noteW = s.width;
        if (ev.placement === 'left') {
          const t = colMap.get(ev.targets[0]) ?? 0;
          cx = x[t] - SEQ.noteGap - s.width / 2;
        } else if (ev.placement === 'right') {
          const t = colMap.get(ev.targets[0]) ?? 0;
          cx = x[t] + SEQ.noteGap + s.width / 2;
        } else if (ev.targets.length >= 2) {
          const t1 = colMap.get(ev.targets[0]) ?? 0;
          const t2 = colMap.get(ev.targets[1]) ?? 0;
          const xl = Math.min(x[t1], x[t2]);
          const xr = Math.max(x[t1], x[t2]);
          cx = (xl + xr) / 2;
          noteW = Math.max(s.width, xr - xl + 40);
        } else {
          const t = colMap.get(ev.targets[0]) ?? 0;
          cx = x[t];
        }
        const cy = y + s.height / 2;
        nodes[node.id] = boxFor(node, measure, doc.direction, { x: cx, y: cy }, { width: noteW, height: s.height });
        lastY = cy;
        y += s.height + SEQ.noteRowGap;
        for (const t of ev.targets) {
          const c = colMap.get(t);
          if (c !== undefined) {
            for (const f of openFrames) {
              f.minCol = Math.min(f.minCol, c);
              f.maxCol = Math.max(f.maxCol, c);
            }
          }
        }
      }
    } else if (ev.type === 'activate') {
      level[ev.id] = (level[ev.id] ?? 0) + 1;
      actStart[ev.id] = actStart[ev.id] ?? [];
      actStart[ev.id].push(lastY);
    } else if (ev.type === 'deactivate') {
      const lev = level[ev.id] ?? 0;
      if (lev > 0) {
        const start = actStart[ev.id].pop()!;
        const c = colMap.get(ev.id) ?? 0;
        activationDecorations.push({
          kind: 'rect', role: 'activation',
          rect: {
            x: x[c] - SEQ.activationW / 2 + SEQ.activationStep * (lev - 1),
            y: start,
            width: SEQ.activationW,
            height: Math.max(lastY - start, 8),
          },
          radius: 2,
        });
        level[ev.id] = lev - 1;
      }
    } else if (ev.type === 'frameStart') {
      openFrames.push({
        keyword: ev.keyword,
        label: ev.label,
        startY: y,
        minCol: Infinity,
        maxCol: -Infinity,
        dividers: [],
      });
      y += SEQ.frameHeaderH;
    } else if (ev.type === 'frameDivider') {
      const topFrame = openFrames[openFrames.length - 1];
      if (topFrame) {
        topFrame.dividers.push({ y, label: ev.label });
      }
      y += SEQ.dividerH;
    } else if (ev.type === 'frameEnd') {
      const f = openFrames.pop();
      if (f) {
        const d = openFrames.length;
        if (f.minCol === Infinity) {
          f.minCol = 0;
          f.maxCol = 0;
        }
        y += SEQ.framePad;
        const left = x[f.minCol] - SEQ.frameSide + SEQ.frameInset * d;
        const right = x[f.maxCol] + SEQ.frameSide - SEQ.frameInset * d;
        const frameLabel = f.keyword === 'rect' ? undefined : (f.label ? `${f.keyword} [${f.label}]` : f.keyword);
        frameDecorations.push({
          kind: 'rect', role: 'frame',
          rect: { x: left, y: f.startY, width: right - left, height: y - f.startY },
          radius: 4,
          ...(frameLabel ? { label: frameLabel } : {}),
        });
        for (const div of f.dividers) {
          dividerDecorations.push({
            kind: 'line', role: 'frameDivider',
            from: { x: left, y: div.y },
            to: { x: right, y: div.y },
          });
          if (div.label) {
            captionDecorations.push({
              kind: 'text', role: 'caption', bold: false,
              text: `[${div.label}]`,
              at: { x: (left + right) / 2, y: div.y + SEQ.dividerH / 2 },
              align: 'center',
            });
          }
        }
        if (openFrames.length > 0) {
          const parent = openFrames[openFrames.length - 1];
          parent.minCol = Math.min(parent.minCol, f.minCol);
          parent.maxCol = Math.max(parent.maxCol, f.maxCol);
        }
      }
    }
  }

  closeRemainingActivations(participantIds, level, actStart, colMap, x, lastY, activationDecorations);
  const endY = y + SEQ.bottomPad;
  const lifelineDecorations = buildLifelines(n, x, topH, endY);
  const boxDecorations = buildBoxes(data?.boxes ?? [], colMap, x, w, endY);

  const decorations: Decoration[] = [
    ...boxDecorations,
    ...frameDecorations,
    ...dividerDecorations,
    ...lifelineDecorations,
    ...activationDecorations,
    ...captionDecorations,
  ];

  for (const node of doc.nodes) {
    if (!nodes[node.id]) {
      nodes[node.id] = boxFor(node, measure, doc.direction, { x: 0, y: 0 });
    }
  }

  const groups: Record<string, GroupBox> = {};
  let bounds = computeBounds(
    doc,
    { nodes, groups, edges, bounds: { x: 0, y: 0, width: 0, height: 0 }, title: null },
    measure,
  );
  bounds = growBounds(bounds, decorations);
  const placed = placeTitle(bounds, doc.title, measure);
  return { nodes, groups, edges, decorations, bounds: placed.bounds, title: placed.title };
}
