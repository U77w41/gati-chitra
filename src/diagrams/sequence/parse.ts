import { MESSAGES } from '../../core/constants';
import type { SeqEvent, SequenceData } from '../../core/diagram-types';
import type {
  GraphEdge, GraphNode, ParsedDoc, ShapeKind, Span,
} from '../../core/types';
import {
  checkLimits, commonLine, finishDoc, makeNode,
  newCommonState, readPrelude,
} from '../common/prelude';
import {
  ACTIVATE_RE, AUTONUMBER_RE, BOX_RE, DEACTIVATE_RE,
  DESTROY_RE, END_RE, FRAME_DIVIDER_RE, FRAME_START_RE,
  HEADER_RE, IGNORED_MENUS_RE, TITLE_RE,
} from './patterns';
import {
  extractBoxLabel, type FrameInfo, type OpenBox, parseMessage,
  parseNoteDecl, parseParticipantDecl, type ParticipantData,
} from './helpers';

export function parseSequence(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  const participantsMap = new Map<string, ParticipantData>();
  const participantOrder: string[] = [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const events: SeqEvent[] = [];
  const boxes: { label: string; members: string[] }[] = [];
  const frameStack: FrameInfo[] = [];

  let title: string | null = p.title;
  let autonumber: { start: number; step: number } | null = null;
  let openBox: OpenBox | null = null;
  let frameCounter = 0;
  let noteIndex = 0;
  let stageCounter = 0;
  const stageNodes: Record<string, number> = {};
  const stageEdges: Record<string, number> = {};

  function ensureParticipant(
    id: string, label: string, shape: ShapeKind, line: number, labelSpan?: Span,
  ): ParticipantData {
    let pData = participantsMap.get(id);
    if (!pData) {
      const node = makeNode(id, label, shape, line, { labelSpan, refLines: [line] });
      pData = { node, refLines: new Set<number>([line]) };
      participantsMap.set(id, pData);
      participantOrder.push(id);
      nodes.push(node);
      stageNodes[id] = 0;
      if (openBox) openBox.members.push(id);
    } else {
      pData.refLines.add(line);
      if (pData.node.label === id && label !== id) {
        pData.node.label = label;
        pData.node.labelSpan = labelSpan;
      }
      if (pData.node.shape === 'rect' && shape !== 'rect') pData.node.shape = shape;
    }
    return pData;
  }

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    const titleMatch = TITLE_RE.exec(t);
    if (titleMatch) {
      p.lines[i].kind = 'statement';
      title = titleMatch[1].trim();
      continue;
    }

    const autoMatch = AUTONUMBER_RE.exec(t);
    if (autoMatch) {
      p.lines[i].kind = 'statement';
      autonumber = {
        start: autoMatch[1] ? Number(autoMatch[1]) : 1,
        step: autoMatch[2] ? Number(autoMatch[2]) : 1,
      };
      continue;
    }

    if (IGNORED_MENUS_RE.test(t)) {
      p.lines[i].kind = 'statement';
      p.diagnostics.push({ line: i + 1, severity: 'info', message: MESSAGES.syntaxIgnored('Participant menus') });
      continue;
    }

    const destroyMatch = DESTROY_RE.exec(t);
    if (destroyMatch) {
      p.lines[i].kind = 'statement';
      p.diagnostics.push({ line: i + 1, severity: 'info', message: MESSAGES.syntaxIgnored('destroy') });
      continue;
    }

    const partDecl = parseParticipantDecl(t, raw, i);
    if (partDecl) {
      p.lines[i].kind = 'statement';
      if (partDecl.isCreate) {
        p.diagnostics.push({ line: i + 1, severity: 'info', message: MESSAGES.syntaxIgnored('create') });
      }
      if (partDecl.approxType) {
        p.diagnostics.push({
          line: i + 1,
          severity: 'info',
          message: MESSAGES.shapeApprox(partDecl.approxType, 'a rectangle'),
        });
      }
      ensureParticipant(partDecl.id, partDecl.label, partDecl.shape, i, partDecl.span);
      continue;
    }

    const boxMatch = BOX_RE.exec(t);
    if (boxMatch) {
      p.lines[i].kind = 'subgraph';
      openBox = {
        label: extractBoxLabel(boxMatch[1]),
        members: [],
        line: i,
      };
      continue;
    }

    const frameStartMatch = FRAME_START_RE.exec(t);
    if (frameStartMatch) {
      p.lines[i].kind = 'subgraph';
      const keyword = frameStartMatch[1];
      const label = keyword === 'rect' ? '' : frameStartMatch[2].trim();
      const frameId = frameCounter++;
      events.push({ type: 'frameStart', frameId, keyword, label });
      frameStack.push({ frameId, keyword, line: i });
      continue;
    }

    const dividerMatch = FRAME_DIVIDER_RE.exec(t);
    if (dividerMatch) {
      p.lines[i].kind = 'statement';
      const innermost = frameStack[frameStack.length - 1];
      const kw = dividerMatch[1];
      const valid =
        innermost &&
        ((kw === 'else' && innermost.keyword === 'alt') ||
          (kw === 'and' && innermost.keyword === 'par') ||
          (kw === 'option' && innermost.keyword === 'critical'));
      if (!valid) {
        p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
      } else {
        events.push({
          type: 'frameDivider',
          frameId: innermost.frameId,
          label: dividerMatch[2].trim(),
        });
      }
      continue;
    }

    if (END_RE.test(t)) {
      p.lines[i].kind = 'statement';
      if (frameStack.length > 0) {
        const popped = frameStack.pop()!;
        events.push({ type: 'frameEnd', frameId: popped.frameId });
      } else if (openBox) {
        boxes.push({ label: openBox.label, members: openBox.members });
        openBox = null;
      } else {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.strayBlockEnd });
      }
      continue;
    }

    const actMatch = ACTIVATE_RE.exec(t);
    if (actMatch) {
      p.lines[i].kind = 'statement';
      const id = actMatch[1];
      events.push({ type: 'activate', id });
      ensureParticipant(id, id, 'rect', i);
      continue;
    }

    const deactMatch = DEACTIVATE_RE.exec(t);
    if (deactMatch) {
      p.lines[i].kind = 'statement';
      const id = deactMatch[1];
      events.push({ type: 'deactivate', id });
      ensureParticipant(id, id, 'rect', i);
      continue;
    }

    const noteDecl = parseNoteDecl(t, raw, i, noteIndex + 1);
    if (noteDecl) {
      noteIndex++;
      p.lines[i].kind = 'statement';
      for (const targetId of noteDecl.targets) {
        ensureParticipant(targetId, targetId, 'rect', i);
      }
      nodes.push(noteDecl.node);
      events.push({
        type: 'note',
        nodeId: noteDecl.noteId,
        placement: noteDecl.placement,
        targets: noteDecl.targets,
      });
      stageNodes[noteDecl.noteId] = ++stageCounter;
      continue;
    }

    const msg = parseMessage(t, raw, i, edges.length);
    if (msg) {
      p.lines[i].kind = 'statement';
      if (msg.centralConn) {
        p.diagnostics.push({
          line: i + 1,
          severity: 'info',
          message: MESSAGES.syntaxIgnored('Central connections'),
        });
      }
      if (msg.isHalf) {
        p.diagnostics.push({
          line: i + 1,
          severity: 'info',
          message: MESSAGES.syntaxIgnored('Half arrows'),
        });
      }

      ensureParticipant(msg.from, msg.from, 'rect', i);
      ensureParticipant(msg.to, msg.to, 'rect', i);

      edges.push(msg.edge);
      events.push({ type: 'message', edgeId: msg.edge.id });
      stageEdges[msg.edge.id] = ++stageCounter;

      if (msg.suffix === '+') {
        events.push({ type: 'activate', id: msg.to });
        ensureParticipant(msg.to, msg.to, 'rect', i);
      } else if (msg.suffix === '-') {
        events.push({ type: 'deactivate', id: msg.from });
        ensureParticipant(msg.from, msg.from, 'rect', i);
      }
      continue;
    }

    p.lines[i].kind = 'unknown';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  for (const frame of frameStack) {
    p.diagnostics.push({
      line: frame.line + 1,
      severity: 'error',
      message: MESSAGES.unclosedBlock(frame.keyword),
    });
  }
  if (openBox) {
    p.diagnostics.push({
      line: openBox.line + 1,
      severity: 'error',
      message: MESSAGES.unclosedBlock('box'),
    });
  }

  for (const id of participantOrder) {
    const pData = participantsMap.get(id)!;
    pData.node.refLines = Array.from(pData.refLines);
  }

  const seqData: SequenceData = {
    participants: participantOrder,
    boxes,
    events,
    autonumber,
  };

  checkLimits(nodes, edges, p.diagnostics, p.lines.length);
  return finishDoc('sequence', p, st, {
    direction: 'TB',
    nodes,
    edges,
    groups: [],
    classDefs: {},
    title,
    stages: { nodes: stageNodes, edges: stageEdges },
    data: { sequence: seqData },
  });
}
