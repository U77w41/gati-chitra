import { LIMITS, MESSAGES } from '../core/constants';
import type {
  Diagnostic,
  EdgeKind,
  GraphEdge,
  GraphNode,
  SourceLine,
} from '../core/types';
import { type NodeRef, scanStatement } from './tokens';

export interface StatementContext {
  lines: SourceLine[];
  diagnostics: Diagnostic[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentGroupId: string | null;
  hasReportedMaxNodes: boolean;
  hasReportedMaxEdges: boolean;
}

export function parseStatement(raw: string, lineIndex: number, ctx: StatementContext): void {
  const tokens = scanStatement(raw);
  if (tokens) {
    ctx.lines[lineIndex].kind = 'statement';
    const nodeGroups: NodeRef[][] = [[]];
    const ops: { kind: EdgeKind; label: string }[] = [];

    for (const tok of tokens) {
      if (tok.type === 'node') {
        nodeGroups[nodeGroups.length - 1].push(tok.ref);
      } else if (tok.type === 'edge') {
        ops.push({ kind: tok.kind, label: tok.label });
        nodeGroups.push([]);
      }
    }

    const currentGroupId = ctx.currentGroupId;
    const seenOnLine = new Set<string>();

    for (const group of nodeGroups) {
      for (const ref of group) {
        if (!seenOnLine.has(ref.id)) {
          seenOnLine.add(ref.id);
          ctx.lines[lineIndex].nodeIds.push(ref.id);
        }

        const existing = ctx.nodes.find(n => n.id === ref.id);
        if (!existing) {
          if (ctx.nodes.length >= LIMITS.maxNodes) {
            if (!ctx.hasReportedMaxNodes) {
              ctx.diagnostics.push({ line: lineIndex + 1, severity: 'error', message: MESSAGES.tooManyNodes });
              ctx.hasReportedMaxNodes = true;
            }
          } else {
            ctx.nodes.push({
              id: ref.id,
              label: ref.label ?? ref.id,
              shape: ref.shape ?? 'rect',
              classNames: ref.className ? [ref.className] : [],
              style: {},
              group: currentGroupId,
              line: lineIndex,
            });
          }
        } else {
          if (ref.shape !== null) existing.shape = ref.shape;
          if (ref.label !== null) existing.label = ref.label;
          if (ref.className && !existing.classNames.includes(ref.className)) {
            existing.classNames.push(ref.className);
          }
          if (existing.group === null && currentGroupId !== null) {
            existing.group = currentGroupId;
          }
        }
      }
    }

    for (let opIdx = 0; opIdx < ops.length; opIdx++) {
      const leftGroup = nodeGroups[opIdx];
      const rightGroup = nodeGroups[opIdx + 1];
      for (const a of leftGroup) {
        for (const b of rightGroup) {
          const aExists = ctx.nodes.some(n => n.id === a.id);
          const bExists = ctx.nodes.some(n => n.id === b.id);
          if (aExists && bExists) {
            if (ctx.edges.length >= LIMITS.maxEdges) {
              if (!ctx.hasReportedMaxEdges) {
                ctx.diagnostics.push({ line: lineIndex + 1, severity: 'error', message: MESSAGES.tooManyEdges });
                ctx.hasReportedMaxEdges = true;
              }
            } else {
              const edgeIndex = ctx.edges.length;
              ctx.edges.push({
                id: 'e' + edgeIndex,
                index: edgeIndex,
                from: a.id,
                to: b.id,
                kind: ops[opIdx].kind,
                label: ops[opIdx].label,
                style: {},
                line: lineIndex,
              });
              ctx.lines[lineIndex].edgeIndexes.push(edgeIndex);
            }
          }
        }
      }
    }
  } else {
    ctx.lines[lineIndex].kind = 'unknown';
    ctx.diagnostics.push({ line: lineIndex + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }
}
