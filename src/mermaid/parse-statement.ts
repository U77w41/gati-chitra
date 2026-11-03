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

export function splitStatements(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let inPipe = false;
  let square = 0;
  let round = 0;
  let curly = 0;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (inQuotes) {
      current += ch;
    } else if (ch === '|') {
      inPipe = !inPipe;
      current += ch;
    } else if (inPipe) {
      current += ch;
    } else if (ch === '[') {
      square++;
      current += ch;
    } else if (ch === ']') {
      if (square > 0) square--;
      current += ch;
    } else if (ch === '(') {
      round++;
      current += ch;
    } else if (ch === ')') {
      if (round > 0) round--;
      current += ch;
    } else if (ch === '{') {
      curly++;
      current += ch;
    } else if (ch === '}') {
      if (curly > 0) curly--;
      current += ch;
    } else if (ch === ';' && square === 0 && round === 0 && curly === 0) {
      if (current.trim() !== '') {
        parts.push(current);
      }
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim() !== '') {
    parts.push(current);
  }

  return parts;
}

export function parseStatement(raw: string, lineIndex: number, ctx: StatementContext): void {
  const parts = splitStatements(raw);
  if (parts.length === 0) {
    ctx.lines[lineIndex].kind = 'unknown';
    ctx.diagnostics.push({ line: lineIndex + 1, severity: 'warning', message: MESSAGES.unknownLine });
    return;
  }

  const allTokens = parts.map(p => scanStatement(p));
  if (allTokens.some(t => t === null)) {
    ctx.lines[lineIndex].kind = 'unknown';
    ctx.diagnostics.push({ line: lineIndex + 1, severity: 'warning', message: MESSAGES.unknownLine });
    return;
  }

  ctx.lines[lineIndex].kind = 'statement';
  const seenOnLine = new Set<string>();

  for (const tokens of allTokens) {
    if (!tokens) continue;
    const nodeGroups: NodeRef[][] = [[]];
    const ops: { kind: EdgeKind; label: string; length: number; markdown: boolean }[] = [];

    for (const tok of tokens) {
      if (tok.type === 'node') {
        nodeGroups[nodeGroups.length - 1].push(tok.ref);
      } else if (tok.type === 'edge') {
        ops.push({ kind: tok.kind, label: tok.label, length: tok.length, markdown: tok.markdown });
        nodeGroups.push([]);
      }
    }

    const currentGroupId = ctx.currentGroupId;

    for (const group of nodeGroups) {
      for (const ref of group) {
        if (ref.notes) {
          for (const note of ref.notes) {
            ctx.diagnostics.push({ line: lineIndex + 1, severity: note.severity, message: note.message });
          }
        }

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
              markdown: ref.markdown ?? false,
            });
          }
        } else {
          if (ref.shape !== null) existing.shape = ref.shape;
          if (ref.label !== null) {
            existing.label = ref.label;
            existing.markdown = ref.markdown ?? false;
          }
          if (ref.markdown) existing.markdown = true;
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
                length: ops[opIdx].length,
                style: {},
                line: lineIndex,
                markdown: ops[opIdx].markdown,
              });
              ctx.lines[lineIndex].edgeIndexes.push(edgeIndex);
            }
          }
        }
      }
    }
  }
}
