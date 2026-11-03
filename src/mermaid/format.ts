import type { EdgeKind, ShapeKind } from '../core/types';

export function shapeTokens(shape: ShapeKind): { open: string; close: string } | null {
  switch (shape) {
    case 'subroutine':
      return { open: '[[', close: ']]' };
    case 'cylinder':
      return { open: '[(', close: ')]' };
    case 'parallelogram':
      return { open: '[/', close: '/]' };
    case 'parallelogramAlt':
      return { open: '[\\', close: '\\]' };
    case 'stadium':
      return { open: '([', close: '])' };
    case 'circle':
      return { open: '((', close: '))' };
    case 'hexagon':
      return { open: '{{', close: '}}' };
    case 'rect':
      return { open: '[', close: ']' };
    case 'round':
      return { open: '(', close: ')' };
    case 'diamond':
      return { open: '{', close: '}' };
    case 'trapezoid':
      return { open: '[/', close: '\\]' };
    case 'trapezoidAlt':
      return { open: '[\\', close: '/]' };
    case 'doubleCircle':
      return { open: '(((', close: ')))' };
    case 'asymmetric':
      return { open: '>', close: ']' };
    case 'document':
    case 'smallCircle':
    case 'filledCircle':
    case 'framedCircle':
    case 'forkBar':
    case 'text':
      return null;
  }
}

export function computeEdgeLength(kind: EdgeKind, text: string): number {
  switch (kind) {
    case 'arrow':
    case 'bidirectional':
    case 'thickArrow':
    case 'thickBidirectional':
      return Math.max(1, (text.match(/[-=]/g) || []).length - 1);
    case 'open':
    case 'thick':
    case 'invisible':
    case 'circleEnd':
    case 'crossEnd':
    case 'circleBoth':
    case 'crossBoth':
      return Math.max(1, (text.match(/[-=~]/g) || []).length - 2);
    case 'dottedArrow':
    case 'dotted':
    case 'dottedBidirectional':
      return Math.max(1, (text.match(/\./g) || []).length);
  }
}

export function edgeOperatorText(kind: EdgeKind, length: number = 1): string {
  const len = Math.max(1, length);
  switch (kind) {
    case 'arrow':
      return '-'.repeat(len + 1) + '>';
    case 'open':
      return '-'.repeat(len + 2);
    case 'dottedArrow':
      return '-' + '.'.repeat(len) + '->';
    case 'dotted':
      return '-' + '.'.repeat(len) + '-';
    case 'thickArrow':
      return '='.repeat(len + 1) + '>';
    case 'thick':
      return '='.repeat(len + 2);
    case 'circleEnd':
      return '-'.repeat(len + 1) + 'o';
    case 'crossEnd':
      return '-'.repeat(len + 1) + 'x';
    case 'bidirectional':
      return '<' + '-'.repeat(len + 1) + '>';
    case 'dottedBidirectional':
      return '<-' + '.'.repeat(len) + '->';
    case 'thickBidirectional':
      return '<' + '='.repeat(len + 1) + '>';
    case 'circleBoth':
      return 'o' + '-'.repeat(len + 1) + 'o';
    case 'crossBoth':
      return 'x' + '-'.repeat(len + 1) + 'x';
    case 'invisible':
      return '~'.repeat(len + 2);
  }
}

export function formatLabel(label: string): string {
  let s = label.replace(/\r\n|\r|\n/g, '<br/>');
  s = s.replace(/#(?=[A-Za-z0-9]+;)/g, '#35;');
  if (/[()[\]{}"|;]/.test(s) || /^[/\\]|[/\\]$|^>|@{/.test(s)) {
    s = s.replace(/"/g, '#quot;');
    return `"${s}"`;
  }
  return s;
}

export function formatPipeLabel(label: string): string {
  let s = label.replace(/\r\n|\r|\n/g, '<br/>');
  s = s.replace(/#(?=[A-Za-z0-9]+;)/g, '#35;');
  if (/[|;]/.test(s)) {
    s = s.replace(/"/g, '#quot;');
    return `"${s}"`;
  }
  return s;
}
