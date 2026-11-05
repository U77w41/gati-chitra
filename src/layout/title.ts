import { LAYOUT } from '../core/constants';
import type { Rect, SceneLayout } from '../core/types';
import type { MeasureText } from './measure';

export function placeTitle(
  bounds: Rect,
  title: string | null,
  measure: MeasureText,
): { bounds: Rect; title: SceneLayout['title'] } {
  if (!title) {
    return { bounds, title: null };
  }
  const b = { ...bounds };
  const titleObj = {
    text: title,
    center: { x: b.x + b.width / 2, y: b.y - LAYOUT.titleH / 2 },
  };
  const tW = measure(title, LAYOUT.titleFontSize);
  if (tW > b.width) {
    b.x -= (tW - b.width) / 2;
    b.width = tW;
  }
  b.y -= LAYOUT.titleH;
  b.height += LAYOUT.titleH;
  return { bounds: b, title: titleObj };
}
