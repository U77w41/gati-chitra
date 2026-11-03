import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from '../mermaid/parse';
import { buildScene } from '../layout/scene';
import { handlePoint } from '../layout/geometry';
import { testMeasure } from '../../tests/support/measure';
import {
  createEditorState,
  reduce,
  type EditorEnv,
  type EditorState,
} from './controller';

describe('controller connect and edit', () => {
  const scene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure);
  const env: EditorEnv = { scene, ok: true, measure: testMeasure };
  const hp = handlePoint(scene.doc, scene.layout.nodes.A);
  const bCenter = scene.layout.nodes.B.center;
  const aCenter = scene.layout.nodes.A.center;
  const edgeMid = scene.layout.edges.e0.labelPoint;

  function stateWithASelected(): EditorState {
    const s = createEditorState();
    return reduce(
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
  }

  it('starts connect drag on handle down', () => {
    const s = stateWithASelected();
    const res = reduce(
      s,
      {
        type: 'pointerDown',
        world: hp,
        screen: hp,
        button: 0,
        space: false,
      },
      env,
    );

    expect(res.state.connect).toEqual({ fromId: 'A', to: hp });
    expect(res.state.selection).toEqual({ kind: 'node', id: 'A' });
    expect(res.effects).toEqual([]);
  });

  it('adds edge on pointer up over target node B', () => {
    let s = stateWithASelected();
    s = reduce(
      s,
      { type: 'pointerDown', world: hp, screen: hp, button: 0, space: false },
      env,
    ).state;

    const res = reduce(
      s,
      { type: 'pointerUp', world: bCenter, screen: bCenter },
      env,
    );
    expect(res.state.connect).toBeNull();
    expect(res.effects).toEqual([
      {
        type: 'applyOp',
        op: { type: 'addEdge', from: 'A', to: 'B' },
      },
    ]);
  });

  it('adds connected node on pointer up over empty space', () => {
    let s = stateWithASelected();
    s = reduce(
      s,
      { type: 'pointerDown', world: hp, screen: hp, button: 0, space: false },
      env,
    ).state;

    const empty = { x: 500, y: 500 };
    const res = reduce(
      s,
      { type: 'pointerUp', world: empty, screen: empty },
      env,
    );
    expect(res.state.connect).toBeNull();
    expect(res.effects).toEqual([
      {
        type: 'addConnectedNode',
        fromId: 'A',
        at: empty,
      },
    ]);
  });

  it('allows self-loop on pointer up over same node A', () => {
    let s = stateWithASelected();
    s = reduce(
      s,
      { type: 'pointerDown', world: hp, screen: hp, button: 0, space: false },
      env,
    ).state;

    const res = reduce(
      s,
      { type: 'pointerUp', world: aCenter, screen: aCenter },
      env,
    );
    expect(res.effects).toEqual([
      {
        type: 'applyOp',
        op: { type: 'addEdge', from: 'A', to: 'A' },
      },
    ]);
  });

  it('handles double click on node, edge, and empty space', () => {
    const s = createEditorState();

    // dblClick on A
    const resA = reduce(s as any, { type: 'dblClick', world: aCenter } as any, env);
    expect(resA.state.editing).toEqual({ kind: 'node', id: 'A', initial: 'A' });
    expect(resA.effects).toEqual([
      { type: 'startEdit', kind: 'node', id: 'A', initial: 'A' },
    ]);

    // dblClick on edge
    const resEdge = reduce(s as any, { type: 'dblClick', world: edgeMid } as any, env);
    expect(resEdge.state.editing).toEqual({ kind: 'edge', id: 'e0', initial: '' });

    // dblClick on empty space
    const empty = { x: 600, y: 600 };
    const resEmpty = reduce(s as any, { type: 'dblClick', world: empty } as any, env);
    expect(resEmpty.effects).toEqual([
      { type: 'addNodeAt', at: empty, shape: 'rect' },
    ]);
  });

  it('handles delete key for node, edge, and group', () => {
    // node A
    let s = stateWithASelected();
    const resNode = reduce(s, { type: 'keyDown', key: 'Delete' }, env);
    expect(resNode.effects).toEqual([
      { type: 'applyOp', op: { type: 'deleteNode', id: 'A' } },
    ]);
    expect(resNode.state.selection).toBeNull();

    // edge e1
    s = { ...createEditorState(), selection: { kind: 'edge', id: 'e1' } };
    const resEdge = reduce(s, { type: 'keyDown', key: 'Delete' }, env);
    expect(resEdge.effects).toEqual([
      { type: 'applyOp', op: { type: 'deleteEdge', index: 1 } },
    ]);

    // group
    s = { ...createEditorState(), selection: { kind: 'group', id: 'g1' } };
    const resGroup = reduce(s, { type: 'keyDown', key: 'Delete' }, env);
    expect(resGroup.effects).toEqual([
      { type: 'message', text: MESSAGES.groupsInText },
    ]);
  });

  it('handles Enter, commitEdit and cancelEdit', () => {
    let s = stateWithASelected();
    const enterRes = reduce(s, { type: 'keyDown', key: 'Enter' }, env);
    expect(enterRes.state.editing).toEqual({ kind: 'node', id: 'A', initial: 'A' });
    expect(enterRes.effects).toEqual([
      { type: 'startEdit', kind: 'node', id: 'A', initial: 'A' },
    ]);

    // commitEdit with new text
    const commitRes = reduce(
      enterRes.state as any,
      { type: 'commitEdit', text: 'Beta' } as any,
      env,
    );
    expect(commitRes.state.editing).toBeNull();
    expect(commitRes.effects).toEqual([
      { type: 'applyOp', op: { type: 'renameNode', id: 'A', label: 'Beta' } },
    ]);

    // commitEdit with unchanged text
    const noopCommit = reduce(
      enterRes.state as any,
      { type: 'commitEdit', text: 'A' } as any,
      env,
    );
    expect(noopCommit.effects).toEqual([]);

    // cancelEdit
    const cancelRes = reduce(
      enterRes.state as any,
      { type: 'cancelEdit' } as any,
      env,
    );
    expect(cancelRes.state.editing).toBeNull();

    // keys ignored while editing is set
    const keyWhileEdit = reduce(enterRes.state, { type: 'keyDown', key: 'Delete' }, env);
    expect(keyWhileEdit.effects).toEqual([]);
  });

  it('refuses edits when env.ok is false', () => {
    const brokenEnv: EditorEnv = { ...env, ok: false };
    const s = stateWithASelected();

    const delRes = reduce(s, { type: 'keyDown', key: 'Delete' }, brokenEnv);
    expect(delRes.effects).toEqual([{ type: 'message', text: MESSAGES.fixTextFirst }]);

    const dblRes = reduce(s as any, { type: 'dblClick', world: aCenter } as any, brokenEnv);
    expect(dblRes.effects).toEqual([{ type: 'message', text: MESSAGES.fixTextFirst }]);

    const handleRes = reduce(
      s,
      { type: 'pointerDown', world: hp, screen: hp, button: 0, space: false },
      brokenEnv,
    );
    expect(handleRes.effects).toEqual([{ type: 'message', text: MESSAGES.fixTextFirst }]);
  });
});
