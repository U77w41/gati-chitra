import { VIEW } from '../core/constants';
import type { Point, Rect, ViewState } from '../core/types';

export function fitView(
  bounds: Rect,
  viewport: { width: number; height: number },
  margin?: number,
): ViewState {
  if (bounds.width === 0 && bounds.height === 0) {
    return {
      zoom: 1,
      panX: viewport.width / 2,
      panY: viewport.height / 2,
    };
  }

  const m = margin ?? VIEW.fitMargin;
  const vw = viewport.width;
  const vh = viewport.height;
  const bw = bounds.width;
  const bh = bounds.height;
  const bx = bounds.x;
  const by = bounds.y;

  const rawZoom = Math.min((vw - 2 * m) / bw, (vh - 2 * m) / bh);
  const zoom = Math.max(VIEW.zoomMin, Math.min(VIEW.zoomMax, rawZoom));

  const panX = (vw - bw * zoom) / 2 - bx * zoom;
  const panY = (vh - bh * zoom) / 2 - by * zoom;

  return { zoom, panX, panY };
}

export function screenToWorld(view: ViewState, p: Point): Point {
  return {
    x: (p.x - view.panX) / view.zoom,
    y: (p.y - view.panY) / view.zoom,
  };
}

export function worldToScreen(view: ViewState, p: Point): Point {
  return {
    x: p.x * view.zoom + view.panX,
    y: p.y * view.zoom + view.panY,
  };
}

export function zoomAt(
  view: ViewState,
  screenPoint: Point,
  factor: number,
): ViewState {
  const newZoom = Math.max(
    VIEW.zoomMin,
    Math.min(VIEW.zoomMax, view.zoom * factor),
  );
  const real = newZoom / view.zoom;
  const panX = screenPoint.x - (screenPoint.x - view.panX) * real;
  const panY = screenPoint.y - (screenPoint.y - view.panY) * real;

  return { zoom: newZoom, panX, panY };
}

export function panBy(view: ViewState, dx: number, dy: number): ViewState {
  return {
    zoom: view.zoom,
    panX: view.panX + dx,
    panY: view.panY + dy,
  };
}

export function wheelFactor(deltaY: number, deltaMode: number): number {
  const delta =
    deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1);
  return Math.exp(-delta * VIEW.wheelSensitivity);
}
