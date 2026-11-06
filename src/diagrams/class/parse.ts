import { MESSAGES } from '../../core/constants';
import type {
  Direction, GraphEdge, GraphGroup, GraphNode, ParsedDoc, Span, StyleMap,
} from '../../core/types';
import { parseStyleString } from '../../mermaid/styles';
import {
  checkLimits, commonLine, finishDoc, makeEdge, makeNode,
  newCommonState, readPrelude, spanAt,
} from '../common/prelude';
import {
  ANNOTATION_RE, CLASS_APPLY_RE, CLASS_DECL_RE, CLASS_DEF_RE, CLOSE_BRACE_RE,
  CSS_CLASS_RE, DIR_RE, HEADER_RE, IGNORED_RE, MEMBER_RE, NAMESPACE_RE,
  NOTE_FOR_RE, NOTE_FREE_RE, REL_RE, STYLE_RE,
} from './patterns';
import {
  type ClassData, buildClassSections, parseClassId, parseRelOp,
} from './helpers';

export function parseClass(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  let direction: Direction = 'TB';
  const classMap = new Map<string, ClassData>();
  const nodeOrder: ({ type: 'class'; id: string } | { type: 'note'; node: GraphNode })[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  const classDefs: Record<string, StyleMap> = {};
  let noteIndex = 0;

  let currentNamespace: { id: string; line: number } | null = null;
  let activeMemberBlock: { id: string; line: number } | null = null;

  function ensureClass(id: string, label: string, line: number, labelSpan?: Span): ClassData {
    let data = classMap.get(id);
    if (!data) {
      data = {
        id, label, labelSpan, line, group: currentNamespace ? currentNamespace.id : null,
        members: [], refLines: [line], classNames: [], style: {},
      };
      classMap.set(id, data);
      nodeOrder.push({ type: 'class', id });
    } else {
      if (labelSpan && !data.labelSpan) {
        data.label = label;
        data.labelSpan = labelSpan;
      }
      if (!data.refLines.includes(line)) data.refLines.push(line);
    }
    return data;
  }

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    if (activeMemberBlock) {
      if (CLOSE_BRACE_RE.test(t)) {
        p.lines[i].kind = 'end';
        const cls = classMap.get(activeMemberBlock.id);
        if (cls && !cls.refLines.includes(i)) cls.refLines.push(i);
        activeMemberBlock = null;
      } else {
        p.lines[i].kind = 'statement';
        const cls = classMap.get(activeMemberBlock.id);
        if (cls) {
          if (!cls.refLines.includes(i)) cls.refLines.push(i);
          const annotMatch = /^<<([^>]+)>>$/.exec(t);
          if (annotMatch) cls.annotation = annotMatch[1];
          else cls.members.push(t);
        }
      }
      continue;
    }

    if (IGNORED_RE.test(t)) {
      p.lines[i].kind = 'statement';
      p.diagnostics.push({ line: i + 1, severity: 'info', message: MESSAGES.syntaxIgnored('Class click and link') });
      continue;
    }

    const dirMatch = DIR_RE.exec(t);
    if (dirMatch) {
      p.lines[i].kind = 'statement';
      direction = dirMatch[1] === 'TD' ? 'TB' : (dirMatch[1] as Direction);
      continue;
    }

    const classMatch = CLASS_DECL_RE.exec(t);
    if (classMatch) {
      p.lines[i].kind = 'statement';
      const id = classMatch[1];
      const generic = classMatch[2];
      const explicitLabel = classMatch[3];
      const cssClass = classMatch[4];
      const opensBlock = Boolean(classMatch[5]);
      const span = explicitLabel !== undefined ? spanAt(raw, i, classMatch, 3) : undefined;
      const label = explicitLabel ?? (generic ? `${id}<${generic.slice(1, -1)}>` : id);
      const data = ensureClass(id, label, i, span);
      if (cssClass && !data.classNames.includes(cssClass)) data.classNames.push(cssClass);
      if (opensBlock) activeMemberBlock = { id, line: i };
      continue;
    }

    const annotMatch = ANNOTATION_RE.exec(t);
    if (annotMatch) {
      p.lines[i].kind = 'statement';
      const cls = ensureClass(annotMatch[2], annotMatch[2], i);
      cls.annotation = annotMatch[1];
      if (!cls.refLines.includes(i)) cls.refLines.push(i);
      continue;
    }

    const relMatch = REL_RE.exec(t);
    if (relMatch) {
      p.lines[i].kind = 'statement';
      const fromParsed = parseClassId(relMatch[1]);
      const toParsed = parseClassId(relMatch[5]);
      ensureClass(fromParsed.id, fromParsed.label, i);
      ensureClass(toParsed.id, toParsed.label, i);
      const opStr = relMatch[3];
      const { kind, markers, isLollipop } = parseRelOp(opStr);
      if (isLollipop) {
        p.diagnostics.push({ line: i + 1, severity: 'info', message: MESSAGES.syntaxIgnored('Lollipop interfaces') });
      }
      const label = relMatch[6] ?? '';
      const span = relMatch[6] !== undefined ? spanAt(raw, i, relMatch, 6) : undefined;
      const opSpan = spanAt(raw, i, relMatch, 3);
      const endLabels = (relMatch[2] || relMatch[4]) ? { from: relMatch[2], to: relMatch[4] } : undefined;
      edges.push(makeEdge(edges.length, fromParsed.id, toParsed.id, kind, label, i, {
        variant: opStr, markers, endLabels, labelSpan: span, opSpan,
      }));
      continue;
    }

    const memberMatch = MEMBER_RE.exec(t);
    if (memberMatch) {
      p.lines[i].kind = 'statement';
      const cls = ensureClass(memberMatch[1], memberMatch[1], i);
      cls.members.push(memberMatch[2].trim());
      if (!cls.refLines.includes(i)) cls.refLines.push(i);
      continue;
    }

    const noteForMatch = NOTE_FOR_RE.exec(t);
    if (noteForMatch) {
      p.lines[i].kind = 'statement';
      const targetId = noteForMatch[1];
      const target = ensureClass(targetId, targetId, i);
      const noteId = `note${++noteIndex}`;
      const noteLabel = noteForMatch[2];
      const span = spanAt(raw, i, noteForMatch, 2);
      const noteNode = makeNode(noteId, noteLabel, 'note', i, {
        group: target.group, refLines: [i], labelSpan: span,
      });
      nodeOrder.push({ type: 'note', node: noteNode });
      edges.push(makeEdge(edges.length, noteId, targetId, 'dotted', '', i, {
        variant: 'note', markers: { start: 'none', end: 'none' },
      }));
      if (!target.refLines.includes(i)) target.refLines.push(i);
      continue;
    }

    const noteFreeMatch = NOTE_FREE_RE.exec(t);
    if (noteFreeMatch) {
      p.lines[i].kind = 'statement';
      const noteId = `note${++noteIndex}`;
      const span = spanAt(raw, i, noteFreeMatch, 1);
      const noteNode = makeNode(noteId, noteFreeMatch[1], 'note', i, {
        group: currentNamespace ? currentNamespace.id : null, refLines: [i], labelSpan: span,
      });
      nodeOrder.push({ type: 'note', node: noteNode });
      continue;
    }

    const nsMatch = NAMESPACE_RE.exec(t);
    if (nsMatch) {
      p.lines[i].kind = 'statement';
      const id = nsMatch[1];
      const title = nsMatch[2] ?? id;
      const span = nsMatch[2] !== undefined ? spanAt(raw, i, nsMatch, 2) : undefined;
      groups.push({ id, title, parent: null, direction: null, markdown: false, line: i, endLine: -1, labelSpan: span });
      currentNamespace = { id, line: i };
      continue;
    }

    if (CLOSE_BRACE_RE.test(t)) {
      p.lines[i].kind = 'end';
      if (currentNamespace) {
        const grp = groups.find((g) => g.id === currentNamespace!.id);
        if (grp) grp.endLine = i;
        currentNamespace = null;
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
        const target = ensureClass(id, id, i);
        if (!target.classNames.includes(cls)) target.classNames.push(cls);
      }
      continue;
    }

    const styleMatch = STYLE_RE.exec(t);
    if (styleMatch) {
      p.lines[i].kind = 'style';
      const target = ensureClass(styleMatch[1], styleMatch[1], i);
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
        const target = ensureClass(realId, realId, i);
        if (!target.classNames.includes(cls)) target.classNames.push(cls);
      }
      continue;
    }

    p.lines[i].kind = 'unknown';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  if (activeMemberBlock) {
    p.diagnostics.push({ line: activeMemberBlock.line + 1, severity: 'error', message: MESSAGES.unclosedBrace(activeMemberBlock.id) });
  }
  if (currentNamespace) {
    p.diagnostics.push({ line: currentNamespace.line + 1, severity: 'error', message: MESSAGES.unclosedBrace(currentNamespace.id) });
  }

  const nodes: GraphNode[] = [];
  for (const item of nodeOrder) {
    if (item.type === 'class') {
      const data = classMap.get(item.id)!;
      const sections = buildClassSections(data);
      nodes.push(makeNode(data.id, data.label, 'rect', data.line, {
        group: data.group, labelSpan: data.labelSpan, sections,
        classNames: data.classNames, style: data.style, refLines: data.refLines,
      }));
    } else {
      nodes.push(item.node);
    }
  }

  checkLimits(nodes, edges, p.diagnostics, p.rawLines.length);

  return finishDoc('class', p, st, {
    direction, nodes, edges, groups, classDefs, title: null,
  });
}
