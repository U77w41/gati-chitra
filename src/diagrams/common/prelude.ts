import { LIMITS, MESSAGES } from '../../core/constants';
import type { DiagramData } from '../../core/diagram-types';
import type {
  DiagramKind, Direction, DocStages, EdgeKind, GraphEdge, GraphGroup,
  GraphNode, ParsedDoc, Point, ShapeKind, SourceLine, Span, StyleMap,
} from '../../core/types';
import { PIN_LINE_RE } from '../../mermaid/positions';
import { cleanLabel } from '../../mermaid/props';
import { emptyDoc } from '../../mermaid/parse';

export interface Prelude {
  rawLines: string[];
  lines: SourceLine[];
  diagnostics: { line: number; severity: 'error' | 'warning' | 'info'; message: string }[];
  headerIdx: number;
  headerText: string;
  title: string | null;
}

export function readPrelude(text: string, header: RegExp): Prelude | ParsedDoc {
  const rawLines = text.split(/\r\n|\r|\n/);
  const lines: SourceLine[] = rawLines.map((t, index) => ({
    index, text: t, kind: 'unknown', nodeIds: [], edgeIndexes: [],
  }));
  const diagnostics: { line: number; severity: 'error' | 'warning' | 'info'; message: string }[] = [];

  if (text.length > LIMITS.maxTextChars) {
    return emptyDoc(lines, [{ line: 1, severity: 'error', message: MESSAGES.textTooLong }]);
  }

  let idx = 0;
  let title: string | null = null;

  while (idx < rawLines.length && rawLines[idx].trim() === '') {
    lines[idx].kind = 'blank';
    idx++;
  }

  if (idx < rawLines.length && rawLines[idx].trim() === '---') {
    let closing = -1;
    for (let j = idx + 1; j < rawLines.length; j++) {
      if (rawLines[j].trim() === '---') { closing = j; break; }
    }
    if (closing !== -1) {
      lines[idx].kind = 'frontmatter';
      for (let j = idx + 1; j < closing; j++) {
        lines[j].kind = 'frontmatter';
        const tm = /^\s*title\s*:\s*(.*)$/.exec(rawLines[j]);
        if (tm) {
          const rawTitle = tm[1].trim();
          const qm = /^["'](.*)["']$/.exec(rawTitle);
          title = qm ? qm[1] : rawTitle;
        }
      }
      lines[closing].kind = 'frontmatter';
      idx = closing + 1;
    }
  }

  while (idx < rawLines.length) {
    const t = rawLines[idx].trim();
    if (t === '') { lines[idx].kind = 'blank'; idx++; continue; }
    if (t.startsWith('%%{')) { lines[idx].kind = 'directive'; idx++; continue; }
    if (t.startsWith('%%')) { lines[idx].kind = 'comment'; idx++; continue; }
    break;
  }

  if (idx >= rawLines.length || !header.test(rawLines[idx].trim())) {
    const errLine = idx < rawLines.length ? idx + 1 : 1;
    return emptyDoc(lines, [{ line: errLine, severity: 'error', message: MESSAGES.notFlowchart }]);
  }

  lines[idx].kind = 'header';
  return { rawLines, lines, diagnostics, headerIdx: idx, headerText: rawLines[idx], title };
}

export interface CommonState {
  pins: Record<string, Point>;
  accTitle: string | null;
  accDescr: string | null;
  accBlock: string[] | null;
}

export function newCommonState(): CommonState {
  return { pins: {}, accTitle: null, accDescr: null, accBlock: null };
}

export function commonLine(raw: string, i: number, lines: SourceLine[], st: CommonState): boolean {
  const t = raw.trim();
  if (st.accBlock !== null) {
    lines[i].kind = 'acc';
    if (t === '}') { st.accDescr = st.accBlock.join('\n'); st.accBlock = null; }
    else { st.accBlock.push(t); }
    return true;
  }
  if (t === '') { lines[i].kind = 'blank'; return true; }
  if (t.startsWith('%%{')) { lines[i].kind = 'directive'; return true; }
  const pinMatch = PIN_LINE_RE.exec(raw);
  if (pinMatch) {
    lines[i].kind = 'pos';
    st.pins[pinMatch[1]] = { x: Number(pinMatch[2]), y: Number(pinMatch[3]) };
    return true;
  }
  if (t.startsWith('%%')) { lines[i].kind = 'comment'; return true; }
  const accTitleMatch = /^accTitle\s*:\s*(.*)$/.exec(t);
  if (accTitleMatch) { lines[i].kind = 'acc'; st.accTitle = accTitleMatch[1].trim(); return true; }
  const accDescrBlockMatch = /^accDescr\s*\{$/.exec(t);
  if (accDescrBlockMatch) { lines[i].kind = 'acc'; st.accBlock = []; return true; }
  const accDescrMatch = /^accDescr\s*:\s*(.*)$/.exec(t);
  if (accDescrMatch) { lines[i].kind = 'acc'; st.accDescr = accDescrMatch[1].trim(); return true; }
  return false;
}

export function makeNode(
  id: string, label: string, shape: ShapeKind, line: number, extra?: Partial<GraphNode>,
): GraphNode {
  return {
    id, label: cleanLabel(label), shape, classNames: [], style: {},
    group: null, markdown: false, line, ...extra,
  };
}

export function makeEdge(
  index: number, from: string, to: string, kind: EdgeKind, label: string, line: number, extra?: Partial<GraphEdge>,
): GraphEdge {
  return {
    id: `e${index}`, index, from, to, kind, label: cleanLabel(label), length: 1, style: {},
    ref: null, anim: { animate: null, speed: null }, markdown: false, fromIsGroup: false, toIsGroup: false,
    line, ...extra,
  };
}

export function checkLimits(
  nodes: GraphNode[], edges: GraphEdge[],
  diagnostics: { line: number; severity: 'error' | 'warning' | 'info'; message: string }[],
  line: number,
): boolean {
  if (nodes.length > LIMITS.maxNodes) {
    if (!diagnostics.some((d) => d.message === MESSAGES.tooManyNodes)) {
      diagnostics.push({ line, severity: 'error', message: MESSAGES.tooManyNodes });
    }
    return false;
  }
  if (edges.length > LIMITS.maxEdges) {
    if (!diagnostics.some((d) => d.message === MESSAGES.tooManyEdges)) {
      diagnostics.push({ line, severity: 'error', message: MESSAGES.tooManyEdges });
    }
    return false;
  }
  return true;
}

export function leadOf(raw: string): number {
  return raw.length - raw.trimStart().length;
}

export function spanAt(raw: string, line: number, m: RegExpExecArray, group: number): Span | undefined {
  const indices = (m as unknown as { indices?: [number, number][] }).indices;
  if (!indices || !indices[group]) return undefined;
  const lead = leadOf(raw);
  const [from, to] = indices[group];
  return { line, from: from + lead, to: to + lead };
}

export function applyClassStyles(nodes: GraphNode[], classDefs: Record<string, StyleMap>): void {
  for (const node of nodes) {
    let merged: StyleMap = {};
    for (const c of node.classNames) {
      if (classDefs[c]) merged = { ...merged, ...classDefs[c] };
    }
    node.style = { ...merged, ...node.style };
  }
}

export interface DocParts {
  direction: Direction;
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
  classDefs: Record<string, StyleMap>;
  title: string | null;
  stages?: DocStages;
  data?: DiagramData;
}

export function finishDoc(kind: DiagramKind, p: Prelude, st: CommonState, parts: DocParts): ParsedDoc {
  applyClassStyles(parts.nodes, parts.classDefs);
  for (const node of parts.nodes) {
    if (node.line >= 0 && node.line < p.lines.length && !p.lines[node.line].nodeIds.includes(node.id)) {
      p.lines[node.line].nodeIds.push(node.id);
    }
  }
  for (const edge of parts.edges) {
    if (edge.line >= 0 && edge.line < p.lines.length && !p.lines[edge.line].edgeIndexes.includes(edge.index)) {
      p.lines[edge.line].edgeIndexes.push(edge.index);
    }
  }
  const ok = !p.diagnostics.some((d) => d.severity === 'error');
  return {
    direction: parts.direction, nodes: parts.nodes, edges: parts.edges, groups: parts.groups,
    classDefs: parts.classDefs, pins: st.pins, title: parts.title ?? p.title, accTitle: st.accTitle,
    accDescr: st.accDescr, links: {}, explicitEdgeAnimation: false, lines: p.lines,
    diagnostics: p.diagnostics, ok, kind, stages: parts.stages, data: parts.data,
  };
}
