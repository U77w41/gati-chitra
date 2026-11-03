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
  startMarker: 'arrow' | 'circle' | 'cross' | 'none';
  startArrow: boolean;
} {
  const style = edge.style;
  const stroke = style.stroke ?? theme.edge;
  const kind = edge.kind;

  const isThick = kind === 'thick' || kind === 'thickArrow' || kind === 'thickBidirectional';
  const isDotted = kind === 'dotted' || kind === 'dottedArrow' || kind === 'dottedBidirectional';

  const width = style['stroke-width']
    ? parseFloat(style['stroke-width'])
    : isThick
      ? LAYOUT.edgeWidthThick
      : LAYOUT.edgeWidth;

  const dash = style['stroke-dasharray']
    ? style['stroke-dasharray'].trim().split(/[\s,]+/).map(Number)
    : isDotted
      ? [...LAYOUT.dottedDash]
      : null;

  let endMarker: 'arrow' | 'circle' | 'cross' | 'none' = 'none';
  if (
    kind === 'arrow' ||
    kind === 'dottedArrow' ||
    kind === 'thickArrow' ||
    kind === 'bidirectional' ||
    kind === 'dottedBidirectional' ||
    kind === 'thickBidirectional'
  ) {
    endMarker = 'arrow';
  } else if (kind === 'circleEnd' || kind === 'circleBoth') {
    endMarker = 'circle';
  } else if (kind === 'crossEnd' || kind === 'crossBoth') {
    endMarker = 'cross';
  }

  let startMarker: 'arrow' | 'circle' | 'cross' | 'none' = 'none';
  if (
    kind === 'bidirectional' ||
    kind === 'dottedBidirectional' ||
    kind === 'thickBidirectional'
  ) {
    startMarker = 'arrow';
  } else if (kind === 'circleBoth') {
    startMarker = 'circle';
  } else if (kind === 'crossBoth') {
    startMarker = 'cross';
  }

  const startArrow = startMarker === 'arrow';

  return { stroke, width, dash, endMarker, startMarker, startArrow };
}
