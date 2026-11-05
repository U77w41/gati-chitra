import { expect, it } from 'vitest';
import { testMeasure } from '../../tests/support/measure';
import { sizeSections } from './sections';

it('sizes a class box', () => {
  const r = sizeSections([
    { rows: [['Animal']], align: 'center', weight: 'bold', divider: false },
    { rows: [['+int age']], align: 'left', weight: 'normal', divider: true },
    { rows: [['+eat() void']], align: 'left', weight: 'normal', divider: true },
  ], testMeasure);
  expect([r.width, r.height]).toEqual([112, 90]);
  expect(r.sections.map((s) => s.top)).toEqual([0, 30, 60]);
});

it('aligns table columns and drops empty ones', () => {
  const r = sizeSections([
    { rows: [['CUSTOMER']], align: 'center', weight: 'bold', divider: false },
    { rows: [['string', 'name', 'PK', ''], ['int', 'id', '', '']], align: 'left', weight: 'normal', divider: true },
  ], testMeasure);
  expect([r.width, r.height]).toEqual([144, 78]);
  expect(r.sections[1].colX).toEqual([12, 72, 116]);
  expect(r.sections[1].rows[0]).toEqual(['string', 'name', 'PK']);
});

it('gives an empty section its minimum height', () => {
  expect(sizeSections([{ rows: [], align: 'left', weight: 'normal', divider: true }], testMeasure).height).toBe(12);
});
