import { describe, expect, it } from 'vitest';
import { stripFences } from './fences';

describe('stripFences', () => {
  it('strips fences', () => {
    expect(stripFences('```mermaid\nflowchart TD\nA\n```')).toBe('flowchart TD\nA');
    expect(stripFences('\n~~~ Mermaid\nflowchart TD\n~~~\n')).toBe('flowchart TD');
    expect(stripFences('```mermaid\nflowchart TD')).toBe('```mermaid\nflowchart TD');
    expect(stripFences('flowchart TD\nA')).toBe('flowchart TD\nA');
  });
});
