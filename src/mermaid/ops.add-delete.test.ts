import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { CORPUS } from '../../tests/support/corpus';
import type { TextOp } from '../core/types';
import { applyOp, formatLabel, splitStatement } from './ops';
import { parseMermaid } from './parse';

const run = (t: string, op: TextOp) => applyOp(t, op);

describe('text patches: pins, add, delete', () => {
  it('handles pins', () => {
    const r1 = run('flowchart TD\n  A --> B\n', { type: 'setPin', id: 'A', x: 120.4, y: 80.6 });
    expect(r1).toEqual({
      text: 'flowchart TD\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 120 81\n',
    });

    const r2 = run((r1 as { text: string }).text, { type: 'setPin', id: 'B', x: 10, y: 20 });
    expect(r2).toEqual({
      text: 'flowchart TD\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 120 81\n%% studio:pos B 10 20\n',
    });

    const r3 = run((r2 as { text: string }).text, { type: 'setPin', id: 'A', x: 200, y: 40 });
    expect(r3).toEqual({
      text: 'flowchart TD\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 200 40\n%% studio:pos B 10 20\n',
    });

    const r4 = run((r3 as { text: string }).text, { type: 'clearPins' });
    expect(r4).toEqual({ text: 'flowchart TD\n  A --> B\n' });

    expect(run('flowchart TD\n  A\n', { type: 'setPin', id: 'Z', x: 1, y: 1 })).toEqual({
      error: 'Unknown node "Z".',
    });
    expect(run('nonsense', { type: 'clearPins' })).toEqual({ error: MESSAGES.fixTextFirst });
  });

  it('handles addNode', () => {
    expect(
      run('flowchart TD\n  A --> B\n', { type: 'addNode', label: 'New step', shape: 'rect' })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  n1[New step]\n',
      createdId: 'n1',
    });
    expect(run('flowchart TD\n  A\n', { type: 'addNode', label: 'Go', shape: 'stadium' })).toEqual({
      text: 'flowchart TD\n  A\n  n1([Go])\n',
      createdId: 'n1',
    });
    expect(
      run('flowchart TD\n  A\n', { type: 'addNode', label: 'Yes (maybe)', shape: 'rect' })
    ).toEqual({
      text: 'flowchart TD\n  A\n  n1["Yes (maybe)"]\n',
      createdId: 'n1',
    });
    expect(
      run('flowchart TD\n  n1\n  n3\n', { type: 'addNode', label: 'New', shape: 'rect' })
    ).toMatchObject({
      createdId: 'n4',
    });
    expect(
      run('flowchart TD\n  subgraph g\n    A\n  end\n', {
        type: 'addNode',
        label: 'New',
        shape: 'rect',
      })
    ).toEqual({
      text: 'flowchart TD\n  subgraph g\n    A\n  end\n  n1[New]\n',
      createdId: 'n1',
    });
    expect(run('flowchart TD\n', { type: 'addNode', label: 'New', shape: 'rect' })).toEqual({
      text: 'flowchart TD\n  n1[New]\n',
      createdId: 'n1',
    });
    expect(
      run('flowchart TD\n  A\n', {
        type: 'addNode',
        label: 'New',
        shape: 'rect',
        pin: { x: 5, y: 6 },
      })
    ).toEqual({
      text: 'flowchart TD\n  A\n  n1[New]\n\n%% studio:layout v1\n%% studio:pos n1 5 6\n',
      createdId: 'n1',
    });
  });

  it('handles addEdge', () => {
    expect(run('flowchart TD\n  A --> B\n', { type: 'addEdge', from: 'B', to: 'A' })).toEqual({
      text: 'flowchart TD\n  A --> B\n  B --> A\n',
    });
    expect(
      run('flowchart TD\n  A --> B\n', {
        type: 'addEdge',
        from: 'B',
        to: 'A',
        kind: 'dottedArrow',
        label: 'back',
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  B -.->|back| A\n',
    });
    expect(run('flowchart TD\n  A --> B\n', { type: 'addEdge', from: 'Z', to: 'A' })).toEqual({
      error: 'Unknown node "Z".',
    });
    expect(
      run('flowchart TD\n  A\n  B\n\n%% studio:layout v1\n%% studio:pos A 1 2\n', {
        type: 'addEdge',
        from: 'A',
        to: 'B',
      })
    ).toEqual({
      text: 'flowchart TD\n  A\n  B\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 1 2\n',
    });
  });

  it('handles splitStatement', () => {
    expect(splitStatement('A[Start] --> B{Q} --> C')).toEqual(['A[Start] --> B{Q}', 'B --> C']);
    expect(splitStatement('A & B --> C')).toEqual(['A --> C', 'B --> C']);
    expect(splitStatement('  A -->|x| B -.-> C')).toEqual(['  A -->|x| B', '  B -.-> C']);
    expect(splitStatement('A -- yes --> B & C')).toEqual(['A -->|yes| B', 'A -->|yes| C']);
    expect(splitStatement('A --> B;')).toEqual(['A --> B;']);
    expect(splitStatement('A & B')).toEqual(['A & B']);
  });

  it('handles deleteEdge', () => {
    expect(
      run('flowchart TD\n  A --> B\n  B --> C\n', { type: 'deleteEdge', index: 0 })
    ).toEqual({
      text: 'flowchart TD\n  A\n  B --> C\n',
    });
    expect(
      run('flowchart TD\n  A[Start] --> B[End]\n', { type: 'deleteEdge', index: 0 })
    ).toEqual({
      text: 'flowchart TD\n  A[Start]\n  B[End]\n',
    });
    expect(
      run('flowchart TD\n  A --> B --> C\n', { type: 'deleteEdge', index: 1 })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  C\n',
    });
    expect(
      run('flowchart TD\n  A --> B\n  B --> C\n  linkStyle 1 stroke:#f00\n', {
        type: 'deleteEdge',
        index: 0,
      })
    ).toEqual({
      text: 'flowchart TD\n  A\n  B --> C\n  linkStyle 0 stroke:#f00\n',
    });
    expect(
      run('flowchart TD\n  A --> B\n  B --> C\n  linkStyle 1 stroke:#f00\n', {
        type: 'deleteEdge',
        index: 1,
      })
    ).toEqual({
      text: 'flowchart TD\n  A --> B\n  C\n',
    });
    expect(run('flowchart TD\n  A --> A\n', { type: 'deleteEdge', index: 0 })).toEqual({
      text: 'flowchart TD\n  A\n',
    });
    expect(run('flowchart TD\n  A --> B\n', { type: 'deleteEdge', index: 5 })).toEqual({
      error: 'Unknown arrow 5.',
    });
  });

  it('handles deleteNode', () => {
    expect(
      run('flowchart TD\n  A --> B\n  B --> C\n', { type: 'deleteNode', id: 'B' })
    ).toEqual({
      text: 'flowchart TD\n  A\n  C\n',
    });
    expect(
      run('flowchart TD\n  A[Start]\n  A --> B\n', { type: 'deleteNode', id: 'A' })
    ).toEqual({
      text: 'flowchart TD\n  B\n',
    });
    expect(
      run('flowchart TD\n  A --> B\n  style A fill:#f00\n  class A,B hot\n', {
        type: 'deleteNode',
        id: 'A',
      })
    ).toEqual({
      text: 'flowchart TD\n  B\n  class B hot\n',
    });
    expect(
      run(
        'flowchart TD\n  A\n  B\n\n%% studio:layout v1\n%% studio:pos A 1 2\n%% studio:pos B 3 4\n',
        { type: 'deleteNode', id: 'A' }
      )
    ).toEqual({
      text: 'flowchart TD\n  B\n\n%% studio:layout v1\n%% studio:pos B 3 4\n',
    });
    expect(run('flowchart TD\n  A\n', { type: 'deleteNode', id: 'Z' })).toEqual({
      error: 'Unknown node "Z".',
    });
  });

  it('handles formatLabel', () => {
    expect(formatLabel('Hi')).toBe('Hi');
    expect(formatLabel('a\nb')).toBe('a<br/>b');
    expect(formatLabel('Yes (maybe)')).toBe('"Yes (maybe)"');
    expect(formatLabel('say "x"')).toBe('"say #quot;x#quot;"');
    expect(formatLabel('a;b')).toBe('"a;b"');
  });

  it('satisfies Review Focus 3 properties over CORPUS', () => {
    for (const c of CORPUS) {
      if (!c.ok) continue;
      const doc = parseMermaid(c.text);

      // (a) deleteNode of any node
      for (const node of doc.nodes) {
        const res = run(c.text, { type: 'deleteNode', id: node.id });
        expect('error' in res).toBe(false);
        if ('text' in res) {
          const newDoc = parseMermaid(res.text);
          expect(newDoc.ok).toBe(true);
          const remainingNodes = doc.nodes.filter(n => n.id !== node.id).map(n => n.id);
          expect(newDoc.nodes.map(n => n.id).sort()).toEqual(remainingNodes.sort());

          const origSpecial = doc.lines
            .filter(l => ['unknown', 'directive', 'comment'].includes(l.kind))
            .map(l => l.text);
          const newSpecial = newDoc.lines
            .filter(l => ['unknown', 'directive', 'comment'].includes(l.kind))
            .map(l => l.text);
          expect(newSpecial).toEqual(origSpecial);
        }
      }

      // (b) for diagrams with no pos lines: setPin then clearPins returns original normalised
      if (Object.keys(doc.pins).length === 0 && doc.nodes.length > 0) {
        const firstNode = doc.nodes[0].id;
        const pinned = run(c.text, { type: 'setPin', id: firstNode, x: 50, y: 50 });
        if ('text' in pinned) {
          const cleared = run(pinned.text, { type: 'clearPins' });
          if ('text' in cleared) {
            const origLines = c.text.split(/\r\n|\r|\n/);
            while (origLines.length > 0 && origLines[origLines.length - 1].trim() === '') {
              origLines.pop();
            }
            const expectedText = origLines.join('\n') + '\n';
            expect(cleared.text).toBe(expectedText);
          }
        }
      }
    }
  });
});
