import { MESSAGES } from '../../core/constants';
import type {
  GraphEdge, GraphGroup, GraphNode, IconName, ParsedDoc, StyleMap,
} from '../../core/types';
import {
  checkLimits, commonLine, finishDoc, makeEdge, makeNode,
  newCommonState, readPrelude, spanAt,
} from '../common/prelude';
import {
  ALIGN_RE, EDGE_RE, GROUP_RE, HEADER_RE, JUNCTION_RE, SERVICE_RE,
} from './patterns';

const VALID_ICONS = new Set(['cloud', 'database', 'disk', 'internet', 'server']);

function resolveIcon(
  rawIcon: string | undefined,
  line: number,
  diagnostics: { line: number; severity: 'error' | 'warning' | 'info'; message: string }[],
): IconName | undefined {
  if (!rawIcon) return undefined;
  if (VALID_ICONS.has(rawIcon)) return rawIcon as IconName;
  diagnostics.push({ line, severity: 'info', message: MESSAGES.iconFallback(rawIcon) });
  return 'server';
}

interface ServiceData {
  id: string;
  group: string | null;
}

export function parseArchitecture(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  const classDefs: Record<string, StyleMap> = {};
  const sides: Record<string, { from: 'L' | 'R' | 'T' | 'B'; to: 'L' | 'R' | 'T' | 'B' }> = {};

  const declaredServices = new Map<string, ServiceData>();
  const declaredNodeIds = new Set<string>();
  const declaredGroupIds = new Set<string>();

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    if (ALIGN_RE.test(t)) {
      p.lines[i].kind = 'directive';
      p.diagnostics.push({ line: i + 1, severity: 'info', message: MESSAGES.syntaxIgnored('align') });
      continue;
    }

    const groupMatch = GROUP_RE.exec(t);
    if (groupMatch) {
      p.lines[i].kind = 'subgraph';
      const id = groupMatch[1];
      const title = groupMatch[3] !== undefined ? groupMatch[3] : id;
      const parent = groupMatch[4] ?? null;
      declaredGroupIds.add(id);
      groups.push({
        id,
        title,
        parent,
        direction: null,
        markdown: false,
        line: i,
        labelSpan: spanAt(raw, i, groupMatch, 3),
      });
      continue;
    }

    const serviceMatch = SERVICE_RE.exec(t);
    if (serviceMatch) {
      p.lines[i].kind = 'statement';
      const id = serviceMatch[1];
      const rawIcon = serviceMatch[2];
      const label = serviceMatch[3] !== undefined ? serviceMatch[3] : id;
      const group = serviceMatch[4] ?? null;
      const icon = resolveIcon(rawIcon, i + 1, p.diagnostics);
      declaredServices.set(id, { id, group });
      declaredNodeIds.add(id);
      nodes.push(makeNode(id, label, 'round', i, {
        group,
        icon,
        labelSpan: spanAt(raw, i, serviceMatch, 3),
        refLines: [i],
      }));
      continue;
    }

    const junctionMatch = JUNCTION_RE.exec(t);
    if (junctionMatch) {
      p.lines[i].kind = 'statement';
      const id = junctionMatch[1];
      const group = junctionMatch[2] ?? null;
      declaredNodeIds.add(id);
      nodes.push(makeNode(id, '', 'filledCircle', i, {
        group,
        size: { width: 12, height: 12 },
        refLines: [i],
      }));
      continue;
    }

    const edgeMatch = EDGE_RE.exec(t);
    if (edgeMatch) {
      p.lines[i].kind = 'statement';
      const rawFrom = edgeMatch[1];
      const fromGroup = Boolean(edgeMatch[2]);
      const fromSide = edgeMatch[3] as 'L' | 'R' | 'T' | 'B';
      const variant = edgeMatch[4];
      const startArrow = variant.startsWith('<');
      const endArrow = variant.endsWith('>');
      const toSide = edgeMatch[5] as 'L' | 'R' | 'T' | 'B';
      const rawTo = edgeMatch[6];
      const toGroup = Boolean(edgeMatch[7]);

      let fromId = rawFrom;
      let fromIsGroup = false;
      if (fromGroup) {
        const s = declaredServices.get(rawFrom);
        if (!s || !s.group) {
          p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.unknownNode(rawFrom) });
        } else {
          fromId = s.group;
          fromIsGroup = true;
        }
      } else if (!declaredNodeIds.has(rawFrom) && !declaredGroupIds.has(rawFrom)) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.unknownNode(rawFrom) });
      } else {
        fromIsGroup = declaredGroupIds.has(rawFrom);
      }

      let toId = rawTo;
      let toIsGroup = false;
      if (toGroup) {
        const s = declaredServices.get(rawTo);
        if (!s || !s.group) {
          p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.unknownNode(rawTo) });
        } else {
          toId = s.group;
          toIsGroup = true;
        }
      } else if (!declaredNodeIds.has(rawTo) && !declaredGroupIds.has(rawTo)) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.unknownNode(rawTo) });
      } else {
        toIsGroup = declaredGroupIds.has(rawTo);
      }

      const edgeIdx = edges.length;
      const edgeId = `e${edgeIdx}`;
      sides[edgeId] = { from: fromSide, to: toSide };
      const opSpan = spanAt(raw, i, edgeMatch, 4);

      edges.push(makeEdge(edgeIdx, fromId, toId, 'open', '', i, {
        variant,
        markers: {
          start: startArrow ? 'arrow' : 'none',
          end: endArrow ? 'arrow' : 'none',
        },
        fromIsGroup,
        toIsGroup,
        opSpan,
      }));
      continue;
    }

    p.lines[i].kind = 'unknown';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  checkLimits(nodes, edges, p.diagnostics, p.lines.length);
  return finishDoc('architecture', p, st, {
    direction: 'TB',
    nodes,
    edges,
    groups,
    classDefs,
    title: null,
    data: { architecture: { sides } },
  });
}
