import { ANIM, EDGE_ANIM } from '../core/constants';
import type {
  AnimSettings,
  FrameState,
  GraphEdge,
  ParsedDoc,
  Particle,
  Scene,
} from '../core/types';
import { hash32 } from './hash';
import { computeDepths } from '../render/prepared';
import { frameStateBuild, frameStateTypewriter } from './build-anim';
import { animStages } from './stages';

export { computeDepths };

export const DEFAULT_ANIM: AnimSettings = {
  style: 'pulse',
  speed: 1,
  density: 4,
  glow: false,
};

export function loopSeconds(settings: AnimSettings): number {
  return ANIM.loopSecondsBase / settings.speed;
}

export function phaseAt(elapsedSeconds: number, settings: AnimSettings): number {
  const ls = loopSeconds(settings);
  const raw = (elapsedSeconds / ls) % 1;
  const val = raw < 0 ? raw + 1 : Object.is(raw, -0) ? 0 : raw;
  return val === 1 ? 0 : val;
}

export function edgeSpeedFactor(edge: GraphEdge, doc: ParsedDoc): number {
  if (edge.kind === 'invisible') return 0;
  if (doc.explicitEdgeAnimation && edge.anim.animate !== true) return 0;
  if (edge.anim.speed === 'fast') return EDGE_ANIM.fastFactor;
  if (edge.anim.speed === 'slow') return EDGE_ANIM.slowFactor;
  return 1;
}

export function frameState(
  scene: Scene,
  settings: AnimSettings,
  phase: number,
): FrameState {
  let p = ((phase % 1) + 1) % 1;
  if (p === 1) p = 0;

  if (settings.style === 'off') {
    return { particles: [], dashOffset: null, nodeGlow: {} };
  }

  if (settings.style === 'build') {
    return frameStateBuild(scene, settings, p);
  }

  if (settings.style === 'typewriter') {
    return frameStateTypewriter(scene, settings, p);
  }

  const validEdges = scene.doc.edges.filter(
    (e) => scene.layout.edges[e.id] && edgeSpeedFactor(e, scene.doc) > 0,
  );
  if (validEdges.length === 0) {
    return { particles: [], dashOffset: null, nodeGlow: {} };
  }

  if (settings.style === 'dash') {
    const dashOffset =
      0 - p * ANIM.dashCycles * (ANIM.dashPattern[0] + ANIM.dashPattern[1]);
    return { particles: [], dashOffset, nodeGlow: {} };
  }

  const particles: Particle[] = [];

  if (settings.style === 'pulse') {
    const edgeStages = animStages(scene.doc).edge;
    let maxD = 0;
    for (const edge of validEdges) {
      const d = edgeStages[edge.id] ?? 0;
      if (d > maxD) maxD = d;
    }
    const slots = maxD + 1;

    for (const edge of validEdges) {
      const factor = edgeSpeedFactor(edge, scene.doc);
      let edgeP = ((p * factor) % 1 + 1) % 1;
      if (edgeP === 1) edgeP = 0;
      const d = edgeStages[edge.id] ?? 0;
      const start = d / slots;
      const end = (d + 1) / slots;
      if (edgeP >= start && edgeP < end) {
        const u = (edgeP - start) * slots;
        particles.push({ edgeId: edge.id, u, alpha: 1 });
      }
    }
  } else if (settings.style === 'traffic') {
    const rawK: number[] = [];
    let sumK = 0;

    for (const edge of validEdges) {
      const path = scene.layout.edges[edge.id];
      const spacing = ANIM.spacingBase / settings.density;
      const k = Math.max(
        1,
        Math.min(ANIM.maxParticlesPerEdge, Math.round(path.length / spacing)),
      );
      rawK.push(k);
      sumK += k;
    }

    if (sumK > ANIM.maxParticlesTotal) {
      for (let i = 0; i < rawK.length; i++) {
        rawK[i] = Math.max(
          1,
          Math.floor((rawK[i] * ANIM.maxParticlesTotal) / sumK),
        );
      }
    }

    for (let idx = 0; idx < validEdges.length; idx++) {
      const edge = validEdges[idx];
      const factor = edgeSpeedFactor(edge, scene.doc);
      let edgeP = ((p * factor) % 1 + 1) % 1;
      if (edgeP === 1) edgeP = 0;
      const k = rawK[idx];
      const offset = (hash32(edge.id) % 1000) / 1000;
      const fade = ANIM.particleFade;

      for (let i = 0; i < k; i++) {
        const x = edgeP + i / k + offset;
        const u = x - Math.floor(x);
        const alpha = Math.max(0, Math.min(1, u / fade, (1 - u) / fade));
        particles.push({ edgeId: edge.id, u, alpha });
      }
    }
  }

  const nodeGlow: Record<string, number> = {};
  if (
    settings.glow &&
    (settings.style === 'pulse' || settings.style === 'traffic')
  ) {
    const glowWindow = ANIM.glowWindow;
    const edgeMap = new Map<string, (typeof scene.doc.edges)[0]>();
    for (const e of scene.doc.edges) edgeMap.set(e.id, e);

    for (const particle of particles) {
      const edge = edgeMap.get(particle.edgeId);
      if (!edge) continue;
      const bump =
        particle.u >= 1 - glowWindow
          ? (particle.u - (1 - glowWindow)) / glowWindow
          : 0;
      const val = bump * particle.alpha;
      if (val > 0) {
        nodeGlow[edge.to] = Math.max(nodeGlow[edge.to] ?? 0, val);
      }
    }
  }

  return { particles, dashOffset: null, nodeGlow };
}
