import { LIMITS, MESSAGES } from '../core/constants';
import type {
  Diagnostic,
  Direction,
  GraphEdge,
  GraphGroup,
  GraphNode,
  ParsedDoc,
  Point,
  SourceLine,
  StyleMap,
} from '../core/types';
import { type NodeRef, readNodeRef } from './tokens';

function parseSingleNodeGroup(trimmed: string): NodeRef[] | null {
  let text = trimmed;
  if (text.endsWith(';')) {
    text = text.slice(0, -1).trim();
  }
  if (!text) return null;
  let pos = 0;
  const refs: NodeRef[] = [];
  let expectRef = true;

  while (pos < text.length) {
    while (pos < text.length && /\s/.test(text[pos])) pos++;
    if (pos >= text.length) break;

    if (!expectRef) {
      if (text[pos] === '&') {
        pos++;
        expectRef = true;
        continue;
      }
      return null;
    }

    const res = readNodeRef(text, pos);
    if (!res) return null;
    refs.push(res.ref);
    pos = res.end;
    expectRef = false;
  }

  if (expectRef || refs.length === 0) return null;
  return refs;
}

export function parseMermaid(text: string): ParsedDoc {
  if (text.length > LIMITS.maxTextChars) {
    const rawLines = text.split(/\r\n|\r|\n/);
    return {
      direction: 'TB',
      nodes: [],
      edges: [],
      groups: [],
      classDefs: {},
      pins: {},
      lines: rawLines.map((t, idx) => ({
        index: idx,
        text: t,
        kind: 'unknown',
        nodeIds: [],
        edgeIndexes: [],
      })),
      diagnostics: [{ line: 1, severity: 'error', message: MESSAGES.textTooLong }],
      ok: false,
    };
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
  let hasReportedMaxNodes = false;

  let first = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].trim() !== '') {
      first = i;
      break;
    }
  }

  let step4Start = first === -1 ? 0 : first;
  if (first !== -1 && rawLines[first].trim() === '---') {
    let closeFm = -1;
    for (let i = first + 1; i < rawLines.length; i++) {
      if (rawLines[i].trim() === '---') {
        closeFm = i;
        break;
      }
    }
    if (closeFm !== -1) {
      for (let i = first; i <= closeFm; i++) {
        lines[i].kind = 'frontmatter';
      }
      step4Start = closeFm + 1;
    }
  }

  let headerIdx = -1;
  let direction: Direction = 'TB';
  const headerRegex = /^\s*(flowchart|graph)(?:\s+(TB|TD|BT|RL|LR))?\s*;?\s*$/;

  for (let i = step4Start; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (trimmed === '') {
      continue;
    }
    if (trimmed.startsWith('%%{')) {
      lines[i].kind = 'directive';
      continue;
    }
    if (trimmed.startsWith('%%')) {
      lines[i].kind = 'comment';
      continue;
    }

    const match = headerRegex.exec(trimmed);
    if (match) {
      lines[i].kind = 'header';
      const dirMatch = match[2];
      direction = dirMatch === 'TD' || !dirMatch ? 'TB' : (dirMatch as Direction);
      headerIdx = i;
      break;
    } else {
      diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.notFlowchart });
      for (let j = i; j < rawLines.length; j++) {
        lines[j].kind = 'unknown';
      }
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
  }

  if (headerIdx === -1) {
    diagnostics.push({ line: 1, severity: 'error', message: MESSAGES.notFlowchart });
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

  const posRegex = /^\s*%%\s*studio:pos\s+(\S+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;
  const dirRegex = /^direction\s+(TB|TD|BT|RL|LR)\s*;?$/;

  for (let i = headerIdx + 1; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    if (trimmed === '') {
      lines[i].kind = 'blank';
      continue;
    }

    if (trimmed.startsWith('%%')) {
      const posMatch = posRegex.exec(raw);
      if (posMatch) {
        lines[i].kind = 'pos';
        pins[posMatch[1]] = {
          x: parseFloat(posMatch[2]),
          y: parseFloat(posMatch[3]),
        };
      } else if (trimmed.startsWith('%%{')) {
        lines[i].kind = 'directive';
      } else {
        lines[i].kind = 'comment';
      }
      continue;
    }

    if (dirRegex.test(trimmed)) {
      lines[i].kind = 'direction';
      continue;
    }

    const nodeRefs = parseSingleNodeGroup(trimmed);
    if (nodeRefs) {
      lines[i].kind = 'statement';
      const seenOnLine = new Set<string>();

      for (const ref of nodeRefs) {
        if (!seenOnLine.has(ref.id)) {
          seenOnLine.add(ref.id);
          lines[i].nodeIds.push(ref.id);
        }

        const existing = nodes.find(n => n.id === ref.id);
        if (!existing) {
          if (nodes.length >= LIMITS.maxNodes) {
            if (!hasReportedMaxNodes) {
              diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.tooManyNodes });
              hasReportedMaxNodes = true;
            }
          } else {
            nodes.push({
              id: ref.id,
              label: ref.label ?? ref.id,
              shape: ref.shape ?? 'rect',
              classNames: ref.className ? [ref.className] : [],
              style: {},
              group: null,
              line: i,
            });
          }
        } else {
          if (ref.shape !== null) existing.shape = ref.shape;
          if (ref.label !== null) existing.label = ref.label;
          if (ref.className && !existing.classNames.includes(ref.className)) {
            existing.classNames.push(ref.className);
          }
        }
      }
    } else {
      lines[i].kind = 'unknown';
      diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine(i + 1) });
    }
  }

  const ok = !diagnostics.some(d => d.severity === 'error');

  return {
    direction,
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
