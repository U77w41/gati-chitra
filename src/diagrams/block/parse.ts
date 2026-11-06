import { MESSAGES } from '../../core/constants';
import type { BlockItem } from '../../core/diagram-types';
import type {
  EdgeKind, GraphEdge, GraphGroup, GraphNode, ParsedDoc, Span, StyleMap,
} from '../../core/types';
import { parseStyleString } from '../../mermaid/styles';
import {
  checkLimits, commonLine, finishDoc, makeEdge, newCommonState, readPrelude,
} from '../common/prelude';
import { parseItemToken, scanLineTokens } from './helpers';
import {
  BLOCK_START_RE, CLASS_DEF_RE, CLASS_RE, COLUMNS_RE,
  EDGE_LINE_RE, END_RE, HEADER_RE, STYLE_RE,
} from './patterns';

interface BlockContainer {
  id: string | null;
  span: number;
  columns: number | null;
  items: BlockItem[];
  depth: number;
}

export function parseBlock(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  const classDefs: Record<string, StyleMap> = {};
  const nodeMap = new Map<string, GraphNode>();

  const topContainer: BlockContainer = { id: null, span: 1, columns: null, items: [], depth: 0 };
  const containerStack: BlockContainer[] = [topContainer];
  const currentContainer = () => containerStack[containerStack.length - 1];

  let blockCounter = 0;
  let edgeCounter = 0;

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    const colMatch = COLUMNS_RE.exec(t);
    if (colMatch) {
      p.lines[i].kind = 'statement';
      currentContainer().columns = colMatch[1] === 'auto' ? null : parseInt(colMatch[1], 10);
      continue;
    }

    const blockStartMatch = BLOCK_START_RE.exec(t);
    if (blockStartMatch) {
      p.lines[i].kind = 'subgraph';
      const blockId = blockStartMatch[1] ?? `block${++blockCounter}`;
      const span = blockStartMatch[2] ? parseInt(blockStartMatch[2], 10) : 1;
      const parentId = currentContainer().id;
      const depth = containerStack.length;
      groups.push({ id: blockId, title: '', parent: parentId, direction: null, markdown: false, line: i });
      containerStack.push({ id: blockId, span, columns: null, items: [], depth });
      continue;
    }

    const endMatch = END_RE.exec(t);
    if (endMatch) {
      p.lines[i].kind = 'end';
      if (containerStack.length <= 1) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.strayBlockEnd });
      } else {
        const closed = containerStack.pop()!;
        const grp = groups.find((g) => g.id === closed.id);
        if (grp) grp.endLine = i;
        currentContainer().items.push({
          type: 'block', id: closed.id!, span: closed.span, columns: closed.columns, children: closed.items,
        });
      }
      continue;
    }

    const styleMatch = STYLE_RE.exec(t);
    if (styleMatch) {
      p.lines[i].kind = 'style';
      const node = nodeMap.get(styleMatch[1]);
      if (node) node.style = { ...node.style, ...parseStyleString(styleMatch[2]) };
      continue;
    }

    const classDefMatch = CLASS_DEF_RE.exec(t);
    if (classDefMatch) {
      p.lines[i].kind = 'classDef';
      classDefs[classDefMatch[1]] = parseStyleString(classDefMatch[2]);
      continue;
    }

    const classMatch = CLASS_RE.exec(t);
    if (classMatch) {
      p.lines[i].kind = 'class';
      const targets = classMatch[1].split(',');
      const clsName = classMatch[2];
      for (const target of targets) {
        const node = nodeMap.get(target.trim());
        if (node && !node.classNames.includes(clsName)) node.classNames.push(clsName);
      }
      continue;
    }

    const edgeMatch = EDGE_LINE_RE.exec(t);
    if (edgeMatch) {
      p.lines[i].kind = 'statement';
      const fromToks = scanLineTokens(edgeMatch[1]);
      const toToks = scanLineTokens(edgeMatch[6]);
      let fromId = '';
      let toId = '';

      if (fromToks.length > 0) {
        const parsed = parseItemToken(fromToks[0], i, currentContainer().id);
        if (parsed?.item.type === 'node') {
          fromId = parsed.item.id;
          if (!nodeMap.has(fromId) && parsed.node) {
            nodes.push(parsed.node);
            nodeMap.set(fromId, parsed.node);
            currentContainer().items.push(parsed.item);
          }
        }
      }

      if (toToks.length > 0) {
        const parsed = parseItemToken(toToks[0], i, currentContainer().id);
        if (parsed?.item.type === 'node') {
          toId = parsed.item.id;
          if (!nodeMap.has(toId) && parsed.node) {
            nodes.push(parsed.node);
            nodeMap.set(toId, parsed.node);
            currentContainer().items.push(parsed.item);
          }
        }
      }

      if (fromId && toId) {
        if (!checkLimits(nodes, edges, p.diagnostics, i + 1)) continue;

        let kind: EdgeKind = 'arrow';
        let variant = '-->';
        let label = '';
        const opIndices = (edgeMatch as unknown as { indices?: [number, number][] }).indices;
        let opSpan: Span | undefined;

        if (edgeMatch[2]) {
          variant = '-->';
          kind = 'arrow';
          label = edgeMatch[3] ?? '';
          if (opIndices?.[2]) opSpan = { line: i, from: opIndices[2][0] + (raw.length - raw.trimStart().length), to: opIndices[2][1] + (raw.length - raw.trimStart().length) };
        } else if (edgeMatch[4]) {
          variant = '-->';
          kind = 'arrow';
          if (opIndices?.[4]) opSpan = { line: i, from: opIndices[4][0] + (raw.length - raw.trimStart().length), to: opIndices[4][1] + (raw.length - raw.trimStart().length) };
        } else if (edgeMatch[5]) {
          variant = '---';
          kind = 'open';
          if (opIndices?.[5]) opSpan = { line: i, from: opIndices[5][0] + (raw.length - raw.trimStart().length), to: opIndices[5][1] + (raw.length - raw.trimStart().length) };
        }

        const edge = makeEdge(edgeCounter++, fromId, toId, kind, label, i, { variant, opSpan });
        edges.push(edge);
      }
      continue;
    }

    const toks = scanLineTokens(raw);
    if (toks.length > 0) {
      p.lines[i].kind = 'statement';
      for (const tok of toks) {
        const parsed = parseItemToken(tok, i, currentContainer().id);
        if (!parsed) continue;
        if (parsed.item.type === 'node' && parsed.node) {
          if (!nodeMap.has(parsed.node.id)) {
            if (!checkLimits(nodes, edges, p.diagnostics, i + 1)) continue;
            nodes.push(parsed.node);
            nodeMap.set(parsed.node.id, parsed.node);
          }
          currentContainer().items.push(parsed.item);
        } else if (parsed.item.type === 'space') {
          currentContainer().items.push(parsed.item);
        }
      }
      continue;
    }

    p.lines[i].kind = 'statement';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  while (containerStack.length > 1) {
    const unclosed = containerStack.pop()!;
    const grp = groups.find((g) => g.id === unclosed.id);
    p.diagnostics.push({
      line: (grp?.line ?? 0) + 1,
      severity: 'error',
      message: MESSAGES.unclosedBlock('block'),
    });
  }

  return finishDoc('block', p, st, {
    direction: 'TB',
    nodes,
    edges,
    groups,
    classDefs,
    title: null,
    data: {
      block: {
        columns: topContainer.columns,
        items: topContainer.items,
      },
    },
  });
}
