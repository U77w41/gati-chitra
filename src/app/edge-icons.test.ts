import { describe, expect, it } from 'vitest';
import { edgeIcon } from './edge-icons';

describe('edgeIcon', () => {
  it('returns valid svg markup for known edge kinds', () => {
    const arrow = edgeIcon('arrow');
    expect(arrow).toContain('<svg');
    expect(arrow).toContain('line');

    const dotted = edgeIcon('dottedArrow');
    expect(dotted).toContain('stroke-dasharray');

    const thick = edgeIcon('thickArrow');
    expect(thick).toContain('stroke-width="3.5"');
  });

  it('falls back to default line for unknown kinds', () => {
    const unknown = edgeIcon('someUnknownKind');
    expect(unknown).toContain('<svg');
    expect(unknown).toContain('line');
  });
});
