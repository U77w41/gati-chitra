import type { EdgePath, Point } from '../core/types';
import { pointOnPath } from './geometry';

export function makeEdgePath(
  id: string,
  from: Point,
  to: Point,
  control: Point | null,
  labelPoint?: Point,
): EdgePath {
  const kind = control ? 'quad' : 'straight';
  const path: EdgePath = {
    id,
    kind,
    from,
    to,
    control,
    labelPoint: labelPoint ?? { x: 0, y: 0 },
    length: 0,
  };

  if (!labelPoint) {
    path.labelPoint = pointOnPath(path, 0.5);
  }

  if (!control) {
    path.length = Math.hypot(to.x - from.x, to.y - from.y);
  } else {
    let len = 0;
    let prev = from;
    for (let i = 1; i <= 16; i++) {
      const curr = pointOnPath(path, i / 16);
      len += Math.hypot(curr.x - prev.x, curr.y - prev.y);
      prev = curr;
    }
    path.length = len;
  }

  return path;
}
