import { describe, expect, it } from 'vitest';
import { fontString, wrapLabel, sizeNode } from './measure';
import { FONT_STACK_SANS } from '../core/constants';
import { testMeasure } from '../../tests/support/measure';
import type { ShapeKind } from '../core/types';
import { parseMermaid } from '../mermaid/parse';

describe('measure', () => {
  it('wraps labels according to greedy maxWidth algorithm', () => {
    expect(wrapLabel('hello world', 200, testMeasure)).toEqual(['hello world']);

    const lines = wrapLabel('a '.repeat(40).trim(), 200, testMeasure);
    expect(lines.length).toBe(4);
    expect(lines.every((l) => testMeasure(l, 16) <= 200)).toBe(true);

    expect(wrapLabel('a\nb', 200, testMeasure)).toEqual(['a', 'b']);
    expect(wrapLabel('x'.repeat(40), 200, testMeasure)).toEqual(['x'.repeat(40)]);
  });

  it('sizes nodes according to shape and content', () => {
    const n = (label: string, shape: ShapeKind) =>
      sizeNode(
        { id: 'A', label, shape, classNames: [], style: {}, group: null, line: 0, markdown: false },
        testMeasure,
      );

    expect(n('Hi', 'rect')).toMatchObject({ width: 72, height: 44 });
    expect(n('Hi', 'diamond')).toMatchObject({ width: 116, height: 71 });
    expect(n('Hi', 'circle')).toMatchObject({ width: 80, height: 80 });
    expect(n('Hi', 'hexagon')).toMatchObject({ width: 100, height: 44 });
    expect(n('Hi', 'parallelogram')).toMatchObject({ width: 100, height: 44 });
    expect(n('Hi', 'cylinder')).toMatchObject({ width: 72, height: 62 });
    expect(n('Hi', 'stadium')).toMatchObject({ width: 72, height: 44 });
    expect(n('hello world', 'rect')).toMatchObject({ width: 124, height: 44 });
    expect(n('a\nb', 'rect')).toMatchObject({ width: 72, height: 64 });
  });

  it('sizes point shapes and the fork bar', () => {
    const nodeOf = (shape: ShapeKind) => ({
      id: 'A', label: 'x', shape, classNames: [], style: {}, group: null, line: 0, markdown: false,
    });
    expect(sizeNode(nodeOf('smallCircle'), testMeasure, 'TB')).toMatchObject({ width: 20, height: 20 });
    expect(sizeNode(nodeOf('forkBar'), testMeasure, 'TB')).toMatchObject({ width: 72, height: 10 });
    expect(sizeNode(nodeOf('forkBar'), testMeasure, 'LR')).toMatchObject({ width: 10, height: 72 });
  });

  it('builds the canvas font with weight and style', () => {
    expect(fontString(16)).toBe(`16px ${FONT_STACK_SANS}`);
    expect(fontString(16, { bold: true, italic: true })).toBe(`italic bold 16px ${FONT_STACK_SANS}`);
  });

  it('keeps a fixed size and makes room for an icon', () => {
    const base = parseMermaid('flowchart TD\nA[Server]').nodes[0];
    expect(sizeNode({ ...base, size: { width: 20, height: 20 } }, testMeasure, 'TB')).toMatchObject({ width: 20, height: 20 });
    const plain = sizeNode(base, testMeasure, 'TB');
    const iconned = sizeNode({ ...base, icon: 'server' }, testMeasure, 'TB');
    expect(iconned.height).toBe(plain.height + 38);
  });

  it.each([
    ['note', 86, 44], ['ellipse', 99, 58], ['cloud', 103, 60], ['bang', 107, 62], ['blockArrow', 116, 44],
  ] as const)('sizes %s', (shape, w, h) => {
    const n = { ...parseMermaid('flowchart TD\nA[Login]').nodes[0], shape, arrowDir: 'right' as const };
    expect(sizeNode(n, testMeasure, 'TB')).toMatchObject({ width: w, height: h });
  });

  it('sizes an actor around its figure and label', () => {
    const n = { ...parseMermaid('flowchart TD\nA[User]').nodes[0], shape: 'actor' as const };
    expect(sizeNode(n, testMeasure, 'TB')).toMatchObject({ width: 40, height: 80 });
  });
});
