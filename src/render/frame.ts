import { EXPORT } from '../core/constants';
import type { ExportFrame, ExportMode, Rect, ViewState } from '../core/types';

export function isEmptyBounds(b: Rect): boolean {
  return b.width === 0 && b.height === 0;
}

export function exportFrame(
  bounds: Rect,
  mode: ExportMode,
  scale: number,
): ExportFrame {
  const m = EXPORT.margin;
  if (mode === 'content') {
    const world: Rect = {
      x: bounds.x - m,
      y: bounds.y - m,
      width: bounds.width + 2 * m,
      height: bounds.height + 2 * m,
    };
    const zoom = scale;
    const pixelWidth = Math.ceil(world.width * scale);
    const pixelHeight = Math.ceil(world.height * scale);
    return { world, pixelWidth, pixelHeight, zoom };
  }

  const { slideWidth, slideHeight } = EXPORT;
  const zoom0 = Math.min(
    slideWidth / (bounds.width + 2 * m),
    slideHeight / (bounds.height + 2 * m),
  );
  const zoom = zoom0 * scale;
  const pixelWidth = slideWidth * scale;
  const pixelHeight = slideHeight * scale;
  const worldWidth = slideWidth / zoom0;
  const worldHeight = slideHeight / zoom0;
  const world: Rect = {
    x: bounds.x + bounds.width / 2 - worldWidth / 2,
    y: bounds.y + bounds.height / 2 - worldHeight / 2,
    width: worldWidth,
    height: worldHeight,
  };
  return { world, pixelWidth, pixelHeight, zoom };
}

export function viewForFrame(frame: ExportFrame): ViewState {
  return {
    zoom: frame.zoom,
    panX: -frame.world.x * frame.zoom,
    panY: -frame.world.y * frame.zoom,
  };
}

export function fitToPixels(
  width: number,
  height: number,
  maxPixels: number,
): number {
  if (width * height <= maxPixels) return 1;
  return Math.sqrt(maxPixels / (width * height));
}

export function chooseScale(
  bounds: Rect,
  mode: ExportMode,
  requested: number,
): { scale: number; reduced: boolean } {
  for (let s = requested; s >= 1; s--) {
    const frame = exportFrame(bounds, mode, s);
    if (
      Math.max(frame.pixelWidth, frame.pixelHeight) <= EXPORT.pngMaxSide &&
      frame.pixelWidth * frame.pixelHeight <= EXPORT.pngMaxPixels
    ) {
      return { scale: s, reduced: s !== requested };
    }
  }

  const frame1 = exportFrame(bounds, mode, 1);
  const pw = frame1.pixelWidth;
  const ph = frame1.pixelHeight;
  const f = Math.min(
    EXPORT.pngMaxSide / Math.max(pw, ph),
    Math.sqrt(EXPORT.pngMaxPixels / (pw * ph)),
  );
  return { scale: Math.floor(f * 100) / 100, reduced: true };
}
