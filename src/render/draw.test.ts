import { describe, expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import { sceneOf } from '../../tests/support/scene';
import { createRecordingContext } from '../../tests/support/recording-context';
import { THEMES } from './themes';
import { prepare } from './prepared';
import {
  drawBackground,
  drawScene,
  edgeStyle,
  emptyFrame,
} from './draw';
import { CORPUS } from '../../tests/support/corpus';
import type { DrawOptions, FrameState, Theme, ViewState } from '../core/types';

function bg(theme: Theme, width: number, height: number, transparent: boolean) {
  const { ctx, calls } = createRecordingContext(width, height);
  drawBackground(ctx, theme, width, height, transparent);
  return calls;
}

function count(calls: { name: string; args: unknown[] }[], name: string): number {
  return calls.filter((c) => c.name === name).length;
}

function draw(
  text: string,
  options: Partial<DrawOptions> = {},
  frame: Partial<FrameState> = {},
  theme: Theme = THEMES.daylight,
) {
  const scene = buildScene(parseMermaid(text), testMeasure);
  const view: ViewState = { zoom: 1, panX: 0, panY: 0 };
  const fullFrame: FrameState = { ...emptyFrame(), ...frame };
  const fullOptions: DrawOptions = {
    transparent: false,
    selection: null,
    handleNodeId: null,
    connectPreview: null,
    focus: null,
    showGlow: false,
    ...options,
  };

  const { ctx, calls } = createRecordingContext(800, 600);
  drawScene(ctx, scene, theme, view, fullFrame, fullOptions);
  return calls;
}

describe('draw', () => {
  it('draws background with transparent, solid and gradient options', () => {
    const clearCalls = bg(THEMES.daylight, 800, 600, true);
    expect(clearCalls).toContainEqual({ name: 'clearRect', args: [0, 0, 800, 600] });
    expect(count(clearCalls, 'fillRect')).toBe(0);

    const solidCalls = bg(THEMES.daylight, 800, 600, false);
    expect(solidCalls).toContainEqual({ name: 'set:fillStyle', args: ['#ffffff'] });
    expect(solidCalls).toContainEqual({ name: 'fillRect', args: [0, 0, 800, 600] });

    const gradCalls = bg(THEMES.lagoon, 800, 600, false);
    expect(count(gradCalls, 'createLinearGradient')).toBe(1);
    expect(gradCalls).toContainEqual({ name: 'fillRect', args: [0, 0, 800, 600] });
  });

  it('preserves order and balance in drawScene', () => {
    const calls = draw('flowchart TD\nA-->B');
    expect(count(calls, 'save')).toBe(count(calls, 'restore'));
    expect(calls[0].name).toBe('save');

    const firstTranslate = calls.findIndex((c) => c.name === 'translate');
    const firstScale = calls.findIndex((c) => c.name === 'scale');
    const firstFillText = calls.findIndex((c) => c.name === 'fillText');
    expect(firstTranslate).toBeLessThan(firstFillText);
    expect(firstScale).toBeLessThan(firstFillText);

    const firstLineTo = calls.findIndex((c) => c.name === 'lineTo');
    expect(firstLineTo).toBeLessThan(firstFillText);

    const textCalls = calls.filter((c) => c.name === 'fillText').map((c) => c.args[0]);
    expect(textCalls).toEqual(['A', 'B']);

    expect(count(calls, 'roundRect')).toBe(2);
    const roundRectCalls = calls.filter((c) => c.name === 'roundRect');
    expect(roundRectCalls[0].args[4]).toBe(4);
  });

  it('handles different edge kinds, markers and labels', () => {
    const dotted = draw('flowchart TD\nA -.-> B');
    expect(dotted).toContainEqual({ name: 'setLineDash', args: [[3, 5]] });
    expect(dotted).toContainEqual({ name: 'setLineDash', args: [[]] });

    const thick = draw('flowchart TD\nA ==> B');
    expect(thick).toContainEqual({ name: 'set:lineWidth', args: [4] });

    expect(count(draw('flowchart TD\nA --> B'), 'closePath')).toBe(1);
    expect(count(draw('flowchart TD\nA --- B'), 'closePath')).toBe(0);
    expect(count(draw('flowchart TD\nA <--> B'), 'closePath')).toBe(2);
    expect(count(draw('flowchart TD\nA --x B'), 'closePath')).toBe(0);

    const circleEnd = draw('flowchart TD\nA --o B');
    expect(circleEnd).toContainEqual(expect.objectContaining({ name: 'arc', args: expect.arrayContaining([5]) }));

    const labeled = draw('flowchart TD\nA -->|yes| B');
    expect(labeled.some((c) => c.name === 'fillText' && c.args[0] === 'yes')).toBe(true);
    expect(count(labeled, 'roundRect')).toBe(3);
  });

  it('draws various node shapes correctly', () => {
    const diamond = draw('flowchart TD\nA{Q}');
    expect(count(diamond, 'moveTo')).toBe(1);
    expect(count(diamond, 'lineTo')).toBe(3);
    expect(count(diamond, 'closePath')).toBe(1);
    expect(count(diamond, 'fill')).toBe(1);
    expect(count(diamond, 'stroke')).toBe(1);

    const circle = draw('flowchart TD\nA((Q))');
    expect(count(circle, 'arc')).toBe(1);
    const arcCall = circle.find((c) => c.name === 'arc');
    expect(arcCall?.args[2]).toBe(40);

    const cylinder = draw('flowchart TD\nA[(DB)]');
    expect(count(cylinder, 'ellipse')).toBe(3);

    const subroutine = draw('flowchart TD\nA[[S]]');
    expect(count(subroutine, 'roundRect')).toBe(1);
    expect(count(subroutine, 'lineTo')).toBe(2);
  });

  it('applies styles, selection, focus and glow', () => {
    const styled = draw('flowchart TD\nA\nstyle A fill:#ff0000,stroke:#00ff00');
    expect(styled).toContainEqual({ name: 'set:fillStyle', args: ['#ff0000'] });
    expect(styled).toContainEqual({ name: 'set:strokeStyle', args: ['#00ff00'] });

    const selected = draw('flowchart TD\nA', { selection: { kind: 'node', id: 'A' } });
    expect(selected).toContainEqual({ name: 'set:strokeStyle', args: [THEMES.daylight.selection] });

    const focused = draw('flowchart TD\nA-->B', { focus: { nodes: ['A'], edges: [] } });
    expect(focused).toContainEqual({ name: 'set:globalAlpha', args: [0.25] });

    const glowOn = draw('flowchart TD\nA', { showGlow: true }, { nodeGlow: { A: 1 } });
    expect(glowOn).toContainEqual({ name: 'set:shadowBlur', args: [18] });

    const glowOff = draw('flowchart TD\nA', { showGlow: false }, { nodeGlow: { A: 1 } });
    const shadowBlurs = glowOff.filter((c) => c.name === 'set:shadowBlur').map((c) => c.args[0]);
    expect(shadowBlurs.every((b) => b === 0)).toBe(true);
  });

  it('renders animation overlays: particles and dash offset', () => {
    const particleCalls = draw(
      'flowchart TD\nA-->B',
      {},
      { particles: [{ edgeId: 'e0', u: 0.5, alpha: 0.5 }] },
    );
    expect(particleCalls).toContainEqual({ name: 'set:globalAlpha', args: [0.5] });
    expect(particleCalls.some((c) => c.name === 'arc' && c.args[2] === 4)).toBe(true);

    const dashCalls = draw('flowchart TD\nA-->B', {}, { dashOffset: -10 });
    expect(dashCalls).toContainEqual({ name: 'set:lineDashOffset', args: [-10] });
    expect(dashCalls).toContainEqual({ name: 'setLineDash', args: [[8, 8]] });
  });

  it('renders groups in correct order, connect preview and handles', () => {
    const pipelineCalls = draw(CORPUS[1].text);
    const ingestIdx = pipelineCalls.findIndex((c) => c.name === 'fillText' && c.args[0] === 'Ingest');
    const serveIdx = pipelineCalls.findIndex((c) => c.name === 'fillText' && c.args[0] === 'Serve');
    const parseIdx = pipelineCalls.findIndex((c) => c.name === 'fillText' && c.args[0] === 'Parse');

    expect(ingestIdx).toBeLessThan(parseIdx);
    expect(serveIdx).toBeLessThan(parseIdx);

    const previewCalls = draw(
      'flowchart TD\nA',
      { connectPreview: { from: { x: 0, y: 0 }, to: { x: 50, y: 50 } } },
    );
    expect(previewCalls).toContainEqual({ name: 'setLineDash', args: [[6, 4]] });

    const handleCalls = draw('flowchart TD\nA', { handleNodeId: 'A' });
    expect(handleCalls.some((c) => c.name === 'arc' && c.args[2] === 7)).toBe(true);
  });

  it('determines edge styles correctly', () => {
    const theme = THEMES.daylight;
    const doc = parseMermaid('flowchart TD\nA ==> B\nC -.-> D\nE <--> F');

    const thickArrow = edgeStyle(doc.edges[0], theme);
    expect(thickArrow).toMatchObject({ width: 4, endMarker: 'arrow', dash: null });

    const dotted = edgeStyle(doc.edges[1], theme);
    expect(dotted).toMatchObject({ dash: [3, 5], endMarker: 'arrow' });

    const dottedPlain = edgeStyle({ ...doc.edges[1], kind: 'dotted' }, theme);
    expect(dottedPlain).toMatchObject({ dash: [3, 5], endMarker: 'none' });

    const customDash = edgeStyle(
      { ...doc.edges[0], style: { 'stroke-dasharray': '5 5' } },
      theme,
    );
    expect(customDash.dash).toEqual([5, 5]);

    const bidirectional = edgeStyle(doc.edges[2], theme);
    expect(bidirectional.startArrow).toBe(true);
  });

  it('caches prepared data per scene', () => {
    const s = sceneOf('flowchart TD\nA --> B');
    expect(prepare(s)).toBe(prepare(s));
  });

  it('canvas draws no label for a start point and no outline for text', () => {
    const calls = draw('flowchart TD\nA@{ shape: sm-circ, label: "S" }\nB@{ shape: text, label: "T" }');
    expect(calls.filter(c => c.name === 'fillText').map(c => c.args[0])).toEqual(['T']);
  });

  it('draws label pills with radius and 30% alpha stroke', () => {
    const calls = draw('flowchart LR\nA -->|yes| B');
    expect(calls).toContainEqual({
      name: 'roundRect',
      args: expect.arrayContaining([6]),
    });
    expect(calls).toContainEqual({ name: 'set:globalAlpha', args: [0.3] });
  });

  it('draws grid when showGrid is true and excludes it when false or transparent', () => {
    const theme = THEMES.obsidian;
    const callsWithGrid = draw('flowchart TD\nA --> B', { showGrid: true }, {}, theme);
    expect(callsWithGrid).toContainEqual({ name: 'set:strokeStyle', args: [theme.gridColor] });

    const callsWithoutGrid = draw('flowchart TD\nA --> B', { showGrid: false }, {}, theme);
    const gridColorStroke = callsWithoutGrid.find(
      (c) => c.name === 'set:strokeStyle' && c.args[0] === theme.gridColor,
    );
    expect(gridColorStroke).toBeUndefined();

    const callsTransparent = draw('flowchart TD\nA --> B', { showGrid: true, transparent: true }, {}, theme);
    const gridTransparentStroke = callsTransparent.find(
      (c) => c.name === 'set:strokeStyle' && c.args[0] === theme.gridColor,
    );
    expect(gridTransparentStroke).toBeUndefined();
  });

  it('uses theme.titleText for title fill if defined', () => {
    const customTheme: Theme = {
      ...THEMES.daylight,
      nodeText: '#111418',
      titleText: '#ff00ff',
    };
    const calls = draw('---\ntitle: Diagram Title\n---\nflowchart TD\nA --> B', {}, {}, customTheme);
    expect(calls).toContainEqual({ name: 'set:fillStyle', args: ['#ff00ff'] });
  });

  it('slices title text when frame.titleChars is defined', () => {
    const text = '---\ntitle: Food Delivery Pipeline\n---\nflowchart TD\nA --> B';
    const callsFull = draw(text, {}, { titleChars: 4 });
    expect(callsFull.some((c) => c.name === 'fillText' && c.args[0] === 'Food')).toBe(true);
  });

  it('renders pipeline cards and rounded diamonds in pipeline cardMode', () => {
    const text = 'flowchart TD\nA["Order Placed"] --> B{Authorized?}';
    const calls = draw(text, { cardMode: 'pipeline' });
    expect(calls.some((c) => c.name === 'arcTo')).toBe(true);
    expect(calls.some((c) => c.name === 'fillText' && c.args[0] === '?')).toBe(true);
  });

  it('renders 64x64 icon tiles with trigger badge in workflow cardMode', () => {
    const text = 'flowchart TD\nA["Form Submitted"] --> B["Approval"]';
    const calls = draw(text, { cardMode: 'workflow' });
    expect(calls.some((c) => c.name === 'fillText' && c.args[0] === '⚡')).toBe(true);
    expect(calls.some((c) => c.name === 'roundRect' && c.args[2] === 64 && c.args[3] === 64)).toBe(true);
  });
});
