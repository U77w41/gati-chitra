import { JOURNEY, MESSAGES } from '../../core/constants';
import type { GraphEdge, GraphNode, ParsedDoc } from '../../core/types';
import {
  commonLine,
  finishDoc,
  makeEdge,
  makeNode,
  newCommonState,
  readPrelude,
  spanAt,
} from '../common/prelude';

const HEADER_RE = /^journey\s*$/;
const TITLE_RE = /^title\s+(.+)$/;
const SECTION_RE = /^section\s+(.+)$/;
const TASK_RE = /^(.+?)\s*:\s*(-?\d+)\s*(?::\s*(.*))?$/d;

export function parseJourney(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const sections: { name: string; colorIndex: number }[] = [];
  const actors: string[] = [];
  const tasks: { cardId: string; faceId: string; score: number; actors: string[]; section: number }[] = [];
  const stageNodes: Record<string, number> = {};
  const stageEdges: Record<string, number> = {};

  let currentSectionIdx = -1;
  let taskCount = 0;

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;

    const trimmed = raw.trim();
    if (!trimmed) {
      p.lines[i].kind = 'blank';
      continue;
    }

    const mTitle = TITLE_RE.exec(trimmed);
    if (mTitle) {
      p.title = mTitle[1].trim();
      p.lines[i].kind = 'directive';
      continue;
    }

    const mSec = SECTION_RE.exec(trimmed);
    if (mSec) {
      const name = mSec[1].trim();
      currentSectionIdx = sections.length;
      sections.push({ name, colorIndex: currentSectionIdx });
      p.lines[i].kind = 'statement';
      continue;
    }

    const mTask = TASK_RE.exec(trimmed);
    if (mTask) {
      taskCount++;
      const cardId = `t${taskCount}`;
      const faceId = `f${taskCount}`;
      const label = mTask[1].trim();
      let score = parseInt(mTask[2], 10);
      if (score < 1 || score > 5) {
        p.diagnostics.push({
          line: i + 1,
          severity: 'warning',
          message: MESSAGES.journeyScore,
        });
        score = Math.max(1, Math.min(5, score));
      }

      if (currentSectionIdx === -1) {
        currentSectionIdx = 0;
        sections.push({ name: '', colorIndex: 0 });
      }

      const taskActors = mTask[3]
        ? mTask[3].split(',').map((a) => a.trim()).filter(Boolean)
        : [];
      for (const a of taskActors) {
        if (!actors.includes(a)) {
          actors.push(a);
        }
      }

      tasks.push({
        cardId,
        faceId,
        score,
        actors: taskActors,
        section: currentSectionIdx,
      });

      const labelSpan = spanAt(raw, i, mTask, 1);
      const cardNode = makeNode(cardId, label, 'round', i, {
        colorIndex: currentSectionIdx,
        labelSpan,
        refLines: [i],
      });

      const faceIcon = score >= 4 ? 'faceHappy' : score === 3 ? 'faceNeutral' : 'faceSad';
      const faceNode = makeNode(faceId, '', 'circle', i, {
        size: { width: JOURNEY.faceD, height: JOURNEY.faceD },
        icon: faceIcon,
        colorIndex: currentSectionIdx,
        refLines: [i],
      });

      nodes.push(cardNode, faceNode);

      if (taskCount >= 2) {
        const prevFaceId = `f${taskCount - 1}`;
        const edge = makeEdge(edges.length, prevFaceId, faceId, 'open', '', i, {
          markers: { start: 'none', end: 'none' },
        });
        edges.push(edge);
        stageEdges[edge.id] = taskCount - 1;
      }

      stageNodes[cardId] = taskCount - 1;
      stageNodes[faceId] = taskCount - 1;

      p.lines[i].kind = 'statement';
      p.lines[i].nodeIds.push(cardId, faceId);
      continue;
    }

    p.lines[i].kind = 'unknown';
  }

  return finishDoc('journey', p, st, {
    direction: 'LR',
    nodes,
    edges,
    groups: [],
    classDefs: {},
    title: p.title,
    stages: { nodes: stageNodes, edges: stageEdges },
    data: {
      journey: {
        sections,
        actors,
        tasks,
      },
    },
  });
}
