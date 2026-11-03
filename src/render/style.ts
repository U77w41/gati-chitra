import { LAYOUT } from '../core/constants';
import type { GraphEdge, GraphNode, Theme } from '../core/types';

export function nodeStyle(
  node: GraphNode,
  theme: Theme,
): { fill: string; stroke: string; strokeWidth: number; text: string } {
  const fill = node.style.fill ?? theme.nodeFill;
  const stroke = node.style.stroke ?? theme.nodeStroke;
  const strokeWidth = parseFloat(node.style['stroke-width']) || 2;
  const text = node.style.color ?? theme.nodeText;
  return { fill, stroke, strokeWidth, text };
}

export function edgeStyle(
  edge: GraphEdge,
  theme: Theme,
): {
  stroke: string;
  width: number;
  dash: number[] | null;
  endMarker: 'arrow' | 'circle' | 'cross' | 'none';
  startArrow: boolean;
} {
  const style = edge.style;
  const stroke = style.stroke ?? theme.edge;
  const width = style['stroke-width']
    ? parseFloat(style['stroke-width'])
    : edge.kind === 'thick' || edge.kind === 'thickArrow'
      ? LAYOUT.edgeWidthThick
      : LAYOUT.edgeWidth;

  const dash = style['stroke-dasharray']
    ? style['stroke-dasharray'].trim().split(/[\s,]+/).map(Number)
    : edge.kind === 'dotted' || edge.kind === 'dottedArrow'
      ? [...LAYOUT.dottedDash]
      : null;

  let endMarker: 'arrow' | 'circle' | 'cross' | 'none' = 'none';
  if (
    edge.kind === 'arrow' ||
    edge.kind === 'dottedArrow' ||
    edge.kind === 'thickArrow' ||
    edge.kind === 'bidirectional'
  ) {
    endMarker = 'arrow';
  } else if (edge.kind === 'circleEnd') {
    endMarker = 'circle';
  } else if (edge.kind === 'crossEnd') {
    endMarker = 'cross';
  }

  const startArrow = edge.kind === 'bidirectional';

  return { stroke, width, dash, endMarker, startArrow };
}
