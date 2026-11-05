import { FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { Direction, FontStyle, GraphNode, MeasureText, SectionBox, TextRun } from '../core/types';
import { parseInlineMarkdown, wrapRuns } from './rich-text';
import { sizeSections } from './sections';

export type { MeasureText };

export function fontString(fontSize: number, style?: FontStyle): string {
  const parts: string[] = [];
  if (style?.italic) parts.push('italic');
  if (style?.bold) parts.push('bold');
  parts.push(`${fontSize}px`, FONT_STACK_SANS);
  return parts.join(' ');
}

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
): { width: number; height: number; lines: string[]; runs?: TextRun[][]; sections?: SectionBox[] } {
  if (node.size) {
    return {
      width: node.size.width,
      height: node.size.height,
      lines: node.label ? wrapLabel(node.label, LAYOUT.labelWrapWidth, measure) : [],
    };
  }
  if (node.sections) {
    return {
      ...sizeSections(node.sections, measure),
      lines: [],
    };
  }

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

  let lines: string[];
  let runs: TextRun[][] | undefined;
  let textW = 0;

  if (node.markdown) {
    const parsedRuns = parseInlineMarkdown(node.label);
    runs = wrapRuns(parsedRuns, LAYOUT.labelWrapWidth, LAYOUT.fontSize, measure);
    lines = runs.map((line) => line.map((r) => r.text).join(''));
    for (const line of runs) {
      let w = 0;
      for (const r of line) {
        w += measure(r.text, LAYOUT.fontSize, { bold: r.bold, italic: r.italic });
      }
      if (w > textW) textW = w;
    }
  } else {
    lines = wrapLabel(node.label, LAYOUT.labelWrapWidth, measure);
    for (const line of lines) {
      const w = measure(line, LAYOUT.fontSize);
      if (w > textW) textW = w;
    }
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

  if (node.icon) {
    height += LAYOUT.iconSize + LAYOUT.iconGap;
    width = Math.max(width, LAYOUT.iconSize + 2 * LAYOUT.nodePadX);
  }

  return {
    width: Math.ceil(width),
    height: Math.ceil(height),
    lines,
    ...(runs ? { runs } : {}),
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

  return (text: string, fontSize: number, style?: FontStyle): number => {
    if (ctx) {
      ctx.font = fontString(fontSize, style);
      return ctx.measureText(text).width;
    }
    return text.length * 8;
  };
}
