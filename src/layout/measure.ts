import { FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { Direction, GraphNode } from '../core/types';

export type MeasureText = (text: string, fontSize: number) => number;

export function wrapLabel(label: string, maxWidth: number, measure: MeasureText): string[] {
  const paragraphs = label.split('\n');
  const result: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      result.push('');
      continue;
    }

    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current === '' || measure(candidate, LAYOUT.fontSize) <= maxWidth) {
        current = candidate;
      } else {
        result.push(current);
        current = word;
      }
    }
    if (current !== '') {
      result.push(current);
    }
  }

  return result;
}

export function sizeNode(
  node: GraphNode,
  measure: MeasureText,
  direction: Direction = 'TB',
): { width: number; height: number; lines: string[] } {
  if (node.shape === 'smallCircle' || node.shape === 'filledCircle') {
    return { width: LAYOUT.smallCircleD, height: LAYOUT.smallCircleD, lines: [] };
  }
  if (node.shape === 'forkBar') {
    const isVertical = direction === 'TB' || direction === 'BT';
    return {
      width: isVertical ? LAYOUT.forkBarW : LAYOUT.forkBarH,
      height: isVertical ? LAYOUT.forkBarH : LAYOUT.forkBarW,
      lines: [],
    };
  }

  const lines = wrapLabel(node.label, LAYOUT.labelWrapWidth, measure);
  let textW = 0;
  for (const line of lines) {
    const w = measure(line, LAYOUT.fontSize);
    if (w > textW) textW = w;
  }

  let width = Math.max(LAYOUT.minNodeW, textW + 2 * LAYOUT.nodePadX);
  let height = Math.max(LAYOUT.minNodeH, lines.length * LAYOUT.lineHeight + 2 * LAYOUT.nodePadY);

  switch (node.shape) {
    case 'diamond':
      width *= LAYOUT.diamondScale;
      height *= LAYOUT.diamondScale;
      break;
    case 'hexagon':
      width += LAYOUT.hexagonExtraW;
      break;
    case 'parallelogram':
    case 'parallelogramAlt':
      width += LAYOUT.parallelogramExtraW;
      break;
    case 'cylinder':
      height += LAYOUT.cylinderExtraH;
      break;
    case 'circle': {
      const d = Math.max(width, height) + LAYOUT.circleExtra;
      width = d;
      height = d;
      break;
    }
    case 'doubleCircle':
    case 'framedCircle': {
      const d = Math.max(width, height) + LAYOUT.circleExtra + 2 * LAYOUT.doubleCircleGap;
      width = d;
      height = d;
      break;
    }
    case 'trapezoid':
    case 'trapezoidAlt':
      width += 2 * LAYOUT.trapezoidInset;
      break;
    case 'asymmetric':
      width += LAYOUT.asymmetricNotch;
      break;
    case 'document':
      height += LAYOUT.documentWave;
      break;
    default:
      break;
  }

  return {
    width: Math.ceil(width),
    height: Math.ceil(height),
    lines,
  };
}

export function canvasMeasure(): MeasureText {
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(256, 256);
    ctx = canvas.getContext('2d');
  } else if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
  }

  return (text: string, fontSize: number): number => {
    if (ctx) {
      ctx.font = `${fontSize}px ${FONT_STACK_SANS}`;
      return ctx.measureText(text).width;
    }
    return text.length * 8;
  };
}
