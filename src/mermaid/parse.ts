import { LIMITS, MESSAGES } from '../core/constants';
import type {
  Diagnostic,
  EdgeAnim,
  GraphEdge,
  GraphGroup,
  GraphNode,
  NodeLink,
  ParsedDoc,
  Point,
  SourceLine,
  StyleMap,
} from '../core/types';
import { sealedGroups } from './groups';
import { checkUnclosedGroups, parseBlockLine, type BlockContext } from './parse-blocks';
import { parseHeader } from './parse-header';
import { parseStatement, splitStatements, type StatementContext } from './parse-statement';
import {
  applyComputedStyles,
  type QueuedClass,
  type QueuedLinkStyle,
  type QueuedStyle,
} from './styles';
import { scanStatement } from './tokens';

export function emptyDoc(lines: SourceLine[], diagnostics: Diagnostic[]): ParsedDoc {
  return {
    direction: 'TB',
    nodes: [],
    edges: [],
    groups: [],
    classDefs: {},
    pins: {},
    title: null,
    accTitle: null,
    accDescr: null,
    links: {},
    explicitEdgeAnimation: false,
    lines,
    diagnostics,
    ok: false,
  };
}

export function parseMermaid(text: string): ParsedDoc {
  if (text.length > LIMITS.maxTextChars) {
    const rawLines = text.split(/\r\n|\r|\n/);
    const lines: SourceLine[] = rawLines.map((t, idx) => ({
      index: idx,
      text: t,
      kind: 'unknown',
      nodeIds: [],
      edgeIndexes: [],
    }));
    return emptyDoc(lines, [{ line: 1, severity: 'error', message: MESSAGES.textTooLong }]);
  }

  const rawLines = text.split(/\r\n|\r|\n/);
  const lines: SourceLine[] = rawLines.map((lineText, index) => ({
    index,
    text: lineText,
    kind: 'blank',
    nodeIds: [],
    edgeIndexes: [],
  }));

  const diagnostics: Diagnostic[] = [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  const classDefs: Record<string, StyleMap> = {};
  const pins: Record<string, Point> = {};
  const groupStack: string[] = [];

  const queuedClasses: QueuedClass[] = [];
  const queuedStyles: QueuedStyle[] = [];
  const queuedLinkStyles: QueuedLinkStyle[] = [];

  const headerRes = parseHeader(rawLines, lines, diagnostics);
  if (!headerRes.ok) {
    return emptyDoc(lines, diagnostics);
  }

  // First pass: collect edgeRefs, subgraphIds, and explicitNodeIds
  const edgeRefs = new Set<string>();
  const subgraphIds = new Set<string>();
  const explicitNodeIds = new Set<string>();

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    const edgeRefRegex = /([\p{L}\p{N}_]+)@(?=[-=<~ox])/gu;
    let m: RegExpExecArray | null;
    while ((m = edgeRefRegex.exec(trimmed)) !== null) {
      edgeRefs.add(m[1]);
    }
    const subMatch = /^subgraph\s+([A-Za-z0-9_]+)/.exec(trimmed);
    if (subMatch) {
      subgraphIds.add(subMatch[1]);
    }
    const parts = splitStatements(trimmed);
    for (const p of parts) {
      const tokens = scanStatement(p);
      if (tokens) {
        for (const tok of tokens) {
          if (tok.type === 'node' && (tok.ref.shape !== null || tok.ref.label !== null)) {
            explicitNodeIds.add(tok.ref.id);
          }
        }
      }
    }
  }

  const edgePropsMap = new Map<string, EdgeAnim>();
  const explicitEdgeAnimationHolder = { value: false };
  const links: Record<string, NodeLink> = {};
  const accTitleHolder = { title: null as string | null };
  const accDescrHolder = { descr: null as string | null };
  const inAccDescr = { active: false, lines: [] as string[] };

  const blockCtx: BlockContext = {
    lines,
    diagnostics,
    groups,
    groupStack,
    classDefs,
    pins,
    queuedClasses,
    queuedStyles,
    queuedLinkStyles,
    hasReportedMaxGroupDepth: false,
    links,
    edgeRefs,
    edgePropsMap,
    accTitleHolder,
    accDescrHolder,
    inAccDescr,
    explicitEdgeAnimationHolder,
  };

  const stmtCtx: StatementContext = {
    lines,
    diagnostics,
    nodes,
    edges,
    currentGroupId: null as string | null,
    hasReportedMaxNodes: false,
    hasReportedMaxEdges: false,
    subgraphIds,
    explicitNodeIds,
    edgePropsMap,
  };

  for (let i = headerRes.headerIdx + 1; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (parseBlockLine(raw, i, blockCtx)) {
      continue;
    }
    stmtCtx.currentGroupId = groupStack.length > 0 ? groupStack[groupStack.length - 1] : null;
    parseStatement(raw, i, stmtCtx);
  }

  for (const edge of edges) {
    if (edge.ref && edgePropsMap.has(edge.ref)) {
      edge.anim = edgePropsMap.get(edge.ref)!;
    }
  }

  checkUnclosedGroups(groups, groupStack, diagnostics);
  applyComputedStyles(nodes, edges, classDefs, queuedClasses, queuedStyles, queuedLinkStyles);

  const sealed = sealedGroups({
    direction: headerRes.direction,
    nodes,
    edges,
    groups,
    classDefs,
    pins,
    title: headerRes.title,
    accTitle: accTitleHolder.title,
    accDescr: accDescrHolder.descr,
    links,
    explicitEdgeAnimation: explicitEdgeAnimationHolder.value,
    lines,
    diagnostics,
    ok: true,
  });

  for (const group of groups) {
    if (group.direction !== null && !sealed.has(group.id)) {
      diagnostics.push({
        line: (group.directionLine ?? group.line) + 1,
        severity: 'info',
        message: MESSAGES.groupDirectionIgnored(group.id),
      });
    }
  }

  const ok = !diagnostics.some(d => d.severity === 'error');

  return {
    direction: headerRes.direction,
    nodes,
    edges,
    groups,
    classDefs,
    pins,
    title: headerRes.title,
    accTitle: accTitleHolder.title,
    accDescr: accDescrHolder.descr,
    links,
    explicitEdgeAnimation: explicitEdgeAnimationHolder.value,
    lines,
    diagnostics,
    ok,
  };
}
