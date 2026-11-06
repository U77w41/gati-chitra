import { MESSAGES } from '../../core/constants';
import type { Diagnostic, GraphGroup, GraphNode, SourceLine } from '../../core/types';

export function makeGroup(
  id: string, title: string, parent: string | null, line: number, extra?: Partial<GraphGroup>,
): GraphGroup {
  return {
    id, title, parent, direction: null, markdown: false, line, endLine: -1, ...extra,
  };
}

export interface ScopeFrame {
  id: string;
  line: number;
  regions: GraphGroup[];
}

export class ScopeTracker {
  private stack: ScopeFrame[] = [];

  currentScope(): string | null {
    if (this.stack.length === 0) return null;
    const top = this.stack[this.stack.length - 1];
    if (top.regions.length > 0) return top.regions[top.regions.length - 1].id;
    return top.id;
  }

  compositeScope(): string {
    return this.stack.length === 0 ? 'root' : this.stack[this.stack.length - 1].id;
  }

  openScope(id: string, line: number): void {
    this.stack.push({ id, line, regions: [] });
  }

  closeScope(lineIdx: number, groups: GraphGroup[], diagnostics: Diagnostic[]): void {
    if (this.stack.length === 0) {
      diagnostics.push({ line: lineIdx + 1, severity: 'error', message: MESSAGES.strayBlockEnd });
      return;
    }
    const frame = this.stack.pop()!;
    const group = groups.find((g) => g.id === frame.id);
    if (group) group.endLine = lineIdx;
    for (const r of frame.regions) r.endLine = lineIdx;
  }

  handleDivider(
    lineIdx: number, lines: SourceLine[],
    groups: GraphGroup[], nodes: GraphNode[], diagnostics: Diagnostic[],
  ): void {
    if (this.stack.length === 0) {
      lines[lineIdx].kind = 'unknown';
      diagnostics.push({ line: lineIdx + 1, severity: 'warning', message: MESSAGES.unknownLine });
      return;
    }
    lines[lineIdx].kind = 'statement';
    const top = this.stack[this.stack.length - 1];
    if (top.regions.length === 0) {
      const r1 = makeGroup(`${top.id}__r1`, '', top.id, lineIdx);
      const r2 = makeGroup(`${top.id}__r2`, '', top.id, lineIdx);
      groups.push(r1, r2);
      for (const n of nodes) if (n.group === top.id) n.group = r1.id;
      for (const g of groups) if (g.parent === top.id && g.id !== r1.id && g.id !== r2.id) g.parent = r1.id;
      top.regions = [r1, r2];
    } else {
      const rN = makeGroup(`${top.id}__r${top.regions.length + 1}`, '', top.id, lineIdx);
      groups.push(rN);
      top.regions.push(rN);
    }
  }

  checkUnclosed(diagnostics: Diagnostic[]): void {
    for (const unclosed of this.stack) {
      diagnostics.push({ line: unclosed.line + 1, severity: 'error', message: MESSAGES.unclosedBrace(unclosed.id) });
    }
  }
}
