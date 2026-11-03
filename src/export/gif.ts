import { loopSeconds } from '../anim/anim';
import { EXPORT } from '../core/constants';
import type {
  AnimSettings,
  ExportMode,
  Rect,
  Scene,
  Theme,
  ViewState,
} from '../core/types';
import { exportFrame, fitToPixels } from '../render/frame';
import { drawExportFrame } from './draw-frame';

export interface GifOptions {
  mode: ExportMode;
  fps: number;
}

export interface GifPlan {
  frames: number;
  delayCs: number;
  width: number;
  height: number;
  zoom: number;
  reduced: boolean;
}

export function gifPlan(
  bounds: Rect,
  mode: ExportMode,
  anim: AnimSettings,
  fps: number,
): GifPlan {
  const frame = exportFrame(bounds, mode, 1);
  let width = frame.pixelWidth;
  let height = frame.pixelHeight;
  let zoom = frame.zoom;
  let reduced = false;

  if (width * height > EXPORT.gifMaxPixels) {
    const f = fitToPixels(width, height, EXPORT.gifMaxPixels);
    width = Math.floor(width * f);
    height = Math.floor(height * f);
    zoom = zoom * f;
    reduced = true;
  }

  const loop = loopSeconds(anim);
  const frames = Math.max(
    1,
    Math.min(EXPORT.gifMaxFrames, Math.round(loop * fps)),
  );
  const delayCs = Math.max(2, Math.round((loop * 100) / frames));

  return { frames, delayCs, width, height, zoom, reduced };
}

export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(0);
  });
}

export async function exportGif(
  scene: Scene,
  theme: Theme,
  anim: AnimSettings,
  opts: GifOptions,
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal,
): Promise<{ blob: Blob; reduced: boolean }> {
  const bounds = scene.layout.bounds;
  const plan = gifPlan(bounds, opts.mode, anim, opts.fps);
  const baseFrame = exportFrame(bounds, opts.mode, 1);

  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context');
  }

  const view: ViewState = {
    zoom: plan.zoom,
    panX: -baseFrame.world.x * plan.zoom,
    panY: -baseFrame.world.y * plan.zoom,
  };

  const sampleIndices = Array.from(
    new Set([
      0,
      Math.floor(plan.frames / 4),
      Math.floor(plan.frames / 2),
      Math.floor((3 * plan.frames) / 4),
    ]),
  );

  const byteChunks: Uint8ClampedArray[] = [];
  for (const sIdx of sampleIndices) {
    const phase = sIdx / plan.frames;
    drawExportFrame(ctx, scene, theme, anim, view, phase, plan.width, plan.height);
    byteChunks.push(ctx.getImageData(0, 0, plan.width, plan.height).data);
  }

  const totalLength = byteChunks.reduce((acc, c) => acc + c.length, 0);
  const allRgba = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of byteChunks) {
    allRgba.set(chunk, offset);
    offset += chunk.length;
  }

  const { applyPalette, GIFEncoder, quantize } = await import('gifenc');
  const palette = quantize(allRgba, 256);
  const encoder = GIFEncoder();

  for (let i = 0; i < plan.frames; i++) {
    if (signal.aborted) {
      throw new DOMException('Cancelled', 'AbortError');
    }

    const phase = i / plan.frames;
    drawExportFrame(ctx, scene, theme, anim, view, phase, plan.width, plan.height);
    const rgba = ctx.getImageData(0, 0, plan.width, plan.height).data;
    const index = applyPalette(rgba, palette);

    encoder.writeFrame(index, plan.width, plan.height, {
      palette: i === 0 ? palette : undefined,
      delay: plan.delayCs * 10,
      repeat: 0,
    });

    onProgress(i + 1, plan.frames);
    await yieldToEventLoop();

    if (signal.aborted) {
      throw new DOMException('Cancelled', 'AbortError');
    }
  }

  encoder.finish();
  const blob = new Blob([encoder.bytes() as BlobPart], { type: 'image/gif' });
  return { blob, reduced: plan.reduced };
}
