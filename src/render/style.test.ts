import { describe, expect, it } from 'vitest';
import type { GraphEdge, GraphNode } from '../../src/core/types';
import { THEMES } from './themes';
import {
  edgeStyle,
  hashNodeId,
  nodeStyle,
  semanticStatusShade,
  shapeShadeTier,
} from './style';

function makeNode(overrides?: Partial<GraphNode>): GraphNode {
  return {
    id: 'A',
    label: 'Order Placed',
    shape: 'rect',
    classNames: [],
    style: {},
    group: null,
    markdown: false,
    line: 0,
    ...overrides,
  };
}

function makeEdge(overrides?: Partial<GraphEdge>): GraphEdge {
  return {
    id: 'e0',
    index: 0,
    from: 'A',
    to: 'B',
    kind: 'arrow',
    label: '',
    length: 100,
    style: {},
    ref: null,
    anim: { animate: null, speed: null },
    markdown: false,
    fromIsGroup: false,
    toIsGroup: false,
    line: 1,
    ...overrides,
  };
}

describe('nodeStyle & edgeStyle upgrades', () => {
  it('maps shapes to correct tiers in shapeShadeTier', () => {
    expect(shapeShadeTier('rect')).toBe(0);
    expect(shapeShadeTier('round')).toBe(0);
    expect(shapeShadeTier('subroutine')).toBe(0);
    expect(shapeShadeTier('text')).toBe(0);

    expect(shapeShadeTier('stadium')).toBe(1);
    expect(shapeShadeTier('circle')).toBe(1);
    expect(shapeShadeTier('doubleCircle')).toBe(1);
    expect(shapeShadeTier('smallCircle')).toBe(1);
    expect(shapeShadeTier('filledCircle')).toBe(1);
    expect(shapeShadeTier('framedCircle')).toBe(1);
    expect(shapeShadeTier('forkBar')).toBe(1);

    expect(shapeShadeTier('diamond')).toBe(2);
    expect(shapeShadeTier('hexagon')).toBe(2);
    expect(shapeShadeTier('asymmetric')).toBe(2);

    expect(shapeShadeTier('cylinder')).toBe(3);
    expect(shapeShadeTier('parallelogram')).toBe(3);
    expect(shapeShadeTier('parallelogramAlt')).toBe(3);
    expect(shapeShadeTier('trapezoid')).toBe(3);
    expect(shapeShadeTier('trapezoidAlt')).toBe(3);
    expect(shapeShadeTier('document')).toBe(3);
  });

  it('computes deterministic hashNodeId', () => {
    expect(hashNodeId('nodeA')).toBe(hashNodeId('nodeA'));
    expect(typeof hashNodeId('order')).toBe('number');
  });

  it('resolves semantic status shades correctly for light and dark themes', () => {
    const light = THEMES.daylight;
    const dark = THEMES.midnight;

    // Error
    const errNode = makeNode({ label: 'Payment Declined' });
    expect(semanticStatusShade(errNode, light)).toEqual({ fill: '#fef2f2', stroke: '#ef4444' });
    expect(semanticStatusShade(errNode, dark)).toEqual({ fill: '#2d1519', stroke: '#f87171' });

    // Success
    const successNode = makeNode({ label: 'Order Delivered' });
    expect(semanticStatusShade(successNode, light)).toEqual({ fill: '#f0fdf4', stroke: '#22c55e' });
    expect(semanticStatusShade(successNode, dark)).toEqual({ fill: '#0f291e', stroke: '#4ade80' });

    // Dispatch
    const dispatchNode = makeNode({ label: 'Courier Dispatch' });
    expect(semanticStatusShade(dispatchNode, light)).toEqual({ fill: '#fff7ed', stroke: '#ea580c' });
    expect(semanticStatusShade(dispatchNode, dark)).toEqual({ fill: '#2b1d12', stroke: '#fb923c' });

    // Decision
    const decisionNode = makeNode({ shape: 'diamond', label: 'Payment Authorized?' });
    expect(semanticStatusShade(decisionNode, light)).toEqual({ fill: '#faf5ff', stroke: '#9333ea' });
    expect(semanticStatusShade(decisionNode, dark)).toEqual({ fill: '#231829', stroke: '#c084fc' });
  });

  it('honors node shading modes in nodeStyle', () => {
    const shapeTheme = { ...THEMES.daylight, shadingMode: 'shape' as const };
    const stadium = makeNode({ shape: 'stadium' });
    const stadiumStyle = nodeStyle(stadium, shapeTheme);
    expect(stadiumStyle.fill).toBe(THEMES.daylight.nodeShades![1].fill);
    expect(stadiumStyle.stroke).toBe(THEMES.daylight.nodeShades![1].stroke);

    const semanticTheme = { ...THEMES.daylight, shadingMode: 'semantic' as const };
    const errNode = makeNode({ label: 'Timeout Occurred' });
    const errStyle = nodeStyle(errNode, semanticTheme);
    expect(errStyle.fill).toBe('#fef2f2');
    expect(errStyle.stroke).toBe('#ef4444');

    // Explicit style override wins
    const customNode = makeNode({
      label: 'Timeout Occurred',
      style: { fill: '#123456', stroke: '#654321' },
    });
    const customStyle = nodeStyle(customNode, semanticTheme);
    expect(customStyle.fill).toBe('#123456');
    expect(customStyle.stroke).toBe('#654321');
  });

  it('auto-styles semantic true/false branch edge labels in edgeStyle', () => {
    const theme = THEMES.daylight;

    const trueEdge = makeEdge({ label: 'true' });
    const trueStyle = edgeStyle(trueEdge, theme);
    expect(trueStyle.stroke).toBe('#10b981');
    expect(trueStyle.dash).toEqual([6, 4]);

    const yesEdge = makeEdge({ label: 'Yes' });
    const yesStyle = edgeStyle(yesEdge, theme);
    expect(yesStyle.stroke).toBe('#10b981');
    expect(yesStyle.dash).toEqual([6, 4]);

    const falseEdge = makeEdge({ label: 'false' });
    const falseStyle = edgeStyle(falseEdge, theme);
    expect(falseStyle.stroke).toBe('#ef4444');
    expect(falseStyle.dash).toEqual([6, 4]);

    const noEdge = makeEdge({ label: 'no' });
    const noStyle = edgeStyle(noEdge, theme);
    expect(noStyle.stroke).toBe('#ef4444');
    expect(noStyle.dash).toEqual([6, 4]);

    // Explicit edge style overrides auto-styling
    const overrideEdge = makeEdge({
      label: 'true',
      style: { stroke: '#999999' },
    });
    const overrideStyle = edgeStyle(overrideEdge, theme);
    expect(overrideStyle.stroke).toBe('#999999');
  });
});
