import { describe, expect, it } from 'vitest';
import { LIMITS, MESSAGES } from '../../core/constants';
import type { GraphNode } from '../../core/types';
import { checkLimits, commonLine, finishDoc, makeEdge, makeNode, newCommonState, readPrelude } from './prelude';

const HEADER = /^demo\s*$/;

describe('readPrelude', () => {
  it('reads front matter, skips comments and finds the header', () => {
    const p = readPrelude('---\ntitle: "Hello"\n---\n%% c\ndemo\n  x', HEADER);
    if ('ok' in p) throw new Error('expected a prelude');
    expect(p).toMatchObject({ headerIdx: 4, title: 'Hello' });
    expect(p.lines.map((l) => l.kind).slice(0, 5)).toEqual(['frontmatter', 'frontmatter', 'frontmatter', 'comment', 'header']);
  });
  it('rejects text that is too long', () => {
    const r = readPrelude('demo\n' + 'x'.repeat(LIMITS.maxTextChars), HEADER);
    expect('ok' in r && r.diagnostics[0].message).toBe(MESSAGES.textTooLong);
  });
});

describe('commonLine', () => {
  it('handles pins, comments, directives and accessibility lines', () => {
    const p = readPrelude('demo\n%% studio:pos A 10 20\n%%{init: {}}%%\naccTitle: T\naccDescr {\n  one\n  two\n}\n', HEADER);
    if ('ok' in p) throw new Error('expected a prelude');
    const st = newCommonState();
    for (let i = 1; i < p.rawLines.length; i++) commonLine(p.rawLines[i], i, p.lines, st);
    expect(st.pins).toEqual({ A: { x: 10, y: 20 } });
    expect(st.accTitle).toBe('T');
    expect(st.accDescr).toBe('one\ntwo');
    expect(p.lines.map((l) => l.kind)).toEqual(['header', 'pos', 'directive', 'acc', 'acc', 'acc', 'acc', 'acc', 'blank']);
  });
});

it('fills node and edge defaults', () => {
  expect(makeNode('A', 'a', 'rect', 3)).toMatchObject({ id: 'A', label: 'a', shape: 'rect', classNames: [], style: {}, group: null, markdown: false, line: 3 });
  expect(makeEdge(2, 'A', 'B', 'open', 'l', 4)).toMatchObject({ id: 'e2', index: 2, length: 1, ref: null, anim: { animate: null, speed: null }, fromIsGroup: false, toIsGroup: false, line: 4 });
});

it('reports the node limit once', () => {
  const nodes: GraphNode[] = Array.from({ length: LIMITS.maxNodes + 1 }, (_, i) => makeNode(`n${i}`, '', 'rect', 1));
  const diags: { line: number; severity: 'error' | 'warning' | 'info'; message: string }[] = [];
  expect(checkLimits(nodes, [], diags, 5)).toBe(false);
  expect(checkLimits(nodes, [], diags, 6)).toBe(false);
  expect(diags).toEqual([{ line: 5, severity: 'error', message: MESSAGES.tooManyNodes }]);
});

it('finishes a doc with kind, ok and line indexes', () => {
  const p = readPrelude('demo\n  A', HEADER);
  if ('ok' in p) throw new Error('expected a prelude');
  const doc = finishDoc('state', p, newCommonState(), { direction: 'TB', nodes: [makeNode('A', 'A', 'round', 1)], edges: [], groups: [], classDefs: {}, title: null });
  expect(doc).toMatchObject({ kind: 'state', ok: true, links: {}, explicitEdgeAnimation: false });
  expect(doc.lines[1].nodeIds).toEqual(['A']);
});
