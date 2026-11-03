import { describe, expect, it } from 'vitest';
import { wrapLabel, sizeNode } from './measure';
import { testMeasure } from '../../tests/support/measure';
import type { ShapeKind } from '../core/types';

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
});
