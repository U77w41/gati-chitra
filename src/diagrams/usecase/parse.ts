import { MESSAGES } from '../../core/constants';
import type {
  Direction, GraphEdge, GraphGroup, GraphNode, ShapeKind, Span, StyleMap,
} from '../../core/types';
import { parseStyleString } from '../../mermaid/styles';
import {
  checkLimits, commonLine, finishDoc, makeEdge, makeNode,
  newCommonState, readPrelude, spanAt,
} from '../common/prelude';
import {
  ACTOR_RE, CLASS_DEF_RE, CLASS_RE, DIR_RE, EDGE_RE, END_RE,
  HEADER_RE, LABELLED_ASSOC_RE, NOTE_RE, STYLE_RE,
  SYS_BOUNDARY_QUOTED_RE, SYS_BOUNDARY_RE, UC_ELLIPSE_RE, UC_RECT_RE,
} from './patterns';
import {
  type UseCaseNodeData, UsecaseNodes, buildUsecaseEdge,
} from './helpers';

export function parseUsecase(text: string): import('../../core/types').ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  let direction: Direction = 'LR';
  const nodesTracker = new UsecaseNodes();
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  const classDefs: Record<string, StyleMap> = {};

  let activeGroup: {
    id: string;
    title: string;
    openLine: number;
    memberIds: string[];
  } | null = null;

  function registerNode(
    id: string,
    label: string,
    shape: ShapeKind,
    line: number,
    labelSpan?: Span,
  ): UseCaseNodeData {
    const grp = activeGroup ? activeGroup.id : null;
    const d = nodesTracker.addOrUpdate(id, label, shape, line, grp, labelSpan);
    if (activeGroup && !activeGroup.memberIds.includes(id)) {
      activeGroup.memberIds.push(id);
    }
    return d;
  }

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    const dirMatch = DIR_RE.exec(t);
    if (dirMatch) {
      p.lines[i].kind = 'direction';
      direction = dirMatch[1] as Direction;
      continue;
    }

    const sysMatch = SYS_BOUNDARY_RE.exec(t);
    if (sysMatch) {
      if (activeGroup !== null) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.groupTooDeep });
        p.lines[i].kind = 'unknown';
        continue;
      }
      p.lines[i].kind = 'subgraph';
      const id = sysMatch[1];
      const title = sysMatch[2] !== undefined ? sysMatch[2] : id;
      activeGroup = { id, title, openLine: i, memberIds: [] };
      continue;
    }

    const sysQuotedMatch = SYS_BOUNDARY_QUOTED_RE.exec(t);
    if (sysQuotedMatch) {
      if (activeGroup !== null) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.groupTooDeep });
        p.lines[i].kind = 'unknown';
        continue;
      }
      p.lines[i].kind = 'subgraph';
      const title = sysQuotedMatch[1];
      const id = title.replace(/\s+/g, '_');
      activeGroup = { id, title, openLine: i, memberIds: [] };
      continue;
    }

    if (END_RE.test(t)) {
      if (activeGroup !== null) {
        p.lines[i].kind = 'end';
        groups.push({
          id: activeGroup.id,
          title: activeGroup.title,
          parent: null,
          direction: null,
          markdown: false,
          line: activeGroup.openLine,
          endLine: i,
          memberIds: activeGroup.memberIds,
        });
        activeGroup = null;
        continue;
      }
      p.lines[i].kind = 'unknown';
      p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
      continue;
    }

    const actorMatch = ACTOR_RE.exec(t);
    if (actorMatch) {
      p.lines[i].kind = 'statement';
      const id = actorMatch[1];
      const label = actorMatch[2] !== undefined ? actorMatch[2] : id;
      const span = spanAt(raw, i, actorMatch, 2);
      registerNode(id, label, 'actor', i, span);
      continue;
    }

    const ellipseMatch = UC_ELLIPSE_RE.exec(t);
    if (ellipseMatch) {
      p.lines[i].kind = 'statement';
      const id = ellipseMatch[1];
      const label = ellipseMatch[2] !== undefined ? ellipseMatch[2] : id;
      const span = spanAt(raw, i, ellipseMatch, 2);
      registerNode(id, label, 'ellipse', i, span);
      continue;
    }

    const rectMatch = UC_RECT_RE.exec(t);
    if (rectMatch) {
      p.lines[i].kind = 'statement';
      const id = rectMatch[1];
      const label = rectMatch[2] !== undefined ? rectMatch[2] : id;
      const span = spanAt(raw, i, rectMatch, 2);
      registerNode(id, label, 'rect', i, span);
      continue;
    }

    const assocMatch = LABELLED_ASSOC_RE.exec(t);
    if (assocMatch) {
      p.lines[i].kind = 'statement';
      const from = assocMatch[1];
      const label = assocMatch[2];
      const to = assocMatch[3];
      nodesTracker.ensureUndeclared(from, i);
      nodesTracker.ensureUndeclared(to, i);
      edges.push(makeEdge(edges.length, from, to, 'open', label, i, {
        variant: '-->',
        markers: { start: 'none', end: 'arrow' },
        labelSpan: spanAt(raw, i, assocMatch, 2),
      }));
      continue;
    }

    const edgeMatch = EDGE_RE.exec(t);
    if (edgeMatch) {
      p.lines[i].kind = 'statement';
      const from = edgeMatch[1];
      const op = edgeMatch[2];
      const to = edgeMatch[3];
      const label = edgeMatch[4];
      nodesTracker.ensureUndeclared(from, i);
      nodesTracker.ensureUndeclared(to, i);
      edges.push(buildUsecaseEdge(edges.length, i, raw, from, to, op, label, edgeMatch, 4, 2));
      continue;
    }

    const noteMatch = NOTE_RE.exec(t);
    if (noteMatch) {
      p.lines[i].kind = 'statement';
      const targetId = noteMatch[1];
      const noteLabel = noteMatch[2];
      const noteId = `note_${targetId}`;
      nodesTracker.ensureUndeclared(targetId, i);
      registerNode(noteId, noteLabel, 'note', i, spanAt(raw, i, noteMatch, 2));
      edges.push(makeEdge(edges.length, noteId, targetId, 'dotted', '', i, {
        markers: { start: 'none', end: 'none' },
      }));
      continue;
    }

    const styleMatch = STYLE_RE.exec(t);
    if (styleMatch) {
      p.lines[i].kind = 'style';
      const d = nodesTracker.map.get(styleMatch[1]);
      if (d) d.style = { ...d.style, ...parseStyleString(styleMatch[2]) };
      continue;
    }

    const classDefMatch = CLASS_DEF_RE.exec(t);
    if (classDefMatch) {
      p.lines[i].kind = 'classDef';
      classDefs[classDefMatch[1]] = parseStyleString(classDefMatch[2]);
      continue;
    }

    const classMatch = CLASS_RE.exec(t);
    if (classMatch) {
      p.lines[i].kind = 'class';
      const ids = classMatch[1].split(',').map((s) => s.trim());
      const cls = classMatch[2];
      for (const id of ids) {
        const d = nodesTracker.map.get(id);
        if (d && !d.classNames.includes(cls)) d.classNames.push(cls);
      }
      continue;
    }

    p.lines[i].kind = 'unknown';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  if (activeGroup !== null) {
    p.diagnostics.push({
      line: activeGroup.openLine + 1,
      severity: 'error',
      message: MESSAGES.unclosedBlock('systemBoundary'),
    });
    groups.push({
      id: activeGroup.id,
      title: activeGroup.title,
      parent: null,
      direction: null,
      markdown: false,
      line: activeGroup.openLine,
      memberIds: activeGroup.memberIds,
    });
  }

  const nodes: GraphNode[] = [];
  for (const id of nodesTracker.order) {
    const d = nodesTracker.map.get(id)!;
    nodes.push(makeNode(d.id, d.label, d.shape, d.line, {
      group: d.group,
      labelSpan: d.labelSpan,
      classNames: d.classNames,
      style: d.style,
    }));
  }

  checkLimits(nodes, edges, p.diagnostics, p.lines.length);
  return finishDoc('usecase', p, st, {
    direction, nodes, edges, groups, classDefs, title: null,
  });
}
