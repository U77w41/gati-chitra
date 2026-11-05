import { LAYOUT } from '../core/constants';
import type { GraphEdge, GraphNode, ShapeKind, Theme } from '../core/types';

export function shapeShadeTier(shape: ShapeKind): 0 | 1 | 2 | 3 {
  switch (shape) {
    case 'stadium':
    case 'circle':
    case 'doubleCircle':
    case 'smallCircle':
    case 'filledCircle':
    case 'framedCircle':
    case 'forkBar':
      return 1;
    case 'diamond':
    case 'hexagon':
    case 'asymmetric':
      return 2;
    case 'cylinder':
    case 'parallelogram':
    case 'parallelogramAlt':
    case 'trapezoid':
    case 'trapezoidAlt':
    case 'document':
      return 3;
    case 'rect':
    case 'round':
    case 'subroutine':
    case 'text':
    default:
      return 0;
  }
}

export function hashNodeId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function isDarkTheme(theme: Theme): boolean {
  if (theme.glowDefault) return true;
  const bg = theme.background.trim();
  if (bg.startsWith('#')) {
    const hex = bg.slice(1);
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16) || 0;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum < 0.5;
  }
  return false;
}

export function semanticStatusShade(
  node: GraphNode,
  theme: Theme,
): { fill: string; stroke: string } {
  const dark = isDarkTheme(theme);
  const label = (node.label ?? '').toLowerCase();

  // 1. Error / Declined / Failure / Cancelled
  if (/declin|fail|cancel|error|reject|timeout|issue/i.test(label)) {
    return dark
      ? { fill: '#2d1519', stroke: '#f87171' }
      : { fill: '#fef2f2', stroke: '#ef4444' };
  }

  // 2. Success / Delivered / Completed / Approved
  if (/deliver|success|complet|approv|done|pass/i.test(label)) {
    return dark
      ? { fill: '#0f291e', stroke: '#4ade80' }
      : { fill: '#f0fdf4', stroke: '#22c55e' };
  }

  // 3. Decision / Question
  if (node.shape === 'diamond' || node.shape === 'hexagon' || label.includes('?')) {
    return dark
      ? { fill: '#231829', stroke: '#c084fc' }
      : { fill: '#faf5ff', stroke: '#9333ea' };
  }

  // 4. Dispatch / Courier / Queue / Warning
  if (/dispatch|courier|wait|pend|queue|assign/i.test(label)) {
    return dark
      ? { fill: '#2b1d12', stroke: '#fb923c' }
      : { fill: '#fff7ed', stroke: '#ea580c' };
  }

  // 5. Standard Process / Action
  if (theme.nodeShades && theme.nodeShades[0]) {
    return theme.nodeShades[0];
  }
  return dark
    ? { fill: '#172033', stroke: '#60a5fa' }
    : { fill: '#eff6ff', stroke: '#3b82f6' };
}

export function nodeStyle(
  node: GraphNode,
  theme: Theme,
): { fill: string; stroke: string; strokeWidth: number; text: string } {
  let defaultFill = theme.nodeFill;
  let defaultStroke = theme.nodeStroke;

  if (theme.shadingMode && theme.shadingMode !== 'off' && theme.nodeShades) {
    if (theme.shadingMode === 'shape') {
      const tier = shapeShadeTier(node.shape);
      const shade = theme.nodeShades[tier];
      if (shade) {
        defaultFill = shade.fill;
        defaultStroke = shade.stroke;
      }
    } else if (theme.shadingMode === 'semantic') {
      const shade = semanticStatusShade(node, theme);
      defaultFill = shade.fill;
      defaultStroke = shade.stroke;
    } else if (theme.shadingMode === 'node') {
      const tier = (hashNodeId(node.id) % 4) as 0 | 1 | 2 | 3;
      const shade = theme.nodeShades[tier];
      if (shade) {
        defaultFill = shade.fill;
        defaultStroke = shade.stroke;
      }
    }
  }

  const fill = node.style.fill ?? defaultFill;
  const stroke = node.style.stroke ?? defaultStroke;
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
  const kind = edge.kind;
  const label = (edge.label ?? '').trim().toLowerCase();

  const isSemanticTrue = /^(true|yes|approved)$/i.test(label);
  const isSemanticFalse = /^(false|no|rejected)$/i.test(label);

  let defaultStroke = theme.edge;
  let semanticDash: number[] | null = null;

  if (isSemanticTrue) {
    defaultStroke = '#10b981';
    semanticDash = [6, 4];
  } else if (isSemanticFalse) {
    defaultStroke = '#ef4444';
    semanticDash = [6, 4];
  }

  const stroke = style.stroke ?? defaultStroke;

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
      : semanticDash;

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
