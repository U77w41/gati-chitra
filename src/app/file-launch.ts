import { stripFences } from '../mermaid/fences';

export interface FileLaunchEnv {
  open(text: string, name: string): void;
}

export interface LaunchFileHandle {
  getFile(): Promise<{ name: string; text(): Promise<string> }>;
}

export interface LaunchParams {
  files: readonly LaunchFileHandle[];
}

export interface LaunchQueue {
  setConsumer(consumer: (params: LaunchParams) => void): void;
}

declare global {
  interface Window {
    launchQueue?: LaunchQueue;
  }
}

export function setupFileLaunch(
  env: FileLaunchEnv,
  win: { launchQueue?: LaunchQueue } | undefined = typeof window !== 'undefined' ? window : undefined,
): void {
  if (!win || !('launchQueue' in win) || !win.launchQueue) {
    return;
  }
  win.launchQueue.setConsumer(async (params) => {
    if (!params.files || params.files.length === 0) return;
    const handle = params.files[0];
    try {
      const file = await handle.getFile();
      const text = await file.text();
      env.open(stripFences(text), file.name);
    } catch {
      // Ignored if file cannot be read
    }
  });
}
