import type { Theme, ViewState } from '../core/types';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  view: ViewState,
  viewportWidth: number,
  viewportHeight: number,
): void {
  let step = 24;
  let scaledStep = step * view.zoom;

  while (scaledStep < 12) {
    step *= 2;
    scaledStep = step * view.zoom;
  }
  while (scaledStep > 96) {
    step /= 2;
    scaledStep = step * view.zoom;
  }

  const offsetX = ((view.panX % scaledStep) + scaledStep) % scaledStep;
  const offsetY = ((view.panY % scaledStep) + scaledStep) % scaledStep;

  ctx.save();
  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = offsetX; x <= viewportWidth; x += scaledStep) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewportHeight);
  }
  for (let y = offsetY; y <= viewportHeight; y += scaledStep) {
    ctx.moveTo(0, y);
    ctx.lineTo(viewportWidth, y);
  }

  ctx.stroke();
  ctx.restore();
}
