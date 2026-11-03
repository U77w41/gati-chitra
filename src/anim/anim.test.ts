import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import {
  DEFAULT_ANIM,
  computeDepths,
  frameState,
  loopSeconds,
  phaseAt,
} from './anim';
import type { AnimStyle } from '../core/types';

function scene(text: string) {
  return buildScene(parseMermaid(text), testMeasure);
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
    const styles: AnimStyle[] = ['pulse', 'traffic', 'dash', 'off'];
    const phases = [0, 0.25, 0.5, 0.75];

    for (const style of styles) {
      const st = { ...DEFAULT_ANIM, style };
      for (const ph of phases) {
        expect(frameState(chain, st, ph)).toEqual(frameState(chain, st, ph + 1));
        expect(frameState(chain, st, ph)).toEqual(frameState(chain, st, ph));
      }
    }
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
});
