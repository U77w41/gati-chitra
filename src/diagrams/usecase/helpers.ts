import type {
  EdgeKind, GraphEdge, MarkerKind, ShapeKind, Span, StyleMap,
} from '../../core/types';
import { makeEdge, spanAt } from '../common/prelude';

export interface UseCaseNodeData {
  id: string;
  label: string;
  shape: ShapeKind;
  group: string | null;
  line: number;
  labelSpan?: Span;
  classNames: string[];
  style: StyleMap;
}

export interface OperatorInfo {
  kind: EdgeKind;
  variant: string;
  markers: { start: MarkerKind; end: MarkerKind };
}

export function parseOperator(rawOp: string): OperatorInfo {
  const variant = rawOp.replace(/-{2,}/g, '--');
  switch (variant) {
    case '-->':
      return { kind: 'open', variant, markers: { start: 'none', end: 'arrow' } };
    case '<--':
      return { kind: 'open', variant, markers: { start: 'arrow', end: 'none' } };
    case '--':
      return { kind: 'open', variant, markers: { start: 'none', end: 'none' } };
    case '--o':
      return { kind: 'open', variant, markers: { start: 'none', end: 'circle' } };
    case 'o--':
      return { kind: 'open', variant, markers: { start: 'circle', end: 'none' } };
    case '--x':
      return { kind: 'open', variant, markers: { start: 'none', end: 'cross' } };
    case 'x--':
      return { kind: 'open', variant, markers: { start: 'cross', end: 'none' } };
    case '--|>':
      return { kind: 'open', variant, markers: { start: 'none', end: 'triangle' } };
    case '..>':
      return { kind: 'dotted', variant, markers: { start: 'none', end: 'openArrow' } };
    default:
      return { kind: 'open', variant, markers: { start: 'none', end: 'none' } };
  }
}

export function buildUsecaseEdge(
  index: number,
  line: number,
  raw: string,
  from: string,
  to: string,
  rawOp: string,
  rawLabel: string | undefined,
  m: RegExpExecArray,
  labelGroupIdx?: number,
  opGroupIdx = 2,
): GraphEdge {
  const opInfo = parseOperator(rawOp);
  let label = rawLabel?.trim() ?? '';
  if (opInfo.variant === '..>') {
    const lower = label.toLowerCase();
    if (lower === 'include') label = '«include»';
    else if (lower === 'extend') label = '«extend»';
  }

  const opSpan = spanAt(raw, line, m, opGroupIdx);
  const labelSpan = labelGroupIdx !== undefined ? spanAt(raw, line, m, labelGroupIdx) : undefined;

  return makeEdge(index, from, to, opInfo.kind, label, line, {
    variant: opInfo.variant,
    markers: opInfo.markers,
    opSpan,
    labelSpan,
  });
}

export class UsecaseNodes {
  map = new Map<string, UseCaseNodeData>();
  order: string[] = [];

  addOrUpdate(
    id: string,
    label: string,
    shape: ShapeKind,
    line: number,
    grp: string | null,
    labelSpan?: Span,
  ): UseCaseNodeData {
    let d = this.map.get(id);
    if (!d) {
      d = {
        id,
        label,
        shape,
        group: grp,
        line,
        labelSpan,
        classNames: [],
        style: {},
      };
      this.map.set(id, d);
      this.order.push(id);
    } else {
      d.label = label;
      d.shape = shape;
      if (labelSpan) d.labelSpan = labelSpan;
      if (grp && !d.group) d.group = grp;
    }
    return d;
  }

  ensureUndeclared(id: string, line: number): UseCaseNodeData {
    let d = this.map.get(id);
    if (!d) {
      d = {
        id,
        label: id,
        shape: 'ellipse',
        group: null,
        line,
        classNames: [],
        style: {},
      };
      this.map.set(id, d);
      this.order.push(id);
    }
    return d;
  }
}
