import type { Direction, GraphNode, MeasureText, NodeBox, Point } from '../core/types';
import { sizeNode } from './measure';

export function boxFor(
  node: GraphNode,
  measure: MeasureText,
  direction: Direction,
  center: Point,
  override?: { width?: number; height?: number },
): NodeBox {
  const sized = sizeNode(node, measure, direction);
  const width = override?.width ?? sized.width;
  const height = override?.height ?? sized.height;
  return {
    id: node.id,
    center,
    width,
    height,
    lines: sized.lines,
    ...(sized.runs ? { runs: sized.runs } : {}),
    ...(sized.sections ? { sections: sized.sections } : {}),
    ...(node.arrowDir ? { arrowDir: node.arrowDir } : {}),
  };
}
