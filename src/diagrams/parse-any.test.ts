import { afterEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from '../mermaid/parse';
import { fakeEngine } from '../../tests/support/fake-engine';
import { parseDocument } from './parse-any';
import { getEngine, loadEngine, onEngineChange, setLoaderForTest } from './registry';

afterEach(() => setLoaderForTest('sequence', null));

describe('parseDocument', () => {
  it('parses flowcharts exactly as before', () => {
    const t = 'flowchart TD\nA-->B';
    expect(parseDocument(t)).toEqual(parseMermaid(t));
  });
  it('reports unsupported types on their header line', () => {
    const d = parseDocument('%% x\npie title Pets');
    expect(d.ok).toBe(false);
    expect(d.diagnostics).toEqual([{ line: 2, severity: 'error', message: MESSAGES.unsupportedDiagram('Pie chart') }]);
  });
  it('reports a known type without an engine as unsupported', () => {
    setLoaderForTest('sequence', null); // later tasks add a real loader; null removes it for this test file
    expect(parseDocument('sequenceDiagram').diagnostics[0].message).toBe(MESSAGES.unsupportedDiagram('Sequence diagram'));
  });
  it('returns a pending doc, loads the engine once, then parses with it', async () => {
    const loader = vi.fn(async () => fakeEngine('sequence'));
    setLoaderForTest('sequence', loader);
    const changed = vi.fn();
    const off = onEngineChange(changed);
    const first = parseDocument('sequenceDiagram\n  A->>B: hi');
    expect(first).toMatchObject({ ok: false, pending: true, kind: 'sequence' });
    expect(first.diagnostics).toEqual([{ line: 1, severity: 'info', message: MESSAGES.loadingDiagram('Sequence') }]);
    parseDocument('sequenceDiagram');
    await loadEngine('sequence');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(getEngine('sequence')).not.toBeNull();
    expect(parseDocument('sequenceDiagram')).toMatchObject({ ok: true, kind: 'sequence' });
    off();
  });
  it('reports a load failure as an error diagnostic', async () => {
    setLoaderForTest('sequence', async () => { throw new Error('offline'); });
    parseDocument('sequenceDiagram');
    await expect(loadEngine('sequence')).rejects.toThrow('offline');
    expect(parseDocument('sequenceDiagram').diagnostics).toEqual([{ line: 1, severity: 'error', message: MESSAGES.diagramLoadFailed('Sequence') }]);
    expect(parseDocument('flowchart TD\nA').ok).toBe(true);
  });
});
