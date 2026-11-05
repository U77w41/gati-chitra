import type { Decoration, Rect } from '../core/types';

export function growBounds(bounds: Rect, decorations?: Decoration[]): Rect {
  if (!decorations || decorations.length === 0) return bounds;

  let minX = bounds.x;
  let minY = bounds.y;
  let maxX = bounds.x + bounds.width;
  let maxY = bounds.y + bounds.height;

  for (const d of decorations) {
    if (d.kind === 'line') {
      minX = Math.min(minX, d.from.x, d.to.x);
      maxX = Math.max(maxX, d.from.x, d.to.x);
      minY = Math.min(minY, d.from.y, d.to.y);
      maxY = Math.max(maxY, d.from.y, d.to.y);
    } else if (d.kind === 'rect') {
      minX = Math.min(minX, d.rect.x);
      maxX = Math.max(maxX, d.rect.x + d.rect.width);
      minY = Math.min(minY, d.rect.y);
      maxY = Math.max(maxY, d.rect.y + d.rect.height);
    } else if (d.kind === 'text') {
      const sz = d.size ?? 12;
      const halfW = (d.text.length * sz * 0.6) / 2;
      minX = Math.min(minX, d.at.x - halfW);
      maxX = Math.max(maxX, d.at.x + halfW);
      minY = Math.min(minY, d.at.y - sz);
      maxY = Math.max(maxY, d.at.y + sz);
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
