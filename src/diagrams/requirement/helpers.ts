import type { GraphEdge, NodeSection, Span, StyleMap } from '../../core/types';
import { makeEdge, spanAt } from '../common/prelude';

export const REQUIREMENT_TYPES: Record<string, string> = {
  requirement: 'Requirement',
  functionalRequirement: 'Functional Requirement',
  interfaceRequirement: 'Interface Requirement',
  performanceRequirement: 'Performance Requirement',
  physicalRequirement: 'Physical Requirement',
  designConstraint: 'Design Constraint',
};

export interface ReqNodeData {
  id: string;
  kind: 'requirement' | 'element';
  typeName: string;
  name: string;
  line: number;
  refLines: number[];
  fields: Record<string, string>;
  classNames: string[];
  style: StyleMap;
}

export function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

export function buildSections(
  kind: 'requirement' | 'element',
  typeName: string,
  name: string,
  fields: Record<string, string>,
): NodeSection[] {
  const s0: NodeSection = {
    rows: [[`«${typeName}»`]],
    align: 'center',
    weight: 'italic',
    divider: false,
  };
  const s1: NodeSection = {
    rows: [[name]],
    align: 'center',
    weight: 'bold',
    divider: false,
  };

  const rows: string[][] = [];
  if (kind === 'requirement') {
    if (fields.id !== undefined) rows.push([`ID: ${fields.id}`]);
    if (fields.text !== undefined) rows.push([`Text: ${fields.text}`]);
    if (fields.risk !== undefined) rows.push([`Risk: ${fields.risk}`]);
    if (fields.verifymethod !== undefined) rows.push([`Verification: ${fields.verifymethod}`]);
  } else {
    if (fields.type !== undefined) rows.push([`Type: ${fields.type}`]);
    if (fields.docref !== undefined) rows.push([`Doc Ref: ${fields.docref}`]);
  }

  const s2: NodeSection = {
    rows,
    align: 'left',
    weight: 'normal',
    divider: true,
  };

  return [s0, s1, s2];
}

export function buildReqEdge(
  index: number,
  line: number,
  raw: string,
  from: string,
  to: string,
  relType: string,
  m: RegExpExecArray,
): GraphEdge {
  const opSpan: Span | undefined = spanAt(raw, line, m, 2);
  return makeEdge(index, from, to, 'dotted', `«${relType}»`, line, {
    variant: relType,
    markers: { start: 'none', end: 'arrow' },
    opSpan,
  });
}
