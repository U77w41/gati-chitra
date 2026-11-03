import { describe, expect, it } from 'vitest';
import { parseStyleString } from './styles';

describe('styles', () => {
  it('parses style strings', () => {
    expect(parseStyleString('fill:#f9f,stroke:#333,stroke-width:4px;')).toEqual({
      fill: '#f9f',
      stroke: '#333',
      'stroke-width': '4px',
    });
    expect(parseStyleString('fill:rgb(1,2,3),color:#fff')).toEqual({
      fill: 'rgb(1,2,3)',
      color: '#fff',
    });
    expect(parseStyleString('stroke-dasharray: 5 5')).toEqual({ 'stroke-dasharray': '5 5' });
    expect(parseStyleString('')).toEqual({});
  });
});
