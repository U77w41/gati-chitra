import type { MarkerKind, NodeSection, Span, StyleMap } from '../../core/types';

export interface ClassData {
  id: string;
  label: string;
  labelSpan?: Span;
  line: number;
  group: string | null;
  annotation?: string;
  members: string[];
  refLines: number[];
  classNames: string[];
  style: StyleMap;
}

export function parseClassId(raw: string): { id: string; label: string } {
  const t = raw.trim();
  const m = /^([A-Za-z0-9_]+)(?:~([^~]+)~)?$/.exec(t);
  if (!m) return { id: t, label: t };
  const id = m[1];
  const label = m[2] ? `${id}<${m[2]}>` : id;
  return { id, label };
}

export function parseRelOp(op: string): {
  kind: 'open' | 'dotted';
  markers: { start: MarkerKind; end: MarkerKind };
  isLollipop: boolean;
} {
  if (op === '()--' || op === '--()') {
    return { kind: 'open', markers: { start: 'none', end: 'none' }, isLollipop: true };
  }
  const kind = op.includes('..') ? 'dotted' : 'open';
  let start: MarkerKind = 'none';
  if (op.startsWith('<|')) start = 'triangle';
  else if (op.startsWith('*')) start = 'diamondFilled';
  else if (op.startsWith('o')) start = 'diamond';
  else if (op.startsWith('<')) start = 'openArrow';

  let end: MarkerKind = 'none';
  if (op.endsWith('|>')) end = 'triangle';
  else if (op.endsWith('*')) end = 'diamondFilled';
  else if (op.endsWith('o')) end = 'diamond';
  else if (op.endsWith('>')) end = 'openArrow';

  return { kind, markers: { start, end }, isLollipop: false };
}

export function buildClassSections(data: ClassData): NodeSection[] {
  const sections: NodeSection[] = [];
  if (data.annotation) {
    sections.push({ rows: [[`«${data.annotation}»`]], align: 'center', weight: 'italic', divider: false });
  }
  sections.push({ rows: [[data.label]], align: 'center', weight: 'bold', divider: false });
  if (data.members.length > 0) {
    const attrRows: string[][] = [];
    const methodRows: string[][] = [];
    for (const m of data.members) {
      const sanitized = m.replace(/[$*]$/, '').replace(/~([^~]+)~/g, '<$1>');
      if (sanitized.includes('(')) methodRows.push([sanitized]);
      else attrRows.push([sanitized]);
    }
    sections.push({ rows: attrRows, align: 'left', weight: 'normal', divider: true });
    sections.push({ rows: methodRows, align: 'left', weight: 'normal', divider: true });
  }
  return sections;
}
