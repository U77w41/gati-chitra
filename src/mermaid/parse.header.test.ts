import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from './parse';

describe('parseMermaid header & nodes', () => {
  it('parses header and nodes correctly', () => {
    expect(parseMermaid('flowchart TD\nA[Start]')).toMatchObject({ ok: true, direction: 'TB' });
    expect(parseMermaid('flowchart TD\nA[Start]').nodes).toMatchObject([{ id: 'A', label: 'Start', shape: 'rect' }]);
    expect(parseMermaid('flowchart TD\nA[Start]').lines.map(l => l.kind)).toEqual(['header', 'statement']);
    expect(parseMermaid('flowchart TD\nA[Start]').lines[1].nodeIds).toEqual(['A']);
    expect(parseMermaid('graph LR\n').direction).toBe('LR');
    expect(parseMermaid('flowchart\nA').direction).toBe('TB');
    expect(parseMermaid('flowchart BT;').direction).toBe('BT');
    expect(parseMermaid('').diagnostics[0]).toEqual({ line: 1, severity: 'error', message: MESSAGES.notFlowchart });
    expect(parseMermaid('sequenceDiagram\n A->>B: hi')).toMatchObject({ ok: false });
    expect(parseMermaid('sequenceDiagram\n A->>B: hi').lines[1].kind).toBe('unknown');
    expect(parseMermaid('%% c\n\nflowchart TD').lines.map(l => l.kind)).toEqual(['comment', 'blank', 'header']);
    expect(parseMermaid('%%{init: {"theme":"forest"}}%%\nflowchart TD').lines[0].kind).toBe('directive');
    expect(parseMermaid('---\ntitle: T\n---\nflowchart TD').lines.map(l => l.kind))
      .toEqual(['frontmatter', 'frontmatter', 'frontmatter', 'header']);
    expect(parseMermaid('flowchart TD\r\nA\r\n')).toMatchObject({ ok: true }); // CRLF
    expect(parseMermaid('flowchart TD\r\nA\r\n').lines.length).toBe(3);
    expect(parseMermaid('x'.repeat(20001))).toMatchObject({ ok: false, nodes: [] });
    expect(parseMermaid('flowchart TD\nA[Start]\nA[Begin]').nodes).toMatchObject([{ id: 'A', label: 'Begin' }]);
    expect(parseMermaid('flowchart TD\nA[Ünï code]').nodes[0].label).toBe('Ünï code');
    expect(parseMermaid('flowchart TD\nA[the end]').nodes[0].label).toBe('the end'); // Review Focus 1
  });
});
