import { LIMITS, MESSAGES } from '../core/constants';
import type {
  Diagnostic,
  GraphEdge,
  GraphGroup,
  GraphNode,
  ParsedDoc,
  Point,
  SourceLine,
  StyleMap,
} from '../core/types';
import {
  applyComputedStyles,
  type QueuedClass,
  type QueuedLinkStyle,
  type QueuedStyle,
} from './styles';
import { parseHeader } from './parse-header';
import { checkUnclosedGroups, parseBlockLine } from './parse-blocks';
import { parseStatement } from './parse-statement';

export function emptyDoc(lines: SourceLine[], diagnostics: Diagnostic[]): ParsedDoc {
  return {
    direction: 'TB',
    nodes: [],
    edges: [],
    groups: [],
    classDefs: {},
    pins: {},
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

  const blockCtx = {
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
  };

  const stmtCtx = {
    lines,
    diagnostics,
    nodes,
    edges,
    currentGroupId: null as string | null,
    hasReportedMaxNodes: false,
    hasReportedMaxEdges: false,
  };

  for (let i = headerRes.headerIdx + 1; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (parseBlockLine(raw, i, blockCtx)) {
      continue;
    }
    stmtCtx.currentGroupId = groupStack.length > 0 ? groupStack[groupStack.length - 1] : null;
    parseStatement(raw, i, stmtCtx);
  }

  checkUnclosedGroups(groups, groupStack, diagnostics);
  applyComputedStyles(nodes, edges, classDefs, queuedClasses, queuedStyles, queuedLinkStyles);

  const ok = !diagnostics.some(d => d.severity === 'error');

  return {
    direction: headerRes.direction,
    nodes,
    edges,
    groups,
    classDefs,
    pins,
    lines,
    diagnostics,
    ok,
  };
}
