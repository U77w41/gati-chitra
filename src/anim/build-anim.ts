import { ANIM } from '../core/constants';
import type { AnimSettings, FrameState, Scene } from '../core/types';
import { computeDepths } from '../render/prepared';
import { animStages } from './stages';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function frameStateBuild(
  scene: Scene,
  _settings: AnimSettings,
  p: number,
): FrameState {
  const st = animStages(scene.doc);
  const stages = st.count;
  const stageDuration = 0.75 / stages;
  const titleChars = clamp(p / 0.05, 0, 1);
  const nodeAlpha: Record<string, number> = {};
  const nodeTextProgress: Record<string, number> = {};
  const edgeGrow: Record<string, number> = {};
  const edgeTextProgress: Record<string, number> = {};

  for (const node of scene.doc.nodes) {
    const d = st.node[node.id] ?? 0;
    const sStage = d * stageDuration;
    const eStage = (d + 1) * stageDuration;
    if (p < sStage) {
      nodeAlpha[node.id] = 0;
      nodeTextProgress[node.id] = 0;
    } else if (p >= eStage) {
      nodeAlpha[node.id] = 1;
      nodeTextProgress[node.id] = 1;
    } else {
      const localP = (p - sStage) / stageDuration;
      nodeAlpha[node.id] = clamp(localP / 0.45, 0, 1);
      nodeTextProgress[node.id] = clamp((localP - 0.20) / 0.50, 0, 1);
    }
  }

  for (const edge of scene.doc.edges) {
    const edgeStage = st.edge[edge.id] ?? 0;
    const sStage = edgeStage * stageDuration;
    const eStage = (edgeStage + 1) * stageDuration;
    const edgeStart = sStage + 0.45 * stageDuration;
    if (p < edgeStart) {
      edgeGrow[edge.id] = 0;
      edgeTextProgress[edge.id] = 0;
    } else if (p >= eStage) {
      edgeGrow[edge.id] = 1;
      edgeTextProgress[edge.id] = 1;
    } else {
      const localP = (p - sStage) / stageDuration;
      edgeGrow[edge.id] = clamp((localP - 0.45) / 0.45, 0, 1);
      edgeTextProgress[edge.id] = clamp((localP - 0.50) / 0.45, 0, 1);
    }
  }

  const dashOffset = 0 - (p % 1) * ANIM.dashCycles * 24;
  return {
    particles: [],
    dashOffset,
    nodeGlow: {},
    titleChars,
    nodeAlpha,
    nodeTextProgress,
    edgeGrow,
    edgeTextProgress,
  };
}

export function frameStateTypewriter(
  scene: Scene,
  _settings: AnimSettings,
  p: number,
): FrameState {
  if (scene.doc.stages) return frameStateBuild(scene, _settings, p);
  const depths = computeDepths(scene.doc);
  const sortedNodes = [...scene.doc.nodes].sort((a, b) => {
    const da = depths[a.id] ?? 0;
    const db = depths[b.id] ?? 0;
    if (da !== db) return da - db;
    return a.line - b.line;
  });

  const K = sortedNodes.length;
  if (K === 0) {
    return {
      particles: [],
      dashOffset: null,
      nodeGlow: {},
      titleChars: 1,
      nodeAlpha: {},
      nodeTextProgress: {},
      edgeGrow: {},
      edgeTextProgress: {},
    };
  }

  const titleChars = clamp(p / 0.06, 0, 1);
  const nodeAlpha: Record<string, number> = {};
  const nodeTextProgress: Record<string, number> = {};
  const edgeGrow: Record<string, number> = {};
  const edgeTextProgress: Record<string, number> = {};

  const nodeIndexMap = new Map<string, number>();
  sortedNodes.forEach((node, idx) => nodeIndexMap.set(node.id, idx));

  const sliceDuration = (0.78 - 0.06) / K;

  for (let k = 0; k < K; k++) {
    const node = sortedNodes[k];
    const sk = 0.06 + k * sliceDuration;
    const ek = sk + sliceDuration;
    if (p < sk) {
      nodeAlpha[node.id] = 0;
      nodeTextProgress[node.id] = 0;
    } else if (p >= ek) {
      nodeAlpha[node.id] = 1;
      nodeTextProgress[node.id] = 1;
    } else {
      const localP = (p - sk) / sliceDuration;
      nodeAlpha[node.id] = clamp(localP / 0.30, 0, 1);
      nodeTextProgress[node.id] = clamp((localP - 0.25) / 0.50, 0, 1);
    }
  }

  for (const edge of scene.doc.edges) {
    const k = nodeIndexMap.get(edge.from) ?? 0;
    const sk = 0.06 + k * sliceDuration;
    const ek = sk + sliceDuration;
    const edgeStart = sk + 0.65 * sliceDuration;
    const textStart = sk + 0.70 * sliceDuration;

    if (p < edgeStart) {
      edgeGrow[edge.id] = 0;
    } else if (p >= ek) {
      edgeGrow[edge.id] = 1;
    } else {
      const localP = (p - sk) / sliceDuration;
      edgeGrow[edge.id] = clamp((localP - 0.65) / 0.30, 0, 1);
    }

    if (p < textStart) {
      edgeTextProgress[edge.id] = 0;
    } else if (p >= ek) {
      edgeTextProgress[edge.id] = 1;
    } else {
      const localP = (p - sk) / sliceDuration;
      edgeTextProgress[edge.id] = clamp((localP - 0.70) / 0.30, 0, 1);
    }
  }

  const dashOffset = p >= 0.78 ? 0 - ((p - 0.78) / 0.22) * ANIM.dashCycles * 24 : null;

  return {
    particles: [],
    dashOffset,
    nodeGlow: {},
    titleChars,
    nodeAlpha,
    nodeTextProgress,
    edgeGrow,
    edgeTextProgress,
  };
}
