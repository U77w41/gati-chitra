import { describe, expect, it } from 'vitest';
import { parseInlineMarkdown, wrapRuns } from './rich-text';
import type { MeasureText, TextRun } from '../core/types';

const R = (text: string, bold = false, italic = false): TextRun => ({ text, bold, italic });

describe('rich-text', () => {
  it('reads bold and italic', () => {
    expect(parseInlineMarkdown('**a** b *c* _d_')).toEqual([
      R('a', true),
      R(' b '),
      R('c', false, true),
      R(' '),
      R('d', false, true),
    ]);
    expect(parseInlineMarkdown('**a')).toEqual([R('**a')]);
    expect(parseInlineMarkdown('***a***')).toEqual([R('a', true, true)]);
  });

  it('wraps runs and keeps their style', () => {
    const m: MeasureText = (t: string) => t.length * 10;
    expect(wrapRuns([R('aaaa ', true), R('bbbb')], 50, 16, m)).toEqual([
      [R('aaaa', true)],
      [R('bbbb')],
    ]);
    expect(wrapRuns([R('x\ny')], 500, 16, m)).toEqual([[R('x')], [R('y')]]);
  });
});
