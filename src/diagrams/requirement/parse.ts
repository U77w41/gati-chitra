import { MESSAGES } from '../../core/constants';
import type {
  Direction, GraphEdge, GraphNode, ParsedDoc, StyleMap,
} from '../../core/types';
import { parseStyleString } from '../../mermaid/styles';
import {
  checkLimits, commonLine, finishDoc, makeNode,
  newCommonState, readPrelude,
} from '../common/prelude';
import {
  CLASS_APPLY_RE, CLASS_DEF_RE, CLASS_RE, CLOSE_BRACE_RE, DIR_RE,
  EL_BLOCK_OPEN_RE, FIELD_RE, HEADER_RE, REL_BACKWARD_RE, REL_FORWARD_RE,
  REQ_BLOCK_OPEN_RE, STYLE_RE,
} from './patterns';
import {
  type ReqNodeData, REQUIREMENT_TYPES, buildReqEdge, buildSections, unquote,
} from './helpers';

export function parseRequirement(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  let direction: Direction = 'TB';
  const nodeMap = new Map<string, ReqNodeData>();
  const nodeOrder: string[] = [];
  const edges: GraphEdge[] = [];
  const classDefs: Record<string, StyleMap> = {};

  let activeBlock: {
    id: string;
    name: string;
    openLine: number;
    lines: number[];
  } | null = null;

  function ensureNode(
    id: string,
    kind: 'requirement' | 'element',
    typeName: string,
    name: string,
    line: number,
  ): ReqNodeData {
    let data = nodeMap.get(id);
    if (!data) {
      data = {
        id,
        kind,
        typeName,
        name,
        line,
        refLines: [],
        fields: {},
        classNames: [],
        style: {},
      };
      nodeMap.set(id, data);
      nodeOrder.push(id);
    } else {
      data.kind = kind;
      data.typeName = typeName;
      data.name = name;
    }
    return data;
  }

  function ensureUndeclared(id: string, line: number): ReqNodeData {
    let data = nodeMap.get(id);
    if (!data) {
      data = {
        id,
        kind: 'element',
        typeName: 'Element',
        name: id,
        line,
        refLines: [],
        fields: {},
        classNames: [],
        style: {},
      };
      nodeMap.set(id, data);
      nodeOrder.push(id);
    }
    return data;
  }

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    if (activeBlock) {
      if (CLOSE_BRACE_RE.test(t)) {
        p.lines[i].kind = 'end';
        activeBlock.lines.push(i);
        const data = nodeMap.get(activeBlock.id);
        if (data) data.refLines = activeBlock.lines;
        activeBlock = null;
        continue;
      }
      const fieldMatch = FIELD_RE.exec(t);
      if (fieldMatch) {
        p.lines[i].kind = 'statement';
        activeBlock.lines.push(i);
        const key = fieldMatch[1].toLowerCase();
        const val = unquote(fieldMatch[2]);
        const data = nodeMap.get(activeBlock.id);
        if (data) data.fields[key] = val;
        continue;
      }
      p.lines[i].kind = 'unknown';
      p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
      continue;
    }

    const reqMatch = REQ_BLOCK_OPEN_RE.exec(t);
    if (reqMatch) {
      p.lines[i].kind = 'statement';
      const typeName = REQUIREMENT_TYPES[reqMatch[1]] ?? 'Requirement';
      const name = unquote(reqMatch[3]);
      activeBlock = { id: name, name, openLine: i, lines: [i] };
      ensureNode(name, 'requirement', typeName, name, i);
      continue;
    }

    const elMatch = EL_BLOCK_OPEN_RE.exec(t);
    if (elMatch) {
      p.lines[i].kind = 'statement';
      const name = unquote(elMatch[2]);
      activeBlock = { id: name, name, openLine: i, lines: [i] };
      ensureNode(name, 'element', 'Element', name, i);
      continue;
    }

    const dirMatch = DIR_RE.exec(t);
    if (dirMatch) {
      p.lines[i].kind = 'direction';
      direction = dirMatch[1] as Direction;
      continue;
    }

    const relFwd = REL_FORWARD_RE.exec(t);
    if (relFwd) {
      p.lines[i].kind = 'statement';
      const from = relFwd[1];
      const relType = relFwd[2];
      const to = relFwd[3];
      ensureUndeclared(from, i);
      ensureUndeclared(to, i);
      edges.push(buildReqEdge(edges.length, i, raw, from, to, relType, relFwd));
      continue;
    }

    const relBwd = REL_BACKWARD_RE.exec(t);
    if (relBwd) {
      p.lines[i].kind = 'statement';
      const to = relBwd[1];
      const relType = relBwd[2];
      const from = relBwd[3];
      ensureUndeclared(from, i);
      ensureUndeclared(to, i);
      edges.push(buildReqEdge(edges.length, i, raw, from, to, relType, relBwd));
      continue;
    }

    const styleMatch = STYLE_RE.exec(t);
    if (styleMatch) {
      p.lines[i].kind = 'style';
      const data = nodeMap.get(styleMatch[1]);
      if (data) data.style = { ...data.style, ...parseStyleString(styleMatch[2]) };
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
      const ids = classMatch[1].split(',').map((s) => s.trim());
      const cls = classMatch[2];
      for (const id of ids) {
        const data = nodeMap.get(id);
        if (data && !data.classNames.includes(cls)) data.classNames.push(cls);
      }
      continue;
    }

    const applyMatch = CLASS_APPLY_RE.exec(t);
    if (applyMatch) {
      p.lines[i].kind = 'class';
      const ids = applyMatch[1].split(',').map((s) => s.trim().split(':::')[0]);
      const cls = applyMatch[2];
      for (const id of ids) {
        const data = nodeMap.get(id);
        if (data && !data.classNames.includes(cls)) data.classNames.push(cls);
      }
      continue;
    }

    p.lines[i].kind = 'unknown';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  if (activeBlock) {
    p.diagnostics.push({
      line: activeBlock.openLine + 1,
      severity: 'error',
      message: MESSAGES.unclosedBrace(activeBlock.name),
    });
  }

  const nodes: GraphNode[] = [];
  for (const id of nodeOrder) {
    const data = nodeMap.get(id)!;
    const sections = buildSections(data.kind, data.typeName, data.name, data.fields);
    nodes.push(makeNode(data.id, data.name, 'rect', data.line, {
      sections,
      refLines: data.refLines.length > 0 ? data.refLines : undefined,
      classNames: data.classNames,
      style: data.style,
    }));
  }

  checkLimits(nodes, edges, p.diagnostics, p.lines.length);
  return finishDoc('requirement', p, st, {
    direction, nodes, edges, groups: [], classDefs, title: null,
  });
}
