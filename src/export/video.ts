import { EXPORT } from '../core/constants';
import type {
  AnimSettings,
  ExportMode,
  Rect,
  Scene,
  Theme,
  ViewState,
} from '../core/types';
import { loopSeconds } from '../anim/anim';
import { exportFrame, fitToPixels } from '../render/frame';
import { yieldToEventLoop } from './gif';
import { drawExportFrame } from './draw-frame';

export interface VideoOptions {
  mode: ExportMode;
  loops: number;
}

export interface VideoPlan {
  width: number;
  height: number;
  totalFrames: number;
  fps: number;
  seconds: number;
  loopsUsed: number;
  reduced: boolean;
}

export interface EncoderSupport {
  codec: 'avc' | 'vp9';
  container: 'mp4' | 'webm';
}

export function videoPlan(
  bounds: Rect,
  mode: ExportMode,
  anim: AnimSettings,
  loops: number,
): VideoPlan {
  const frame = exportFrame(bounds, mode, 1);
  let width = frame.pixelWidth;
  let height = frame.pixelHeight;
  let reduced = false;

  if (width * height > EXPORT.videoMaxPixels) {
    const s = fitToPixels(width, height, EXPORT.videoMaxPixels);
    width = Math.floor(width * s);
    height = Math.floor(height * s);
    reduced = true;
  }

  const maxSide = Math.max(width, height);
  if (maxSide > 8192) {
    const s = 8192 / maxSide;
    width = Math.floor(width * s);
    height = Math.floor(height * s);
    reduced = true;
  }

  width -= width % 2;
  height -= height % 2;
  width = Math.max(2, width);
  height = Math.max(2, height);

  const fps = EXPORT.videoFps;
  const loopSec = loopSeconds(anim);
  let loopsUsed = loops;
  while (loopSec * loopsUsed > EXPORT.videoMaxSeconds && loopsUsed > 1) {
    loopsUsed--;
  }

  const seconds = loopSec * loopsUsed;
  const totalFrames = Math.round(seconds * fps);

  return {
    width,
    height,
    totalFrames,
    fps,
    seconds,
    loopsUsed,
    reduced,
  };
}

export function videoBitrate(width: number, height: number, fps: number): number {
  return Math.min(
    8_000_000,
    Math.max(1_000_000, Math.round(width * height * fps * 0.1)),
  );
}

async function canEncodeCodec(config: VideoEncoderConfig): Promise<boolean> {
  if (typeof VideoEncoder === 'undefined') return true;
  if (typeof VideoFrame === 'undefined' || typeof document === 'undefined') {
    try {
      const enc = new VideoEncoder({ output: () => {}, error: () => {} });
      enc.configure(config);
      enc.close();
      return true;
    } catch {
      return false;
    }
  }
  return new Promise((resolve) => {
    try {
      const enc = new VideoEncoder({ output: () => {}, error: () => resolve(false) });
      enc.configure(config);
      const c = document.createElement('canvas');
      c.width = 2; c.height = 2;
      const f = new VideoFrame(c, { timestamp: 0 });
      enc.encode(f);
      f.close();
      enc.flush().then(() => { enc.close(); resolve(true); }, () => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

export async function probeEncoder(
  width: number,
  height: number,
  isConfigSupported?: (c: VideoEncoderConfig) => Promise<{ supported?: boolean }>,
): Promise<EncoderSupport | null> {
  if (typeof VideoEncoder === 'undefined' && !isConfigSupported) {
    return null;
  }

  const checkFn =
    isConfigSupported ?? ((c: VideoEncoderConfig) => VideoEncoder.isConfigSupported(c));

  const h264Codecs = ['avc1.640028', 'avc1.4d0028', 'avc1.42001f'];
  for (const codec of h264Codecs) {
    try {
      const cfg: VideoEncoderConfig = {
        codec,
        width,
        height,
        bitrate: videoBitrate(width, height, 30),
        framerate: 30,
      };
      const res = await checkFn(cfg);
      if (res?.supported === true && (await canEncodeCodec(cfg))) {
        return { codec: 'avc', container: 'mp4' };
      }
    } catch {
      // treat errors as not supported
    }
  }

  try {
    const vp9Cfg: VideoEncoderConfig = {
      codec: 'vp09.00.40.08',
      width,
      height,
      bitrate: videoBitrate(width, height, 30),
      framerate: 30,
    };
    const res = await checkFn(vp9Cfg);
    if (res?.supported === true && (await canEncodeCodec(vp9Cfg))) {
      return { codec: 'vp9', container: 'webm' };
    }
  } catch {
    // treat errors as not supported
  }

  return null;
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new DOMException('Cancelled', 'AbortError'));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (res) => {
        signal.removeEventListener('abort', onAbort);
        resolve(res);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}

export async function exportVideo(
  scene: Scene,
  theme: Theme,
  anim: AnimSettings,
  opts: VideoOptions,
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal,
): Promise<{ blob: Blob; container: 'mp4' | 'webm' } | { fallback: 'gif' }> {
  const plan = videoPlan(scene.layout.bounds, opts.mode, anim, opts.loops);
  const support = await abortable(probeEncoder(plan.width, plan.height), signal);
  if (!support) {
    return { fallback: 'gif' };
  }

  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const baseFrame = exportFrame(scene.layout.bounds, opts.mode, 1);
  const zoom = plan.width / baseFrame.pixelWidth;
  const view: ViewState = {
    zoom,
    panX: -baseFrame.world.x * zoom,
    panY: -baseFrame.world.y * zoom,
  };

  if (signal.aborted) {
    throw new DOMException('Cancelled', 'AbortError');
  }
  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, WebMOutputFormat } =
    await import('mediabunny');
  if (signal.aborted) {
    throw new DOMException('Cancelled', 'AbortError');
  }
  const target = new BufferTarget();
  const output = new Output({
    format:
      support.container === 'mp4'
        ? new Mp4OutputFormat()
        : new WebMOutputFormat(),
    target,
  });

  const source = new CanvasSource(canvas, {
    codec: support.codec,
    bitrate: videoBitrate(plan.width, plan.height, plan.fps),
  });
  output.addVideoTrack(source, { frameRate: plan.fps });
  try {
    await abortable(output.start(), signal);
  } catch (err: unknown) {
    if (signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('not supported') ||
      (err instanceof Error && err.name === 'NotSupportedError')
    ) {
      return { fallback: 'gif' };
    }
    throw err;
  }

  const loopSec = loopSeconds(anim);
  for (let i = 0; i < plan.totalFrames; i++) {
    if (signal.aborted) {
      throw new DOMException('Cancelled', 'AbortError');
    }
    const phase = ((i / plan.fps) / loopSec) % 1;
    drawExportFrame(
      ctx,
      scene,
      theme,
      anim,
      view,
      phase,
      plan.width,
      plan.height,
    );
    await abortable(source.add(i / plan.fps, 1 / plan.fps), signal);
    onProgress(i + 1, plan.totalFrames);
    await yieldToEventLoop();
  }

  await abortable(output.finalize(), signal);
  const buffer = target.buffer;
  if (!buffer) {
    throw new Error('Failed to produce video buffer');
  }
  const blob = new Blob([buffer], {
    type: support.container === 'mp4' ? 'video/mp4' : 'video/webm',
  });
  return { blob, container: support.container };
}
