import { JOURNEY } from '../../core/constants';
import type {
  Decoration,
  EdgePath,
  GroupBox,
  MeasureText,
  NodeBox,
  ParsedDoc,
  SceneLayout,
} from '../../core/types';
import { growBounds } from '../../layout/decor-bounds';
import { computeBounds } from '../../layout/layout';
import { sizeNode } from '../../layout/measure';
import { boxFor } from '../../layout/node-box';
import { makeEdgePath } from '../../layout/path';
import { borderPoint } from '../../layout/polygon';
import { placeTitle } from '../../layout/title';

export function layoutJourney(doc: ParsedDoc, measure: MeasureText): SceneLayout {
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

  const journeyData = doc.data?.journey;
  const tasks = journeyData?.tasks ?? [];
  const actors = journeyData?.actors ?? [];
  const sections = journeyData?.sections ?? [];

  // 1. Sizing cards
  let widestCard = 0;
  let tallestCard = 0;
  const cardSized: Record<string, { width: number; height: number }> = {};
  for (const t of tasks) {
    const cardNode = doc.nodes.find((n) => n.id === t.cardId);
    if (cardNode) {
      const s = sizeNode(cardNode, measure);
      cardSized[t.cardId] = s;
      if (s.width > widestCard) widestCard = s.width;
      if (s.height > tallestCard) tallestCard = s.height;
    }
  }

  const cardW = Math.max(JOURNEY.taskMinW, widestCard);
  const cardH = tallestCard > 0 ? tallestCard : 44;

  const cardTop = JOURNEY.sectionH + JOURNEY.cardGap;
  const cardBottom = cardTop + cardH;

  const nodes: Record<string, NodeBox> = {};
  const taskX: number[] = [];

  for (let k = 1; k <= tasks.length; k++) {
    const t = tasks[k - 1];
    const x_k = JOURNEY.legendW + (k - 1) * (cardW + JOURNEY.taskGap) + cardW / 2;
    taskX.push(x_k);

    const cardNode = doc.nodes.find((n) => n.id === t.cardId);
    if (cardNode) {
      nodes[t.cardId] = boxFor(
        cardNode,
        measure,
        'TB',
        { x: x_k, y: cardTop + cardH / 2 },
        { width: cardW },
      );
    }

    const faceNode = doc.nodes.find((n) => n.id === t.faceId);
    if (faceNode) {
      const faceY =
        cardBottom +
        JOURNEY.faceGap +
        JOURNEY.faceD / 2 +
        (5 - t.score) * JOURNEY.scoreStep;
      nodes[t.faceId] = boxFor(faceNode, measure, 'TB', { x: x_k, y: faceY });
    }
  }

  const decorations: Decoration[] = [];

  // Section bands
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const s = sections[sIdx];
    if (!s.name) continue;
    const sTasksIndices = tasks
      .map((t, idx) => (t.section === sIdx ? idx : -1))
      .filter((idx) => idx !== -1);
    if (sTasksIndices.length > 0) {
      const firstIdx = sTasksIndices[0];
      const lastIdx = sTasksIndices[sTasksIndices.length - 1];
      const x_first = taskX[firstIdx];
      const x_last = taskX[lastIdx];
      decorations.push({
        kind: 'rect',
        role: 'band',
        rect: {
          x: x_first - cardW / 2,
          y: 0,
          width: x_last - x_first + cardW,
          height: JOURNEY.sectionH,
        },
        radius: 6,
        label: s.name,
        colorIndex: s.colorIndex,
      });
    }
  }

  // Lifelines
  for (let k = 1; k <= tasks.length; k++) {
    const t = tasks[k - 1];
    const x_k = taskX[k - 1];
    const faceBox = nodes[t.faceId];
    if (faceBox) {
      const faceTop = faceBox.center.y - JOURNEY.faceD / 2;
      decorations.push({
        kind: 'line',
        role: 'lifeline',
        from: { x: x_k, y: cardBottom },
        to: { x: x_k, y: faceTop },
      });
    }
  }

  // Legend actors
  for (let j = 0; j < actors.length; j++) {
    const actorName = actors[j];
    decorations.push({
      kind: 'rect',
      role: 'band',
      rect: {
        x: 0,
        y: cardTop + j * JOURNEY.actorRowH,
        width: JOURNEY.actorDot,
        height: JOURNEY.actorDot,
      },
      radius: JOURNEY.actorDot / 2,
      colorIndex: j,
    });
    decorations.push({
      kind: 'text',
      role: 'caption',
      at: {
        x: JOURNEY.actorDot + 6,
        y: cardTop + j * JOURNEY.actorRowH + JOURNEY.actorDot / 2,
      },
      text: actorName,
      align: 'left',
      bold: false,
    });
  }

  // Task actor dots
  for (let k = 1; k <= tasks.length; k++) {
    const t = tasks[k - 1];
    const x_k = taskX[k - 1];
    for (let m = 0; m < t.actors.length; m++) {
      const actorName = t.actors[m];
      const actorIdx = actors.indexOf(actorName);
      decorations.push({
        kind: 'rect',
        role: 'band',
        rect: {
          x: x_k - cardW / 2 + 8 + m * (JOURNEY.actorDot + 4),
          y: cardTop - JOURNEY.actorDot / 2,
          width: JOURNEY.actorDot,
          height: JOURNEY.actorDot,
        },
        radius: JOURNEY.actorDot / 2,
        colorIndex: actorIdx >= 0 ? actorIdx : 0,
      });
    }
  }

  // Edges between faces
  const edges: Record<string, EdgePath> = {};
  for (const edge of doc.edges) {
    const prevBox = nodes[edge.from];
    const thisBox = nodes[edge.to];
    if (prevBox && thisBox) {
      const startPt = borderPoint(prevBox, 'circle', thisBox.center);
      const endPt = borderPoint(thisBox, 'circle', prevBox.center);
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
