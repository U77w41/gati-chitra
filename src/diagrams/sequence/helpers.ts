import type {
  GraphEdge, GraphNode, MarkerKind, ShapeKind, Span,
} from '../../core/types';
import { makeEdge, makeNode, spanAt } from '../common/prelude';
import {
  CREATE_RE, HALF, MSG_RE, NOTE_RE, PARTICIPANT_RE, PARTICIPANT_TYPE_RE,
} from './patterns';

export interface ParticipantData {
  node: GraphNode;
  refLines: Set<number>;
}

export interface FrameInfo {
  frameId: number;
  keyword: string;
  line: number;
}

export interface OpenBox {
  label: string;
  members: string[];
  line: number;
}

export function extractBoxLabel(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const colorPrefix = /^(?:rgb\([^)]*\)|rgba\([^)]*\)|transparent|[A-Za-z0-9_#-]+)\s+(.*)$/.exec(trimmed);
  if (colorPrefix) {
    return colorPrefix[1].trim();
  }
  if (!trimmed.includes(' ')) return '';
  return trimmed;
}

export interface ArrowSpec {
  kind: 'open' | 'dotted';
  variant: string;
  markers: { start: MarkerKind; end: MarkerKind };
  isHalf: boolean;
}

export function resolveArrow(op: string): ArrowSpec {
  if (HALF.includes(op)) {
    const isDotted = op.startsWith('--');
    return {
      kind: isDotted ? 'dotted' : 'open',
      variant: isDotted ? '-->>' : '->>',
      markers: { start: 'none', end: 'arrow' },
      isHalf: true,
    };
  }
  switch (op) {
    case '->':
      return { kind: 'open', variant: op, markers: { start: 'none', end: 'none' }, isHalf: false };
    case '-->':
      return { kind: 'dotted', variant: op, markers: { start: 'none', end: 'none' }, isHalf: false };
    case '->>':
      return { kind: 'open', variant: op, markers: { start: 'none', end: 'arrow' }, isHalf: false };
    case '-->>':
      return { kind: 'dotted', variant: op, markers: { start: 'none', end: 'arrow' }, isHalf: false };
    case '<<->>':
      return { kind: 'open', variant: op, markers: { start: 'arrow', end: 'arrow' }, isHalf: false };
    case '<<-->>':
      return { kind: 'dotted', variant: op, markers: { start: 'arrow', end: 'arrow' }, isHalf: false };
    case '-x':
      return { kind: 'open', variant: op, markers: { start: 'none', end: 'cross' }, isHalf: false };
    case '--x':
      return { kind: 'dotted', variant: op, markers: { start: 'none', end: 'cross' }, isHalf: false };
    case '-)':
      return { kind: 'open', variant: op, markers: { start: 'none', end: 'openArrow' }, isHalf: false };
    case '--)':
      return { kind: 'dotted', variant: op, markers: { start: 'none', end: 'openArrow' }, isHalf: false };
    default:
      return { kind: 'open', variant: op, markers: { start: 'none', end: 'arrow' }, isHalf: false };
  }
}

export function resolveParticipantType(propsStr: string): { shape: ShapeKind; approxType?: string } {
  const m = /"type"\s*:\s*"(\w+)"/.exec(propsStr);
  if (m) {
    const type = m[1];
    if (type === 'database') {
      return { shape: 'cylinder' };
    }
    if (['boundary', 'control', 'entity', 'collections', 'queue'].includes(type)) {
      return { shape: 'rect', approxType: type };
    }
  }
  return { shape: 'rect' };
}

export interface ParsedParticipant {
  id: string;
  label: string;
  shape: ShapeKind;
  span?: Span;
  approxType?: string;
  isCreate?: boolean;
}

export function parseParticipantDecl(t: string, raw: string, i: number): ParsedParticipant | null {
  let isCreate = false;
  let declText = t;
  const createMatch = CREATE_RE.exec(t);
  if (createMatch) {
    isCreate = true;
    declText = `${createMatch[1]} ${createMatch[2]}`;
  }

  const partTypeMatch = PARTICIPANT_TYPE_RE.exec(declText);
  if (partTypeMatch) {
    const kw = partTypeMatch[1];
    const id = partTypeMatch[2];
    const propsStr = partTypeMatch[3];
    const explicitLabel = partTypeMatch[4];
    const { shape, approxType } = resolveParticipantType(propsStr);
    const finalShape = kw === 'actor' && shape === 'rect' ? 'actor' : shape;
    const label = explicitLabel ?? id;
    const span = explicitLabel !== undefined ? spanAt(raw, i, partTypeMatch, 4) : undefined;
    return { id, label, shape: finalShape, span, approxType, isCreate };
  }

  const partMatch = PARTICIPANT_RE.exec(declText);
  if (partMatch) {
    const kw = partMatch[1];
    const id = partMatch[2];
    const explicitLabel = partMatch[3];
    const shape: ShapeKind = kw === 'actor' ? 'actor' : 'rect';
    const label = explicitLabel ?? id;
    const span = explicitLabel !== undefined ? spanAt(raw, i, partMatch, 3) : undefined;
    return { id, label, shape, span, isCreate };
  }

  return null;
}

export interface ParsedNote {
  noteId: string;
  node: GraphNode;
  placement: 'left' | 'right' | 'over';
  targets: string[];
}

export function parseNoteDecl(t: string, raw: string, i: number, noteIndex: number): ParsedNote | null {
  const noteMatch = NOTE_RE.exec(t);
  if (!noteMatch) return null;

  const rawPlacement = noteMatch[1].toLowerCase();
  const placement: 'left' | 'right' | 'over' =
    rawPlacement === 'left of' ? 'left' : rawPlacement === 'right of' ? 'right' : 'over';
  const targets = noteMatch[2].split(',').map((s) => s.trim());
  const noteLabel = noteMatch[3].trim();
  const noteId = `note${noteIndex}`;
  const span = spanAt(raw, i, noteMatch, 3);
  const node = makeNode(noteId, noteLabel, 'note', i, {
    refLines: [i],
    labelSpan: span,
  });

  return { noteId, node, placement, targets };
}

export interface ParsedMessage {
  edge: GraphEdge;
  from: string;
  to: string;
  suffix?: string;
  isHalf: boolean;
  centralConn: boolean;
}

export function parseMessage(t: string, raw: string, i: number, edgeIdx: number): ParsedMessage | null {
  const msgMatch = MSG_RE.exec(t);
  if (!msgMatch) return null;

  const rawFrom = msgMatch[1];
  const op = msgMatch[2];
  const suffix = msgMatch[3];
  const rawTo = msgMatch[4];
  const rawLabel = msgMatch[5];

  const centralConn = rawFrom.includes('()') || rawTo.includes('()');
  const from = rawFrom.replace(/\(\)$/, '');
  const to = rawTo.replace(/\(\)$/, '');

  const arrow = resolveArrow(op);
  const label = rawLabel !== undefined ? rawLabel.trim() : '';
  const labelSpan = rawLabel !== undefined ? spanAt(raw, i, msgMatch, 5) : undefined;
  const opSpan = spanAt(raw, i, msgMatch, 2);

  const edge = makeEdge(edgeIdx, from, to, arrow.kind, label, i, {
    variant: arrow.variant,
    markers: arrow.markers,
    labelSpan,
    opSpan,
  });

  return { edge, from, to, suffix, isHalf: arrow.isHalf, centralConn };
}
