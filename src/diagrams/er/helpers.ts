import type { EdgeKind, GraphEdge, MarkerKind, NodeSection, Span, StyleMap } from '../../core/types';
import { cleanLabel } from '../../mermaid/props';
import { leadOf, makeEdge, spanAt } from '../common/prelude';

export interface EntityData {
  id: string;
  label: string;
  labelSpan?: Span;
  line: number;
  group: string | null;
  attributeRows: string[][];
  refLines: number[];
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

export function parseEntityId(rawName: string, rawAlias?: string): { id: string; label: string; cssClass?: string } {
  let id = rawName.trim();
  let cssClass: string | undefined;
  if (id.startsWith('"') && id.endsWith('"')) {
    id = id.slice(1, -1);
  } else if (id.includes(':::')) {
    const parts = id.split(':::');
    id = parts[0];
    cssClass = parts[1];
  }
  let label = id;
  if (rawAlias !== undefined) {
    label = rawAlias.replace(/^"|"$/g, '');
  }
  return { id, label, cssClass };
}

const CARD_L_MAP: Record<string, MarkerKind> = {
  '|o': 'erZeroOrOne',
  '||': 'erOne',
  '}o': 'erZeroOrMore',
  '}|': 'erOneOrMore',
};

const CARD_R_MAP: Record<string, MarkerKind> = {
  'o|': 'erZeroOrOne',
  '||': 'erOne',
  'o{': 'erZeroOrMore',
  '|{': 'erOneOrMore',
};

const WORD_MARKER_MAP: Record<string, MarkerKind> = {
  'one or zero': 'erZeroOrOne',
  'zero or one': 'erZeroOrOne',
  'only one': 'erOne',
  '1': 'erOne',
  'zero or more': 'erZeroOrMore',
  'zero or many': 'erZeroOrMore',
  'many(0)': 'erZeroOrMore',
  '0+': 'erZeroOrMore',
  'one or more': 'erOneOrMore',
  'one or many': 'erOneOrMore',
  'many(1)': 'erOneOrMore',
  '1+': 'erOneOrMore',
};

const WORD_CARD_L_MAP: Record<string, string> = {
  'one or zero': '|o',
  'zero or one': '|o',
  'only one': '||',
  '1': '||',
  'zero or more': '}o',
  'zero or many': '}o',
  'many(0)': '}o',
  '0+': '}o',
  'one or more': '}|',
  'one or many': '}|',
  'many(1)': '}|',
  '1+': '}|',
};

const WORD_CARD_R_MAP: Record<string, string> = {
  'one or zero': 'o|',
  'zero or one': 'o|',
  'only one': '||',
  '1': '||',
  'zero or more': 'o{',
  'zero or many': 'o{',
  'many(0)': 'o{',
  '0+': 'o{',
  'one or more': '|{',
  'one or many': '|{',
  'many(1)': '|{',
  '1+': '|{',
};

export function parseSymbolRel(m: RegExpExecArray): {
  kind: EdgeKind;
  variant: string;
  markers: { start: MarkerKind; end: MarkerKind };
} {
  const left = m[3];
  const line = m[4];
  const right = m[5];
  const leftMarker = CARD_L_MAP[left] ?? 'none';
  const rightMarker = CARD_R_MAP[right] ?? 'none';
  const kind: EdgeKind = line === '..' ? 'dotted' : 'open';
  const variant = `${left}${line}${right}`;
  return { kind, variant, markers: { start: leftMarker, end: rightMarker } };
}

export function parseWordRel(m: RegExpExecArray): {
  kind: EdgeKind;
  variant: string;
  markers: { start: MarkerKind; end: MarkerKind };
} {
  const leftWord = m[3];
  const lineWord = m[4];
  const rightWord = m[5];
  const leftMarker = WORD_MARKER_MAP[leftWord] ?? 'none';
  const rightMarker = WORD_MARKER_MAP[rightWord] ?? 'none';
  const kind: EdgeKind = lineWord === 'optionally to' ? 'dotted' : 'open';
  const leftSym = WORD_CARD_L_MAP[leftWord] ?? '||';
  const lineSym = lineWord === 'optionally to' ? '..' : '--';
  const rightSym = WORD_CARD_R_MAP[rightWord] ?? '||';
  const variant = `${leftSym}${lineSym}${rightSym}`;
  return { kind, variant, markers: { start: leftMarker, end: rightMarker } };
}

export function buildErSections(label: string, attributeRows: string[][]): NodeSection[] | undefined {
  if (attributeRows.length === 0) return undefined;
  return [
    { rows: [[label]], align: 'center', weight: 'bold', divider: false },
    { rows: attributeRows, align: 'left', weight: 'normal', divider: true },
  ];
}

export function buildRelEdge(
  index: number,
  line: number,
  raw: string,
  m: RegExpExecArray,
  rel: { kind: EdgeKind; variant: string; markers: { start: MarkerKind; end: MarkerKind } },
  fromId: string,
  toId: string,
): GraphEdge {
  const label = cleanLabel(unquote(m[8]));
  const span = spanAt(raw, line, m, 8);
  const lead = leadOf(raw);
  const ind = m.indices;
  const opSpan = (ind && ind[3] && ind[5]) ? {
    line,
    from: ind[3][0] + lead,
    to: ind[5][1] + lead,
  } : undefined;
  return makeEdge(index, fromId, toId, rel.kind, label, line, {
    variant: rel.variant,
    markers: rel.markers,
    labelSpan: span,
    opSpan,
  });
}
