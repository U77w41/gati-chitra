import type { GraphNode, ParsedDoc, Point, Scene, SceneLayout, ShapeKind } from '../../src/core/types';
import { parseMermaid } from '../../src/mermaid/parse';
import { buildScene } from '../../src/layout/scene';
import { layoutDoc } from '../../src/layout/layout';
import { testMeasure } from './measure';
import { renderSvg } from '../../src/render/svg';
import { THEMES } from '../../src/render/themes';
import { drawScene } from '../../src/render/draw';
import { createRecordingContext } from './recording-context';

export function sceneOf(textOrDoc: string | ParsedDoc): Scene {
  const doc = typeof textOrDoc === 'string' ? parseMermaid(textOrDoc) : textOrDoc;
  return buildScene(doc, testMeasure);
}

export function layoutOf(text: string): SceneLayout {
  return layoutDoc(parseMermaid(text), testMeasure);
}

export function svgOf(text: string): string {
  const scene = sceneOf(text);
  return renderSvg(scene, THEMES.daylight, { mode: 'content', transparent: false }, testMeasure);
}

export function recordDraw(text: string): { name: string; args: unknown[] }[] {
  const scene = sceneOf(text);
  const { ctx, calls } = createRecordingContext();
  drawScene(
    ctx,
    scene,
    THEMES.daylight,
    { panX: 0, panY: 0, zoom: 1 },
    { particles: [], dashOffset: null, nodeGlow: {} },
    {
      transparent: false,
      selection: null,
      handleNodeId: null,
      connectPreview: null,
      focus: null,
      showGlow: false,
    },
  );
  return calls;
}

export function nodeOf(shape: ShapeKind, label = 'x'): GraphNode {
  return {
    id: label,
    label,
    shape,
    classNames: [],
    style: {},
    group: null,
    line: 0,
  };
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
