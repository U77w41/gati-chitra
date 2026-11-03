import { describe, expect, it } from 'vitest';
import { safeFilename } from './filename';

describe('safeFilename', () => {
  it('formats safe filenames', () => {
    expect(safeFilename('My Diagram!', 'png')).toBe('my-diagram.png');
    expect(safeFilename('', 'svg')).toBe('diagram.svg');
    expect(safeFilename('a/b\\c', 'gif')).toBe('a-b-c.gif');
    expect(safeFilename('  ', 'mp4')).toBe('diagram.mp4');
    expect(safeFilename('Flow.PNG', 'png')).toBe('flow.png');
    expect(safeFilename('ÜBER', 'png')).toBe('ber.png');
  });
});
