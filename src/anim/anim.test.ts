import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import {
  DEFAULT_ANIM,
  computeDepths,
  edgeSpeedFactor,
  frameState,
  loopSeconds,
  phaseAt,
} from './anim';
import type { AnimStyle, ParsedDoc } from '../core/types';

function scene(docOrText: string | ParsedDoc) {
  const doc = typeof docOrText === 'string' ? parseMermaid(docOrText) : docOrText;
  return buildScene(doc, testMeasure);
}

describe('anim', () => {
  it('calculates loopSeconds and phaseAt correctly', () => {
    expect(loopSeconds({ ...DEFAULT_ANIM, speed: 1 })).toBe(4);
    expect(loopSeconds({ ...DEFAULT_ANIM, speed: 2 })).toBe(2);
    expect(loopSeconds({ ...DEFAULT_ANIM, speed: 0.5 })).toBe(8);

    expect(phaseAt(5, DEFAULT_ANIM)).toBeCloseTo(0.25);
    expect(phaseAt(4, DEFAULT_ANIM)).toBe(0);
    expect(phaseAt(-1, DEFAULT_ANIM)).toBeCloseTo(0.75);
  });

  it('computes node depths using breadth-first search', () => {
    expect(computeDepths(parseMermaid('flowchart TD\nA-->B\nB-->C'))).toEqual({
      A: 0,
      B: 1,
      C: 2,
    });
    expect(computeDepths(parseMermaid('flowchart TD\nA-->B\nB-->C\nC-->A'))).toEqual({
      A: 0,
      B: 1,
      C: 2,
    });
    expect(computeDepths(parseMermaid('flowchart TD\nA-->B\nA-->C\nB-->D\nC-->D'))).toEqual({
      A: 0,
      B: 1,
      C: 1,
      D: 2,
    });
    expect(computeDepths(parseMermaid('flowchart TD\nA-->B\nC-->D'))).toEqual({
      A: 0,
      B: 1,
      C: 0,
      D: 1,
    });
  });

  it('handles pulse animation style and node glow', () => {
    const chain = scene('flowchart TD\nA-->B\nB-->C');
    const pulse = { ...DEFAULT_ANIM, style: 'pulse' as const };

    expect(frameState(chain, pulse, 0).particles).toEqual([{ edgeId: 'e0', u: 0, alpha: 1 }]);
    expect(frameState(chain, pulse, 0.25).particles).toEqual([{ edgeId: 'e0', u: 0.5, alpha: 1 }]);
    expect(frameState(chain, pulse, 0.5).particles).toEqual([{ edgeId: 'e1', u: 0, alpha: 1 }]);
    expect(frameState(chain, pulse, 0.75).particles).toEqual([{ edgeId: 'e1', u: 0.5, alpha: 1 }]);

    // Glow on arrival at phase 0.45
    const glowState = frameState(chain, { ...pulse, glow: true }, 0.45);
    expect(glowState.nodeGlow.B).toBeCloseTo(0.1667, 3);

    const noGlowState = frameState(chain, { ...pulse, glow: false }, 0.45);
    expect(noGlowState.nodeGlow).toEqual({});
  });

  it('handles traffic animation style', () => {
    const far = scene('flowchart TD\nA-->B\n%% studio:pos A 0 0\n%% studio:pos B 0 800');
    expect(frameState(far, { ...DEFAULT_ANIM, style: 'traffic' }, 0).particles.length).toBe(5);
  });

  it('handles dash animation style', () => {
    const chain = scene('flowchart TD\nA-->B\nB-->C');
    expect(frameState(chain, { ...DEFAULT_ANIM, style: 'dash' }, 0.5).dashOffset).toBeCloseTo(-32);
    expect(frameState(chain, { ...DEFAULT_ANIM, style: 'dash' }, 0).dashOffset).toBe(0);
    expect(frameState(chain, { ...DEFAULT_ANIM, style: 'pulse' }, 0.5).dashOffset).toBeNull();
  });

  it('handles off style and empty diagrams', () => {
    const chain = scene('flowchart TD\nA-->B\nB-->C');
    expect(frameState(chain, { ...DEFAULT_ANIM, style: 'off' }, 0.3)).toEqual({
      particles: [],
      dashOffset: null,
      nodeGlow: {},
    });
    expect(frameState(scene('flowchart TD'), DEFAULT_ANIM, 0.3).particles).toEqual([]);
  });

  it('provides seamless loops and determinism', () => {
    const chain = scene('flowchart TD\nA-->B\nB-->C');
    const styles: AnimStyle[] = ['pulse', 'traffic', 'dash', 'build', 'typewriter', 'off'];
    const phases = [0, 0.25, 0.5, 0.75];

    for (const style of styles) {
      const st = { ...DEFAULT_ANIM, style };
      for (const ph of phases) {
        expect(frameState(chain, st, ph)).toEqual(frameState(chain, st, ph + 1));
        expect(frameState(chain, st, ph)).toEqual(frameState(chain, st, ph));
      }
    }
  });

  it('handles cascade build animation style', () => {
    const chain = scene('flowchart TD\nA-->B\nB-->C');
    const build = { ...DEFAULT_ANIM, style: 'build' as const };

    const early = frameState(chain, build, 0.05);
    expect(early.nodeAlpha?.A).toBeGreaterThan(0);
    expect(early.nodeAlpha?.C).toBe(0);

    const late = frameState(chain, build, 0.85);
    expect(late.nodeAlpha?.A).toBe(1);
    expect(late.nodeAlpha?.B).toBe(1);
    expect(late.nodeAlpha?.C).toBe(1);
    expect(late.edgeGrow?.e0).toBe(1);
    expect(late.edgeGrow?.e1).toBe(1);
    expect(typeof late.dashOffset).toBe('number');
  });

  it('handles pipeline typewriter reveal animation style', () => {
    const chain = scene('flowchart TD\nA-->B\nB-->C');
    const typewriter = { ...DEFAULT_ANIM, style: 'typewriter' as const };

    const titlePhase = frameState(chain, typewriter, 0.03);
    expect(titlePhase.titleChars).toBeCloseTo(0.5, 1);

    const postBuild = frameState(chain, typewriter, 0.85);
    expect(postBuild.titleChars).toBe(1);
    expect(postBuild.nodeAlpha?.A).toBe(1);
    expect(postBuild.nodeTextProgress?.A).toBe(1);
    expect(postBuild.nodeAlpha?.C).toBe(1);
    expect(postBuild.nodeTextProgress?.C).toBe(1);
    expect(postBuild.edgeGrow?.e0).toBe(1);
    expect(postBuild.edgeTextProgress?.e0).toBe(1);
    expect(typeof postBuild.dashOffset).toBe('number');
    expect(postBuild.dashOffset).toBeLessThan(0);
  });

  it('caps particles on large diagrams', () => {
    const chainLines = ['flowchart TD'];
    for (let i = 0; i < 299; i++) {
      chainLines.push(`  N${i} --> N${i + 1}`);
    }
    const bigScene = scene(chainLines.join('\n'));
    const state = frameState(bigScene, { ...DEFAULT_ANIM, style: 'traffic', density: 10 }, 0);
    expect(state.particles.length).toBeLessThanOrEqual(1500);
  });

  it('only animated edges move in explicit mode', () => {
    const doc = parseMermaid('flowchart LR\nA e1@--> B\nB --> C\ne1@{ animate: true }');
    const f = frameState(scene(doc), DEFAULT_ANIM, 0.25);
    expect(new Set(f.particles.map((p) => p.edgeId))).toEqual(new Set(['e0']));
  });

  it('fast edges run at twice the speed', () => {
    const doc = parseMermaid('flowchart LR\nA e1@--> B\ne1@{ animation: fast }');
    expect(edgeSpeedFactor(doc.edges[0], doc)).toBe(2);
  });
});
