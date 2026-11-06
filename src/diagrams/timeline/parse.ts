import { MESSAGES } from '../../core/constants';
import type { GraphEdge, GraphNode, ParsedDoc, Span } from '../../core/types';
import {
  commonLine,
  finishDoc,
  leadOf,
  makeEdge,
  makeNode,
  newCommonState,
  readPrelude,
} from '../common/prelude';

const HEADER_RE = /^timeline(?:\s+(LR|TD))?\s*$/;
const TITLE_RE = /^title\s+(.+)$/;
const SECTION_RE = /^section\s+(.+)$/;
const CONTINUATION_RE = /^:\s*(.+)$/;
const PERIOD_EVENTS_RE = /^([^:]+?)\s*:\s*(.+)$/;

export function parseTimeline(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const mHeader = HEADER_RE.exec(p.headerText.trim());
  const direction = (mHeader && mHeader[1] === 'TD') ? 'TD' : 'LR';

  const sections: { name: string; colorIndex: number; periods: string[] }[] = [];
  const periods: { id: string; events: string[]; section: number }[] = [];
  const stageNodes: Record<string, number> = {};
  const stageEdges: Record<string, number> = {};

  let currentSectionIdx = -1;
  let periodCount = 0;

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
      currentSectionIdx = sections.length;
      sections.push({ name: mSec[1].trim(), colorIndex: currentSectionIdx, periods: [] });
      p.lines[i].kind = 'statement';
      continue;
    }

    const mCont = CONTINUATION_RE.exec(trimmed);
    if (mCont) {
      if (periodCount === 0) {
        p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
        p.lines[i].kind = 'unknown';
        continue;
      }
      const curPeriod = periods[periodCount - 1];
      const periodId = curPeriod.id;
      const colorIndex = curPeriod.section >= 0 ? curPeriod.section : periodCount - 1;
      const rawEvents = mCont[1].split(/\s*:\s*/).filter(Boolean);

      let searchIdx = 0;
      for (const evText of rawEvents) {
        const j = curPeriod.events.length + 1;
        const evId = `${periodId}e${j}`;
        curPeriod.events.push(evId);

        const idx = raw.indexOf(evText, searchIdx);
        const from = idx >= 0 ? idx : 0;
        const to = from + evText.length;
        searchIdx = to;
        const labelSpan: Span = { line: i, from, to };
        const defSpan: Span = { line: i, from: leadOf(raw), to: raw.length };

        const evNode = makeNode(evId, evText, 'rect', i, {
          colorIndex,
          labelSpan,
          defSpan,
          refLines: [i],
        });
        nodes.push(evNode);

        const prevId = j === 1 ? periodId : `${periodId}e${j - 1}`;
        const edge = makeEdge(edges.length, prevId, evId, 'dotted', '', i, {
          markers: { start: 'none', end: 'none' },
        });
        edges.push(edge);

        stageNodes[evId] = periodCount - 1;
        stageEdges[edge.id] = periodCount - 1;
      }

      p.lines[i].kind = 'statement';
      continue;
    }

    const mPeriodEvents = PERIOD_EVENTS_RE.exec(trimmed);
    if (mPeriodEvents) {
      periodCount++;
      const periodId = `p${periodCount}`;
      const periodText = mPeriodEvents[1].trim();
      const rawEvents = mPeriodEvents[2].split(/\s*:\s*/).filter(Boolean);
      const colorIndex = currentSectionIdx >= 0 ? currentSectionIdx : periodCount - 1;

      if (currentSectionIdx >= 0) {
        sections[currentSectionIdx].periods.push(periodId);
      }

      const curPeriodEvents: string[] = [];
      periods.push({ id: periodId, events: curPeriodEvents, section: currentSectionIdx });

      let searchIdx = 0;
      const pIdx = raw.indexOf(periodText, searchIdx);
      const pFrom = pIdx >= 0 ? pIdx : 0;
      const pTo = pFrom + periodText.length;
      searchIdx = pTo;
      const pLabelSpan: Span = { line: i, from: pFrom, to: pTo };
      const defSpan: Span = { line: i, from: leadOf(raw), to: raw.length };

      const periodNode = makeNode(periodId, periodText, 'round', i, {
        colorIndex,
        labelSpan: pLabelSpan,
        defSpan,
        refLines: [i],
      });
      nodes.push(periodNode);
      stageNodes[periodId] = periodCount - 1;

      if (periodCount >= 2) {
        const prevPeriodId = `p${periodCount - 1}`;
        const edge = makeEdge(edges.length, prevPeriodId, periodId, 'arrow', '', i);
        edges.push(edge);
        stageEdges[edge.id] = periodCount - 1;
      }

      for (const evText of rawEvents) {
        const j = curPeriodEvents.length + 1;
        const evId = `${periodId}e${j}`;
        curPeriodEvents.push(evId);

        const idx = raw.indexOf(evText, searchIdx);
        const from = idx >= 0 ? idx : 0;
        const to = from + evText.length;
        searchIdx = to;
        const labelSpan: Span = { line: i, from, to };

        const evNode = makeNode(evId, evText, 'rect', i, {
          colorIndex,
          labelSpan,
          defSpan,
          refLines: [i],
        });
        nodes.push(evNode);

        const prevId = j === 1 ? periodId : `${periodId}e${j - 1}`;
        const edge = makeEdge(edges.length, prevId, evId, 'dotted', '', i, {
          markers: { start: 'none', end: 'none' },
        });
        edges.push(edge);

        stageNodes[evId] = periodCount - 1;
        stageEdges[edge.id] = periodCount - 1;
      }

      p.lines[i].kind = 'statement';
      continue;
    }

    // Period with no events
    periodCount++;
    const periodId = `p${periodCount}`;
    const periodText = trimmed;
    const colorIndex = currentSectionIdx >= 0 ? currentSectionIdx : periodCount - 1;

    if (currentSectionIdx >= 0) {
      sections[currentSectionIdx].periods.push(periodId);
    }

    periods.push({ id: periodId, events: [], section: currentSectionIdx });

    const pFrom = raw.indexOf(periodText);
    const pLabelSpan: Span = { line: i, from: pFrom, to: pFrom + periodText.length };
    const defSpan: Span = { line: i, from: leadOf(raw), to: raw.length };

    const periodNode = makeNode(periodId, periodText, 'round', i, {
      colorIndex,
      labelSpan: pLabelSpan,
      defSpan,
      refLines: [i],
    });
    nodes.push(periodNode);
    stageNodes[periodId] = periodCount - 1;

    if (periodCount >= 2) {
      const prevPeriodId = `p${periodCount - 1}`;
      const edge = makeEdge(edges.length, prevPeriodId, periodId, 'arrow', '', i);
      edges.push(edge);
      stageEdges[edge.id] = periodCount - 1;
    }

    p.lines[i].kind = 'statement';
  }

  return finishDoc('timeline', p, st, {
    direction: direction === 'TD' ? 'TB' : 'LR',
    nodes,
    edges,
    groups: [],
    classDefs: {},
    title: p.title,
    stages: { nodes: stageNodes, edges: stageEdges },
    data: {
      timeline: {
        direction,
        sections,
        periods,
      },
    },
  });
}
