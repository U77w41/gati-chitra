import type { EdgeKind, ShapeKind } from '../core/types';

export function shapeTokens(shape: ShapeKind): { open: string; close: string } {
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
  }
}

export function edgeOperatorText(kind: EdgeKind): string {
  switch (kind) {
    case 'arrow':
      return '-->';
    case 'open':
      return '---';
    case 'dottedArrow':
      return '-.->';
    case 'dotted':
      return '-.-';
    case 'thickArrow':
      return '==>';
    case 'thick':
      return '===';
    case 'circleEnd':
      return '--o';
    case 'crossEnd':
      return '--x';
    case 'bidirectional':
      return '<-->';
  }
}

export function formatLabel(label: string): string {
  let s = label.replace(/\r\n|\r|\n/g, '<br/>');
  if (/[()[\]{}"|;]/.test(s)) {
    s = s.replace(/"/g, '#quot;');
    return `"${s}"`;
  }
  return s;
}

export function formatPipeLabel(label: string): string {
  return label.replace(/\|/g, '/').replace(/\r\n|\r|\n/g, '<br/>');
}
