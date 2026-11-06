import { TIMELINE } from '../../core/constants';
import type {
  Decoration,
  EdgePath,
  GroupBox,
  MeasureText,
  NodeBox,
  ParsedDoc,
  Point,
  SceneLayout,
} from '../../core/types';
import { growBounds } from '../../layout/decor-bounds';
import { computeBounds } from '../../layout/layout';
import { sizeNode } from '../../layout/measure';
import { boxFor } from '../../layout/node-box';
import { makeEdgePath } from '../../layout/path';
import { borderPoint } from '../../layout/polygon';
import { placeTitle } from '../../layout/title';

export function layoutTimeline(doc: ParsedDoc, measure: MeasureText): SceneLayout {
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

  const timelineData = doc.data?.timeline;
  const direction = timelineData?.direction ?? 'LR';
  const sections = timelineData?.sections ?? [];
  const periods = timelineData?.periods ?? [];

  let widest = 0;
  let tallestPeriod = 0;
  let tallestEvent = 0;

  for (const node of doc.nodes) {
    const s = sizeNode(node, measure);
    if (s.width > widest) widest = s.width;
    if (node.shape === 'round') {
      if (s.height > tallestPeriod) tallestPeriod = s.height;
    } else {
      if (s.height > tallestEvent) tallestEvent = s.height;
    }
  }

  const colW = Math.max(TIMELINE.colMinW, widest);
  const periodH = tallestPeriod > 0 ? tallestPeriod : 44;
  const eventH = tallestEvent > 0 ? tallestEvent : 44;

  const nodes: Record<string, NodeBox> = {};
  const decorations: Decoration[] = [];
  const periodCenters: Record<string, Point> = {};
  const periodX: number[] = [];

  const sectionsExist = sections.some((s) => s.periods.length > 0);

  if (direction === 'LR') {
    const y0 = sectionsExist ? TIMELINE.sectionH + TIMELINE.rowGap : 0;

    for (let k = 1; k <= periods.length; k++) {
      const p = periods[k - 1];
      const x_k = (k - 1) * (colW + TIMELINE.colGap) + colW / 2;
      periodX.push(x_k);

      const pCenter: Point = { x: x_k, y: y0 + periodH / 2 };
      periodCenters[p.id] = pCenter;
      const pNode = doc.nodes.find((n) => n.id === p.id);
      if (pNode) {
        nodes[p.id] = boxFor(pNode, measure, 'TB', pCenter, { width: colW });
      }

      for (let j = 1; j <= p.events.length; j++) {
        const evId = p.events[j - 1];
        const evCenter: Point = {
          x: x_k,
          y: y0 + periodH + TIMELINE.rowGap + (j - 1) * (eventH + TIMELINE.eventGap) + eventH / 2,
        };
        const evNode = doc.nodes.find((n) => n.id === evId);
        if (evNode) {
          nodes[evId] = boxFor(evNode, measure, 'TB', evCenter, { width: colW });
        }
      }
    }

    // Section bands in LR
    for (const s of sections) {
      if (s.periods.length === 0) continue;
      const firstIdx = periods.findIndex((p) => p.id === s.periods[0]);
      const lastIdx = periods.findIndex((p) => p.id === s.periods[s.periods.length - 1]);
      if (firstIdx !== -1 && lastIdx !== -1) {
        const x_first = periodX[firstIdx];
        const x_last = periodX[lastIdx];
        decorations.push({
          kind: 'rect',
          role: 'band',
          rect: {
            x: x_first - colW / 2,
            y: 0,
            width: x_last - x_first + colW,
            height: TIMELINE.sectionH,
          },
          radius: 6,
          label: s.name,
          colorIndex: s.colorIndex,
        });
      }
    }
  } else {
    // TD direction
    const rowH = Math.max(periodH, eventH);

    for (let k = 1; k <= periods.length; k++) {
      const p = periods[k - 1];
      const y_k = (k - 1) * (rowH + TIMELINE.colGap) + periodH / 2;
      const pCenter: Point = { x: colW / 2, y: y_k };
      periodCenters[p.id] = pCenter;

      const pNode = doc.nodes.find((n) => n.id === p.id);
      if (pNode) {
        nodes[p.id] = boxFor(pNode, measure, 'TB', pCenter, { width: colW });
      }

      for (let j = 1; j <= p.events.length; j++) {
        const evId = p.events[j - 1];
        const evCenter: Point = {
          x: colW + TIMELINE.colGap + (j - 1) * (colW + TIMELINE.eventGap) + colW / 2,
          y: y_k,
        };
        const evNode = doc.nodes.find((n) => n.id === evId);
        if (evNode) {
          nodes[evId] = boxFor(evNode, measure, 'TB', evCenter, { width: colW });
        }
      }
    }
  }

  // Edge paths
  const edges: Record<string, EdgePath> = {};
  for (const edge of doc.edges) {
    const fromBox = nodes[edge.from];
    const toBox = nodes[edge.to];
    const fromNode = doc.nodes.find((n) => n.id === edge.from);
    const toNode = doc.nodes.find((n) => n.id === edge.to);

    if (fromBox && toBox && fromNode && toNode) {
      const startPt = borderPoint(fromBox, fromNode.shape, toBox.center);
      const endPt = borderPoint(toBox, toNode.shape, fromBox.center);
      edges[edge.id] = makeEdgePath(edge.id, startPt, endPt, null);
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
