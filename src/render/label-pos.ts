import { LAYOUT } from '../core/constants';
import type { GraphNode, NodeBox, Point } from '../core/types';

export function labelCenter(node: GraphNode, box: NodeBox): Point {
  const cx = box.center.x;
  const cy = box.center.y;
  const top = cy - box.height / 2;
  const n = box.lines.length;

  if (node.shape === ('actor' as string)) {
    return {
      x: cx,
      y: top + LAYOUT.actorFigureH + (n * LAYOUT.lineHeight) / 2,
    };
  }

  if (node.icon && n > 0) {
    return {
      x: cx,
      y: top + LAYOUT.nodePadY + LAYOUT.iconSize + LAYOUT.iconGap + (n * LAYOUT.lineHeight) / 2,
    };
  }

  return box.center;
}
