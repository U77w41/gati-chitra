import { MESSAGES } from '../../core/constants';
import type {
  Direction, GraphEdge, GraphGroup, GraphNode, ParsedDoc, Span, StyleMap,
} from '../../core/types';
import { parseStyleString } from '../../mermaid/styles';
import {
  checkLimits, commonLine, finishDoc, makeNode,
  newCommonState, readPrelude, spanAt,
} from '../common/prelude';
import {
  ATTR_RE, CLASS_APPLY_RE, CLASS_DEF_RE, CLOSE_BRACE_RE, CSS_CLASS_RE,
  DIR_RE, END_RE, ENTITY_BLOCK_EMPTY_RE, ENTITY_BLOCK_OPEN_RE,
  ENTITY_DECL_RE, HEADER_RE, REL_SYMBOL_RE, REL_WORD_RE, STYLE_RE, SUBGRAPH_RE,
} from './patterns';
import {
  type EntityData, buildErSections, buildRelEdge, parseEntityId,
  parseSymbolRel, parseWordRel,
} from './helpers';

export function parseEr(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  let direction: Direction = 'TB';
  const entityMap = new Map<string, EntityData>();
  const entityOrder: string[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  const classDefs: Record<string, StyleMap> = {};

  let currentGroup: { id: string; line: number } | null = null;
  let activeEntityBlock: { id: string; line: number } | null = null;

  function ensureEntity(
    rawName: string,
    rawAlias: string | undefined,
    line: number,
    aliasSpan?: Span,
    isDeclaration = false,
  ): EntityData {
    const { id, label, cssClass } = parseEntityId(rawName, rawAlias);
    let data = entityMap.get(id);
    if (!data) {
      data = {
        id,
        label,
        labelSpan: aliasSpan,
        line,
        group: currentGroup ? currentGroup.id : null,
        attributeRows: [],
        refLines: isDeclaration ? [line] : [],
        classNames: cssClass ? [cssClass] : [],
        style: {},
      };
      entityMap.set(id, data);
      entityOrder.push(id);
    } else {
      if (aliasSpan && !data.labelSpan) {
        data.label = label;
        data.labelSpan = aliasSpan;
      }
      if (cssClass && !data.classNames.includes(cssClass)) {
        data.classNames.push(cssClass);
      }
      if (isDeclaration && !data.refLines.includes(line)) {
        data.refLines.push(line);
      }
    }
    return data;
  }

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    if (activeEntityBlock) {
      if (CLOSE_BRACE_RE.test(t)) {
        p.lines[i].kind = 'end';
        const ent = entityMap.get(activeEntityBlock.id);
        if (ent && !ent.refLines.includes(i)) ent.refLines.push(i);
        activeEntityBlock = null;
      } else {
        const attrMatch = ATTR_RE.exec(t);
        if (attrMatch) {
          p.lines[i].kind = 'statement';
          const ent = entityMap.get(activeEntityBlock.id);
          if (ent) {
            if (!ent.refLines.includes(i)) ent.refLines.push(i);
            ent.attributeRows.push([
              attrMatch[1],
              attrMatch[2],
              attrMatch[3] ?? '',
              attrMatch[4] ?? '',
            ]);
          }
        } else {
          p.lines[i].kind = 'unknown';
          p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
        }
      }
      continue;
    }

    const dirMatch = DIR_RE.exec(t);
    if (dirMatch) {
      p.lines[i].kind = 'statement';
      direction = dirMatch[1] === 'TD' ? 'TB' : (dirMatch[1] as Direction);
      continue;
    }

    const emptyBlockMatch = ENTITY_BLOCK_EMPTY_RE.exec(t);
    if (emptyBlockMatch) {
      p.lines[i].kind = 'statement';
      const aliasSpan = emptyBlockMatch[2] !== undefined ? spanAt(raw, i, emptyBlockMatch, 2) : undefined;
      ensureEntity(emptyBlockMatch[1], emptyBlockMatch[2], i, aliasSpan, true);
      continue;
    }

    const openBlockMatch = ENTITY_BLOCK_OPEN_RE.exec(t);
    if (openBlockMatch) {
      p.lines[i].kind = 'statement';
      const aliasSpan = openBlockMatch[2] !== undefined ? spanAt(raw, i, openBlockMatch, 2) : undefined;
      const ent = ensureEntity(openBlockMatch[1], openBlockMatch[2], i, aliasSpan, true);
      activeEntityBlock = { id: ent.id, line: i };
      continue;
    }

    const symRelMatch = REL_SYMBOL_RE.exec(t);
    if (symRelMatch) {
      p.lines[i].kind = 'statement';
      const fromSpan = symRelMatch[2] !== undefined ? spanAt(raw, i, symRelMatch, 2) : undefined;
      const fromEnt = ensureEntity(symRelMatch[1], symRelMatch[2], i, fromSpan);
      const toSpan = symRelMatch[7] !== undefined ? spanAt(raw, i, symRelMatch, 7) : undefined;
      const toEnt = ensureEntity(symRelMatch[6], symRelMatch[7], i, toSpan);
      const rel = parseSymbolRel(symRelMatch);
      edges.push(buildRelEdge(edges.length, i, raw, symRelMatch, rel, fromEnt.id, toEnt.id));
      continue;
    }

    const wordRelMatch = REL_WORD_RE.exec(t);
    if (wordRelMatch) {
      p.lines[i].kind = 'statement';
      const fromSpan = wordRelMatch[2] !== undefined ? spanAt(raw, i, wordRelMatch, 2) : undefined;
      const fromEnt = ensureEntity(wordRelMatch[1], wordRelMatch[2], i, fromSpan);
      const toSpan = wordRelMatch[7] !== undefined ? spanAt(raw, i, wordRelMatch, 7) : undefined;
      const toEnt = ensureEntity(wordRelMatch[6], wordRelMatch[7], i, toSpan);
      const rel = parseWordRel(wordRelMatch);
      edges.push(buildRelEdge(edges.length, i, raw, wordRelMatch, rel, fromEnt.id, toEnt.id));
      continue;
    }

    const declMatch = ENTITY_DECL_RE.exec(t);
    if (declMatch) {
      p.lines[i].kind = 'statement';
      const aliasSpan = declMatch[2] !== undefined ? spanAt(raw, i, declMatch, 2) : undefined;
      ensureEntity(declMatch[1], declMatch[2], i, aliasSpan, true);
      continue;
    }

    const subMatch = SUBGRAPH_RE.exec(t);
    if (subMatch) {
      p.lines[i].kind = 'statement';
      const id = subMatch[1];
      const title = subMatch[2] ?? id;
      const span = subMatch[2] !== undefined ? spanAt(raw, i, subMatch, 2) : undefined;
      groups.push({
        id,
        title,
        parent: currentGroup ? currentGroup.id : null,
        direction: null,
        markdown: false,
        line: i,
        endLine: -1,
        labelSpan: span,
      });
      currentGroup = { id, line: i };
      continue;
    }

    const endMatch = END_RE.exec(t);
    if (endMatch) {
      p.lines[i].kind = 'end';
      if (currentGroup) {
        const grp = groups.find((g) => g.id === currentGroup!.id);
        if (grp) grp.endLine = i;
        currentGroup = null;
      } else {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.strayBlockEnd });
      }
      continue;
    }

    const cssClsMatch = CSS_CLASS_RE.exec(t);
    if (cssClsMatch) {
      p.lines[i].kind = 'class';
      const ids = cssClsMatch[1].split(',').map((s) => s.trim());
      const cls = cssClsMatch[2];
      for (const id of ids) {
        const target = ensureEntity(id, undefined, i);
        if (!target.classNames.includes(cls)) target.classNames.push(cls);
      }
      continue;
    }

    const styleMatch = STYLE_RE.exec(t);
    if (styleMatch) {
      p.lines[i].kind = 'style';
      const target = ensureEntity(styleMatch[1], undefined, i);
      target.style = { ...target.style, ...parseStyleString(styleMatch[2]) };
      continue;
    }

    const defMatch = CLASS_DEF_RE.exec(t);
    if (defMatch) {
      p.lines[i].kind = 'classDef';
      classDefs[defMatch[1]] = parseStyleString(defMatch[2]);
      continue;
    }

    const applyMatch = CLASS_APPLY_RE.exec(t);
    if (applyMatch) {
      p.lines[i].kind = 'class';
      const ids = applyMatch[1].split(',').map((s) => s.trim());
      for (const id of ids) {
        const colonIdx = id.indexOf(':::');
        const realId = colonIdx !== -1 ? id.slice(0, colonIdx) : id;
        const cls = colonIdx !== -1 ? id.slice(colonIdx + 3) : applyMatch[2];
        const target = ensureEntity(realId, undefined, i);
        if (!target.classNames.includes(cls)) target.classNames.push(cls);
      }
      continue;
    }

    p.lines[i].kind = 'unknown';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  if (activeEntityBlock) {
    p.diagnostics.push({
      line: activeEntityBlock.line + 1,
      severity: 'error',
      message: MESSAGES.unclosedBrace(activeEntityBlock.id),
    });
  }

  if (currentGroup) {
    p.diagnostics.push({
      line: currentGroup.line + 1,
      severity: 'error',
      message: MESSAGES.unclosedBrace(currentGroup.id),
    });
  }

  const nodes: GraphNode[] = [];
  for (const id of entityOrder) {
    const data = entityMap.get(id)!;
    const sections = buildErSections(data.label, data.attributeRows);
    const node = makeNode(data.id, data.label, 'rect', data.line, {
      group: data.group,
      labelSpan: data.labelSpan,
      sections,
      classNames: data.classNames,
      style: data.style,
      refLines: data.refLines,
    });
    nodes.push(node);
    if (!checkLimits(nodes, edges, p.diagnostics, data.line)) break;
  }

  return finishDoc('er', p, st, {
    direction,
    nodes,
    edges,
    groups,
    classDefs,
    title: null,
  });
}
