import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import { createEditorState, reduce, type EditorEnv } from './controller';

describe('controller', () => {
  const scene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure);
  const env: EditorEnv = { scene, ok: true, measure: testMeasure };
  const aCenter = scene.layout.nodes.A.center;

  it('selects and drags a node', () => {
    let s = createEditorState();

    // Pointer down on A
    const downRes = reduce(
      s,
      {
        type: 'pointerDown',
        world: aCenter,
        screen: aCenter,
        button: 0,
        space: false,
      },
      env,
    );
    s = downRes.state;
    expect(s.selection).toEqual({ kind: 'node', id: 'A' });
    expect(s.drag).not.toBeNull();
    expect(downRes.effects).toEqual([]);

    // Move by 2 px
    const move2Res = reduce(
      s,
      {
        type: 'pointerMove',
        world: { x: aCenter.x + 2, y: aCenter.y },
        screen: { x: aCenter.x + 2, y: aCenter.y },
      },
      env,
    );
    s = move2Res.state;
    expect(s.drag?.moved).toBe(false);

    // Move by 20 px
    const move20Res = reduce(
      s,
      {
        type: 'pointerMove',
        world: { x: aCenter.x + 20, y: aCenter.y },
        screen: { x: aCenter.x + 20, y: aCenter.y },
      },
      env,
    );
    s = move20Res.state;
    expect(s.drag?.moved).toBe(true);

    // Pointer up after 20 px move
    const upRes = reduce(
      s,
      {
        type: 'pointerUp',
        world: { x: aCenter.x + 20, y: aCenter.y },
        screen: { x: aCenter.x + 20, y: aCenter.y },
      },
      env,
    );
    expect(upRes.state.drag).toBeNull();
    expect(upRes.effects).toEqual([
      {
        type: 'applyOp',
        op: {
          type: 'setPin',
          id: 'A',
          x: Math.round(aCenter.x + 20),
          y: Math.round(aCenter.y),
        },
      },
    ]);
  });

  it('does not emit pin effect when pointer up occurs without a move', () => {
    let s = createEditorState();
    s = reduce(
      s,
      {
        type: 'pointerDown',
        world: aCenter,
        screen: aCenter,
        button: 0,
        space: false,
      },
      env,
    ).state;

    const upRes = reduce(
      s,
      {
        type: 'pointerUp',
        world: aCenter,
        screen: aCenter,
      },
      env,
    );
    expect(upRes.effects).toEqual([]);
    expect(upRes.state.drag).toBeNull();
  });

  it('handles empty space drag as pan', () => {
    let s = createEditorState();
    const emptyPoint = { x: 9999, y: 9999 };

    const downRes = reduce(
      s,
      {
        type: 'pointerDown',
        world: emptyPoint,
        screen: { x: 50, y: 50 },
        button: 0,
        space: false,
      },
      env,
    );
    s = downRes.state;
    expect(s.selection).toBeNull();
    expect(s.pan).toEqual({ last: { x: 50, y: 50 } });

    const moveRes = reduce(
      s,
      {
        type: 'pointerMove',
        world: { x: 10009, y: 10004 },
        screen: { x: 60, y: 55 },
      },
      env,
    );
    expect(moveRes.effects).toEqual([{ type: 'panBy', dx: 10, dy: 5 }]);
    expect(moveRes.state.pan).toEqual({ last: { x: 60, y: 55 } });
  });

  it('prevents drag and shows message when env.ok is false', () => {
    let s = createEditorState();
    const brokenEnv: EditorEnv = { ...env, ok: false };

    const res = reduce(
      s,
      {
        type: 'pointerDown',
        world: aCenter,
        screen: aCenter,
        button: 0,
        space: false,
      },
      brokenEnv,
    );

    expect(res.effects).toEqual([{ type: 'message', text: MESSAGES.fixTextFirst }]);
    expect(res.state.drag).toBeNull();
  });

  it('cancels drag on textChanged (Review Focus 3)', () => {
    let s = createEditorState();
    s = reduce(
      s,
      {
        type: 'pointerDown',
        world: aCenter,
        screen: aCenter,
        button: 0,
        space: false,
      },
      env,
    ).state;
    expect(s.drag).not.toBeNull();

    const textChangedRes = reduce(s, { type: 'textChanged' }, env);
    expect(textChangedRes.state.drag).toBeNull();
  });

  it('clears selection on Escape key', () => {
    let s = createEditorState();
    s = reduce(
      s,
      {
        type: 'pointerDown',
        world: aCenter,
        screen: aCenter,
        button: 0,
        space: false,
      },
      env,
    ).state;
    expect(s.selection).toEqual({ kind: 'node', id: 'A' });

    const escRes = reduce(s, { type: 'keyDown', key: 'Escape' }, env);
    expect(escRes.state.selection).toBeNull();
  });

  it('starts pan on middle-click (button 1) even over a node without selecting it', () => {
    let s = createEditorState();
    const res = reduce(
      s,
      {
        type: 'pointerDown',
        world: aCenter,
        screen: { x: 100, y: 100 },
        button: 1,
        space: false,
      },
      env,
    );

    expect(res.state.pan).toEqual({ last: { x: 100, y: 100 } });
    expect(res.state.selection).toBeNull();
  });
});
