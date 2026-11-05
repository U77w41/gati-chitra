export interface AnimClock {
  elapsed(): number;
  pause(): void;
  resume(): void;
}

// Time spent paused is left out of elapsed(), so Play continues from the paused frame.
// Build and typewriter depend on this: skipping ahead jumps to a different stage of the build.

export function createAnimClock(now: () => number): AnimClock {
  const start = now();
  let pausedTotal = 0;
  let pausedAt: number | null = null;

  return {
    elapsed() {
      const t = pausedAt ?? now();
      return (t - start - pausedTotal) / 1000;
    },
    pause() {
      if (pausedAt === null) pausedAt = now();
    },
    resume() {
      if (pausedAt === null) return;
      pausedTotal += now() - pausedAt;
      pausedAt = null;
    },
  };
}
