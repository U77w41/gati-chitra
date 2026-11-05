import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseMermaid } from '../../mermaid/parse';
import { appendLine, appendLines, cleanForText, deleteLines, guardOk, insertLine, mirrorOp, nextId, rebuildLine, replaceSpan, upsertClassStyle, upsertStyleLine } from './edit';

const doc = (t: string) => parseMermaid(t);

describe('edit kit', () => {
  it('guardOk refuses ops on a document with errors', () => {
    expect(guardOk({ ...doc('flowchart TD\nA'), ok: false })).toEqual({ error: MESSAGES.fixTextFirst });
    expect(guardOk(doc('flowchart TD\nA'))).toBeNull();
  });
  it('replaces spans and edits lines', () => {
    expect(replaceSpan('a\n  hello\n', { line: 1, from: 2, to: 7 }, 'bye')).toBe('a\n  bye\n');
    expect(deleteLines('a\nb\nc\n', [2, 0, 2])).toBe('b\n');
    expect(insertLine('a\nb\n', 0, 'x')).toBe('a\nx\nb\n');
    expect(insertLine('a\n', -1, 'x')).toBe('x\na\n');
    expect(rebuildLine('a\n    b --> c\n', 1, 'c --> b')).toBe('a\n    c --> b\n');
  });
  it('appends after the last content line, before pins', () => {
    const t = 'flowchart TD\n  A\n%% studio:layout v1\n%% studio:pos A 1 2\n';
    expect(appendLine(t, doc(t), '  B')).toBe('flowchart TD\n  A\n  B\n%% studio:layout v1\n%% studio:pos A 1 2\n');
    expect(appendLines('flowchart TD\n  A\n', doc('flowchart TD\n  A\n'), ['  B', '  C'])).toBe('flowchart TD\n  A\n  B\n  C\n');
  });
  it('makes ids, cleans labels and mirrors operators', () => {
    expect(nextId(doc('flowchart TD\nS1\nS7\nX'), 'S')).toBe('S8');
    expect(cleanForText('say "hi":\nnow', /[":]/g)).toBe('say hi now');
    expect(cleanForText('  ', /x/g)).toBe('New');
    expect(['<|--', '-->', '..|>', '*--', '||--o{', '|o--o{'].map(mirrorOp)).toEqual(['--|>', '<--', '<|..', '--*', '}o--||', '}o--o|']);
  });
  it('writes and merges style lines', () => {
    const t = 'classDiagram\n  class A\n';
    const once = upsertStyleLine(t, doc('flowchart TD\nA'), 'A', { fill: '#f00' });
    expect(once).toBe('classDiagram\n  class A\n  style A fill:#f00\n');
    expect(upsertStyleLine(once, doc('flowchart TD\nA\nstyle A fill:#f00'), 'A', { fill: '' })).toBe('classDiagram\n  class A\n');
    expect(upsertClassStyle('stateDiagram-v2\n  A\n', doc('flowchart TD\nA'), 'A', { fill: '#0f0' })).toBe('stateDiagram-v2\n  A\n  classDef gc_A fill:#0f0\n  class A gc_A\n');
  });
});
