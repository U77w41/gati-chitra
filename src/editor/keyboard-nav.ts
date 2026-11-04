import type { ParsedDoc, SceneLayout } from '../core/types';

export type Dir = 'up' | 'down' | 'left' | 'right';

export function nextNodeInDirection(
  layout: SceneLayout,
  order: string[],
  fromId: string | null,
  dir: Dir,
): string | null {
  if (!fromId) {
    return order[0] ?? null;
  }
  const fromBox = layout.nodes[fromId];
  if (!fromBox) {
    return order[0] ?? null;
  }

  let bestId: string | null = null;
  let bestScore = Infinity;

  for (const id of order) {
    if (id === fromId) continue;
    const toBox = layout.nodes[id];
    if (!toBox) continue;

    const vx = toBox.center.x - fromBox.center.x;
    const vy = toBox.center.y - fromBox.center.y;

    let inCone = false;
    let score = Infinity;

    switch (dir) {
      case 'right':
        inCone = vx > 0 && Math.abs(vy) <= vx;
        if (inCone) score = vx + 2 * Math.abs(vy);
        break;
      case 'left':
        inCone = vx < 0 && Math.abs(vy) <= -vx;
        if (inCone) score = -vx + 2 * Math.abs(vy);
        break;
      case 'down':
        inCone = vy > 0 && Math.abs(vx) <= vy;
        if (inCone) score = vy + 2 * Math.abs(vx);
        break;
      case 'up':
        inCone = vy < 0 && Math.abs(vx) <= -vy;
        if (inCone) score = -vy + 2 * Math.abs(vx);
        break;
    }

    if (inCone && score < bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return bestId ?? fromId;
}

export function edgeCycle(
  doc: ParsedDoc,
  nodeId: string,
  current: number | null,
  step: 1 | -1,
): number | null {
  const touching = doc.edges
    .filter((e) => e.kind !== 'invisible' && (e.from === nodeId || e.to === nodeId))
    .sort((a, b) => a.index - b.index);

  if (touching.length === 0) {
    return null;
  }

  if (current === null) {
    return step === 1 ? touching[0].index : touching[touching.length - 1].index;
  }

  const idx = touching.findIndex((e) => e.index === current);
  if (idx === -1) {
    return step === 1 ? touching[0].index : touching[touching.length - 1].index;
  }

  const nextPos = (idx + step + touching.length) % touching.length;
  return touching[nextPos].index;
}
