import { LIMITS, MESSAGES } from '../core/constants';
import type {
  Diagnostic,
  Direction,
  EdgeKind,
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
  parseStyleString,
  type QueuedClass,
  type QueuedLinkStyle,
  type QueuedStyle,
} from './styles';
import { type NodeRef, scanStatement } from './tokens';

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
  const groupStack: string[] = [];

  const queuedClasses: QueuedClass[] = [];
  const queuedStyles: QueuedStyle[] = [];
  const queuedLinkStyles: QueuedLinkStyle[] = [];

  let hasReportedMaxNodes = false;
  let hasReportedMaxEdges = false;
  let hasReportedMaxGroupDepth = false;

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
    if (trimmed === '') continue;
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
      for (let j = i; j < rawLines.length; j++) lines[j].kind = 'unknown';
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
  const endRegex = /^end\s*;?$/;

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

    if (trimmed.startsWith('subgraph')) {
      let gId = '';
      let gTitle = '';
      const m1 = /^subgraph\s+([A-Za-z0-9_]+)\s*\[(.*)\]\s*;?$/.exec(trimmed);
      if (m1) {
        gId = m1[1];
        gTitle = m1[2].trim();
        if (gTitle.startsWith('"') && gTitle.endsWith('"') && gTitle.length >= 2) {
          gTitle = gTitle.slice(1, -1);
        }
      } else {
        const m2 = /^subgraph\s+"(.*)"\s*;?$/.exec(trimmed);
        if (m2) {
          gId = `group${groups.length + 1}`;
          gTitle = m2[1];
        } else {
          const m3 = /^subgraph\s+(.+?)\s*;?$/.exec(trimmed);
          if (m3) {
            gTitle = m3[1].trim();
            gId = gTitle.replace(/[^A-Za-z0-9_]/g, '_');
          }
        }
      }

      if (gId) {
        lines[i].kind = 'subgraph';
        const parent = groupStack.length > 0 ? groupStack[groupStack.length - 1] : null;
        groups.push({ id: gId, title: gTitle, parent, direction: null, line: i });
        groupStack.push(gId);
        if (groupStack.length > LIMITS.maxGroupDepth && !hasReportedMaxGroupDepth) {
          diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.groupTooDeep });
          hasReportedMaxGroupDepth = true;
        }
        continue;
      }
    }

    if (endRegex.test(trimmed)) {
      lines[i].kind = 'end';
      if (groupStack.length === 0) {
        diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.strayEnd(i + 1) });
      } else {
        groupStack.pop();
      }
      continue;
    }

    if (dirRegex.test(trimmed)) {
      lines[i].kind = 'direction';
      if (groupStack.length > 0) {
        const currId = groupStack[groupStack.length - 1];
        const grp = groups.find(g => g.id === currId);
        if (grp) {
          const dMatch = dirRegex.exec(trimmed)![1];
          grp.direction = dMatch === 'TD' ? 'TB' : (dMatch as Direction);
        }
      }
      continue;
    }

    if (trimmed.startsWith('classDef ')) {
      lines[i].kind = 'classDef';
      const rest = trimmed.slice(9).trim();
      const spaceIdx = rest.search(/\s/);
      const firstToken = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
      let styleStr = spaceIdx === -1 ? '' : rest.slice(spaceIdx + 1).trim();
      if (styleStr.endsWith(';')) styleStr = styleStr.slice(0, -1).trim();
      const styleMap = parseStyleString(styleStr);
      for (const name of firstToken.split(',').map(s => s.trim()).filter(Boolean)) {
        classDefs[name] = { ...styleMap };
      }
      continue;
    }

    if (trimmed.startsWith('class ')) {
      lines[i].kind = 'class';
      const rest = trimmed.slice(6).trim();
      const parts = rest.split(/\s+/);
      if (parts.length >= 2) {
        const ids = parts[0].split(',').map(s => s.trim()).filter(Boolean);
        const className = parts[1].trim();
        queuedClasses.push({ ids, className });
      }
      continue;
    }

    if (trimmed.startsWith('style ')) {
      lines[i].kind = 'style';
      const rest = trimmed.slice(6).trim();
      const spaceIdx = rest.search(/\s/);
      if (spaceIdx !== -1) {
        const id = rest.slice(0, spaceIdx).trim();
        let styleStr = rest.slice(spaceIdx + 1).trim();
        if (styleStr.endsWith(';')) styleStr = styleStr.slice(0, -1).trim();
        const style = parseStyleString(styleStr);
        queuedStyles.push({ id, style });
      }
      continue;
    }

    if (trimmed.startsWith('linkStyle ')) {
      lines[i].kind = 'linkStyle';
      const rest = trimmed.slice(10).trim();
      const spaceIdx = rest.search(/\s/);
      if (spaceIdx !== -1) {
        const target = rest.slice(0, spaceIdx).trim();
        let styleStr = rest.slice(spaceIdx + 1).trim();
        if (styleStr.endsWith(';')) styleStr = styleStr.slice(0, -1).trim();
        const style = parseStyleString(styleStr);
        if (target === 'default') {
          queuedLinkStyles.push({ target: 'default', style });
        } else {
          const indexes = target.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
          queuedLinkStyles.push({ target: indexes, style });
        }
      }
      continue;
    }

    const tokens = scanStatement(raw);
    if (tokens) {
      lines[i].kind = 'statement';
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

      const currentGroupId = groupStack.length > 0 ? groupStack[groupStack.length - 1] : null;
      const seenOnLine = new Set<string>();

      for (const group of nodeGroups) {
        for (const ref of group) {
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
                group: currentGroupId,
                line: i,
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
            const aExists = nodes.some(n => n.id === a.id);
            const bExists = nodes.some(n => n.id === b.id);
            if (aExists && bExists) {
              if (edges.length >= LIMITS.maxEdges) {
                if (!hasReportedMaxEdges) {
                  diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.tooManyEdges });
                  hasReportedMaxEdges = true;
                }
              } else {
                const edgeIndex = edges.length;
                edges.push({
                  id: 'e' + edgeIndex,
                  index: edgeIndex,
                  from: a.id,
                  to: b.id,
                  kind: ops[opIdx].kind,
                  label: ops[opIdx].label,
                  style: {},
                  line: i,
                });
                lines[i].edgeIndexes.push(edgeIndex);
              }
            }
          }
        }
      }
    } else {
      lines[i].kind = 'unknown';
      diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine(i + 1) });
    }
  }

  for (const openGroupId of groupStack) {
    const grp = groups.find(g => g.id === openGroupId);
    if (grp) {
      diagnostics.push({
        line: grp.line + 1,
        severity: 'warning',
        message: MESSAGES.unclosedGroup(grp.id),
      });
    }
  }

  applyComputedStyles(nodes, edges, classDefs, queuedClasses, queuedStyles, queuedLinkStyles);

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
