import { MESSAGES } from '../../core/constants';
import type {
  Direction, GraphEdge, GraphGroup, GraphNode,
  ParsedDoc, ShapeKind, StyleMap,
} from '../../core/types';
import { parseStyleString } from '../../mermaid/styles';
import {
  checkLimits, commonLine, finishDoc, makeEdge, makeNode,
  newCommonState, readPrelude, spanAt,
} from '../common/prelude';
import {
  CLASS_APPLY_RE, CLASS_DEF_RE, CLOSE_BRACE_RE, DESC_RE, DIR_RE, DIVIDER_RE,
  HEADER_RE, HIDE_EMPTY_RE, NOTE_MULTI_RE, NOTE_ONE_RE, STATE_AS_RE,
  STATE_BLOCK_RE, STATE_DECL_RE, STATE_SPECIAL_RE, STYLE_RE, TRANSITION_RE,
} from './patterns';
import { ScopeTracker, makeGroup } from './scope';

export function parseState(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const st = newCommonState();
  let direction: Direction = 'TB';
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  const classDefs: Record<string, StyleMap> = {};
  const scopes = new ScopeTracker();
  let noteIndex = 0;

  function findNode(id: string): GraphNode | undefined {
    return nodes.find((n) => n.id === id);
  }

  function ensureStateNode(id: string, line: number, shape: ShapeKind = 'round'): GraphNode {
    let node = findNode(id);
    if (!node) {
      node = makeNode(id, id, shape, line, { group: scopes.currentScope(), refLines: [line] });
      nodes.push(node);
    } else {
      if (!node.refLines) node.refLines = [];
      if (!node.refLines.includes(line)) node.refLines.push(line);
    }
    return node;
  }

  function resolveEnd(rawId: string, line: number, isStart: boolean): string {
    if (rawId === '[*]') {
      const scope = scopes.compositeScope();
      const pseudoId = isStart ? `__start_${scope}` : `__end_${scope}`;
      if (!findNode(pseudoId)) {
        const shape: ShapeKind = isStart ? 'filledCircle' : 'framedCircle';
        const size = isStart ? { width: 20, height: 20 } : { width: 24, height: 24 };
        nodes.push(makeNode(pseudoId, '', shape, line, {
          group: scopes.currentScope(), size, refLines: [line],
        }));
      }
      return pseudoId;
    }
    let id = rawId;
    const colonIdx = id.indexOf(':::');
    let cssClass: string | undefined;
    if (colonIdx !== -1) {
      cssClass = id.slice(colonIdx + 3);
      id = id.slice(0, colonIdx);
    }
    const node = ensureStateNode(id, line);
    if (cssClass && !node.classNames.includes(cssClass)) {
      node.classNames.push(cssClass);
    }
    return id;
  }

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    if (HIDE_EMPTY_RE.test(t)) {
      p.lines[i].kind = 'statement';
      p.diagnostics.push({ line: i + 1, severity: 'info', message: MESSAGES.syntaxIgnored('hide empty description') });
      continue;
    }

    const dirMatch = DIR_RE.exec(t);
    if (dirMatch) {
      p.lines[i].kind = 'statement';
      direction = dirMatch[1] === 'TD' ? 'TB' : (dirMatch[1] as Direction);
      continue;
    }

    const stateAsMatch = STATE_AS_RE.exec(t);
    if (stateAsMatch) {
      p.lines[i].kind = 'statement';
      const label = stateAsMatch[1];
      const id = stateAsMatch[2];
      const opensComposite = Boolean(stateAsMatch[3]);
      const span = spanAt(raw, i, stateAsMatch, 1);
      if (opensComposite) {
        groups.push(makeGroup(id, label, scopes.currentScope(), i, { labelSpan: span }));
        scopes.openScope(id, i);
      } else {
        const node = ensureStateNode(id, i);
        node.label = label;
        node.labelSpan = span;
      }
      continue;
    }

    const specialMatch = STATE_SPECIAL_RE.exec(t);
    if (specialMatch) {
      p.lines[i].kind = 'statement';
      const id = specialMatch[1];
      if (specialMatch[2] === 'choice') {
        const node = ensureStateNode(id, i, 'diamond');
        node.shape = 'diamond';
        node.label = '';
        node.size = { width: 28, height: 28 };
      } else {
        const node = ensureStateNode(id, i, 'forkBar');
        node.shape = 'forkBar';
        node.label = '';
      }
      continue;
    }

    const blockMatch = STATE_BLOCK_RE.exec(t);
    if (blockMatch) {
      p.lines[i].kind = 'statement';
      groups.push(makeGroup(blockMatch[1], blockMatch[1], scopes.currentScope(), i));
      scopes.openScope(blockMatch[1], i);
      continue;
    }

    const declMatch = STATE_DECL_RE.exec(t);
    if (declMatch) {
      p.lines[i].kind = 'statement';
      ensureStateNode(declMatch[1], i);
      continue;
    }

    if (CLOSE_BRACE_RE.test(t)) {
      p.lines[i].kind = 'end';
      scopes.closeScope(i, groups, p.diagnostics);
      continue;
    }

    if (DIVIDER_RE.test(t)) {
      scopes.handleDivider(i, p.lines, groups, nodes, p.diagnostics);
      continue;
    }

    const transMatch = TRANSITION_RE.exec(t);
    if (transMatch) {
      p.lines[i].kind = 'statement';
      const fromId = resolveEnd(transMatch[1], i, true);
      const toId = resolveEnd(transMatch[2], i, false);
      const label = transMatch[3] ?? '';
      const span = transMatch[3] !== undefined ? spanAt(raw, i, transMatch, 3) : undefined;
      edges.push(makeEdge(edges.length, fromId, toId, 'open', label, i, {
        variant: '-->', markers: { start: 'none', end: 'arrow' }, labelSpan: span,
      }));
      checkLimits(nodes, edges, p.diagnostics, i + 1);
      continue;
    }

    const noteOneMatch = NOTE_ONE_RE.exec(t);
    if (noteOneMatch) {
      p.lines[i].kind = 'statement';
      const targetId = noteOneMatch[1];
      const target = ensureStateNode(targetId, i);
      const noteId = `note${++noteIndex}`;
      const span = spanAt(raw, i, noteOneMatch, 2);
      nodes.push(makeNode(noteId, noteOneMatch[2].trim(), 'note', i, {
        group: target.group, refLines: [i], labelSpan: span,
      }));
      edges.push(makeEdge(edges.length, noteId, targetId, 'dotted', '', i, {
        variant: 'note', markers: { start: 'none', end: 'none' },
      }));
      continue;
    }

    const noteMultiMatch = NOTE_MULTI_RE.exec(t);
    if (noteMultiMatch) {
      p.lines[i].kind = 'statement';
      const targetId = noteMultiMatch[1];
      const target = ensureStateNode(targetId, i);
      const noteId = `note${++noteIndex}`;
      const noteLines: string[] = [];
      const refLines = [i];
      let j = i + 1;
      while (j < p.rawLines.length) {
        p.lines[j].kind = 'statement';
        refLines.push(j);
        if (p.rawLines[j].trim() === 'end note') break;
        noteLines.push(p.rawLines[j]);
        j++;
      }
      i = j;
      nodes.push(makeNode(noteId, noteLines.join('\n'), 'note', refLines[0], { group: target.group, refLines }));
      edges.push(makeEdge(edges.length, noteId, targetId, 'dotted', '', refLines[0], {
        variant: 'note', markers: { start: 'none', end: 'none' },
      }));
      for (const lineIdx of refLines) {
        if (!target.refLines) target.refLines = [];
        if (!target.refLines.includes(lineIdx)) target.refLines.push(lineIdx);
      }
      continue;
    }

    const descMatch = DESC_RE.exec(t);
    if (descMatch) {
      p.lines[i].kind = 'statement';
      const id = descMatch[1];
      const desc = descMatch[2].trim();
      const span = spanAt(raw, i, descMatch, 2);
      const node = ensureStateNode(id, i);
      if (node.label === id) {
        node.label = desc;
        node.labelSpan = span;
      } else {
        node.label += `\n${desc}`;
      }
      continue;
    }

    const styleMatch = STYLE_RE.exec(t);
    if (styleMatch) {
      p.lines[i].kind = 'style';
      const node = findNode(styleMatch[1]);
      if (node) {
        node.style = { ...node.style, ...parseStyleString(styleMatch[2]) };
        if (!node.refLines) node.refLines = [];
        if (!node.refLines.includes(i)) node.refLines.push(i);
      }
      continue;
    }

    const defMatch = CLASS_DEF_RE.exec(t);
    if (defMatch) {
      p.lines[i].kind = 'classDef';
      classDefs[defMatch[1]] = parseStyleString(defMatch[2]);
      continue;
    }

    const classMatch = CLASS_APPLY_RE.exec(t);
    if (classMatch) {
      p.lines[i].kind = 'class';
      const targetIds = classMatch[1].split(',').map((s) => s.trim());
      for (const targetId of targetIds) {
        const node = findNode(targetId);
        if (node && !node.classNames.includes(classMatch[2])) node.classNames.push(classMatch[2]);
      }
      continue;
    }

    p.lines[i].kind = 'unknown';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  scopes.checkUnclosed(p.diagnostics);

  const groupIds = new Set(groups.map((g) => g.id));
  const finalNodes = nodes.filter((n) => !groupIds.has(n.id));
  for (const edge of edges) {
    if (groupIds.has(edge.from)) edge.fromIsGroup = true;
    if (groupIds.has(edge.to)) edge.toIsGroup = true;
  }

  return finishDoc('state', p, st, {
    direction, nodes: finalNodes, edges, groups, classDefs, title: null,
  });
}
