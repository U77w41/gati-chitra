import { MESSAGES } from '../../core/constants';
import type { GraphEdge, GraphNode, ParsedDoc, Span } from '../../core/types';
import {
  commonLine,
  finishDoc,
  leadOf,
  makeEdge,
  makeNode,
  newCommonState,
  readPrelude,
} from '../common/prelude';

function computeIndent(raw: string): number {
  let width = 0;
  for (const ch of raw) {
    if (ch === ' ') width += 1;
    else if (ch === '\t') width += 4;
    else break;
  }
  return width;
}

const HEADER_RE = /^mindmap\s*$/;

const PAIRS: [string, string, GraphNode['shape']][] = [
  ['((', '))', 'circle'],
  ['))', '((', 'bang'],
  ['{{', '}}', 'hexagon'],
  ['(', ')', 'round'],
  [')', '(', 'cloud'],
  ['[', ']', 'rect'],
];

export function parseMindmap(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  let root: string | null = null;
  const parentMap: Record<string, string | null> = {};
  const childrenMap: Record<string, string[]> = {};
  const indentMap: Record<string, number> = {};
  const stack: { indent: number; id: string }[] = [];
  const branchMap = new Map<string, number>();

  let anonCount = 0;
  let branchCounter = 0;
  let lastNode: GraphNode | null = null;

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;

    const trimmed = raw.trim();
    if (trimmed.startsWith('::icon(')) {
      p.diagnostics.push({
        line: i + 1,
        severity: 'info',
        message: MESSAGES.syntaxIgnored('Mindmap icons'),
      });
      if (lastNode) {
        lastNode.refLines = [...(lastNode.refLines ?? []), i];
      }
      p.lines[i].kind = 'directive';
      continue;
    }

    let nodeText = trimmed;
    const classNames: string[] = [];
    const classMatch = /\s*:::([A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\s*$/.exec(nodeText);
    if (classMatch) {
      classNames.push(...classMatch[1].split(/\s+/));
      nodeText = nodeText.slice(0, classMatch.index);
    }

    let id = '';
    let rawLabel = nodeText;
    let shape: GraphNode['shape'] = 'round';

    const idMatch = /^([\w-]*)/.exec(nodeText);
    const candidateId = idMatch ? idMatch[1] : '';
    const rest = nodeText.slice(candidateId.length);
    let matchedPair = false;

    for (const [open, close, pairShape] of PAIRS) {
      if (rest.startsWith(open) && rest.endsWith(close) && rest.length >= open.length + close.length) {
        id = candidateId;
        rawLabel = rest.slice(open.length, rest.length - close.length);
        shape = pairShape;
        matchedPair = true;
        break;
      }
    }

    if (!matchedPair) {
      id = '';
      rawLabel = nodeText;
      shape = 'round';
    }

    let label = rawLabel.trim();
    if ((label.startsWith('"') && label.endsWith('"')) || (label.startsWith('`') && label.endsWith('`'))) {
      label = label.slice(1, -1).trim();
    }
    if (label.startsWith('`') && label.endsWith('`')) {
      label = label.slice(1, -1).trim();
    }
    if (label.startsWith('"') && label.endsWith('"')) {
      label = label.slice(1, -1).trim();
    }

    if (!id) {
      anonCount++;
      id = `m${anonCount}`;
    }

    const indent = computeIndent(raw);
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;
    if (parentId === null) {
      if (root !== null) {
        p.diagnostics.push({
          line: i + 1,
          severity: 'error',
          message: MESSAGES.mindmapTwoRoots,
        });
      } else {
        root = id;
      }
    }

    let colorIndex: number | undefined;
    if (id === root) {
      colorIndex = undefined;
    } else if (parentId === root) {
      colorIndex = branchCounter++;
      branchMap.set(id, colorIndex);
    } else if (parentId) {
      colorIndex = branchMap.get(parentId);
      if (colorIndex !== undefined) {
        branchMap.set(id, colorIndex);
      }
    }

    const labelIdx = raw.indexOf(rawLabel.trim());
    const labelSpan: Span | undefined = labelIdx >= 0
      ? { line: i, from: labelIdx, to: labelIdx + rawLabel.trim().length }
      : undefined;
    const defSpan: Span = { line: i, from: leadOf(raw), to: raw.length };

    const node = makeNode(id, label, shape, i, {
      colorIndex,
      labelSpan,
      defSpan,
      classNames,
      refLines: [i],
    });
    nodes.push(node);
    lastNode = node;

    parentMap[id] = parentId;
    childrenMap[id] = [];
    if (parentId && childrenMap[parentId]) {
      childrenMap[parentId].push(id);
    }
    indentMap[id] = indent;
    stack.push({ indent, id });

    if (parentId !== null) {
      edges.push(
        makeEdge(edges.length, parentId, id, 'open', '', i, {
          markers: { start: 'none', end: 'none' },
          colorIndex,
        }),
      );
    }

    p.lines[i].kind = 'statement';
    p.lines[i].nodeIds.push(id);
  }

  return finishDoc('mindmap', p, st, {
    direction: 'LR',
    nodes,
    edges,
    groups: [],
    classDefs: {},
    title: p.title,
    data: {
      mindmap: {
        root: root ?? '',
        parent: parentMap,
        children: childrenMap,
        indent: indentMap,
      },
    },
  });
}
