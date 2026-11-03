import type { ExportMode, Scene, Theme } from '../core/types';
import { drawBackground, drawScene, emptyFrame } from '../render/draw';
import { chooseScale, exportFrame, viewForFrame } from '../render/frame';

export interface PngOptions {
  mode: ExportMode;
  scale: number;
  transparent: boolean;
}

export async function exportPng(
  scene: Scene,
  theme: Theme,
  opts: PngOptions,
): Promise<{ blob: Blob; scaleUsed: number; reduced: boolean }> {
  const bounds = scene.layout.bounds;
  const { scale, reduced } = chooseScale(bounds, opts.mode, opts.scale);
  const frame = exportFrame(bounds, opts.mode, scale);

  const canvas = document.createElement('canvas');
  canvas.width = frame.pixelWidth;
  canvas.height = frame.pixelHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('PNG encoding failed');

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBackground(ctx, theme, canvas.width, canvas.height, opts.transparent);
  drawScene(ctx, scene, theme, viewForFrame(frame), emptyFrame(), {
    transparent: opts.transparent,
    selection: null,
    handleNodeId: null,
    connectPreview: null,
    focus: null,
    showGlow: false,
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('PNG encoding failed');

  return { blob, scaleUsed: scale, reduced };
}
