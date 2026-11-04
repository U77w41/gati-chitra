import { describe, expect, it, vi } from 'vitest';
import { setupFileLaunch, type LaunchFileHandle, type LaunchParams, type LaunchQueue } from './file-launch';

describe('setupFileLaunch', () => {
  it('does nothing when launchQueue is missing', () => {
    const open = vi.fn();
    setupFileLaunch({ open }, {});
    expect(open).not.toHaveBeenCalled();
  });

  it('sets consumer and opens file when launchQueue has files', async () => {
    let consumer: ((params: LaunchParams) => void) | null = null;
    const fakeWin: { launchQueue: LaunchQueue } = {
      launchQueue: {
        setConsumer: (fn: (params: LaunchParams) => void) => {
          consumer = fn;
        },
      },
    };

    const open = vi.fn();
    setupFileLaunch({ open }, fakeWin);
    expect(consumer).not.toBeNull();

    const mockFile: LaunchFileHandle = {
      getFile: async () => ({
        name: 'test.mmd',
        text: async () => '```mermaid\nflowchart TD\nA-->B\n```',
      }),
    };

    await consumer!({ files: [mockFile] });
    expect(open).toHaveBeenCalledWith('flowchart TD\nA-->B', 'test.mmd');
  });

  it('handles empty files list gracefully', async () => {
    let consumer: ((params: LaunchParams) => void) | null = null;
    const fakeWin: { launchQueue: LaunchQueue } = {
      launchQueue: {
        setConsumer: (fn: (params: LaunchParams) => void) => {
          consumer = fn;
        },
      },
    };

    const open = vi.fn();
    setupFileLaunch({ open }, fakeWin);
    await consumer!({ files: [] });
    expect(open).not.toHaveBeenCalled();
  });
});
