import { expect, it } from 'vitest';
import { LIMITS, LAYOUT, ANIM, EXPORT, SHARE, MESSAGES, SCHEME, BRAND } from './constants';

it('pins the limits', () => {
  expect(LIMITS.maxNodes).toBe(300);
  expect(LIMITS.maxEdges).toBe(600);
  expect(LIMITS.undoDepth).toBe(200);
});
it('pins layout and animation values', () => {
  expect(LAYOUT.rankSep).toBe(64);
  expect(LAYOUT.nodeSep).toBe(40);
  expect(ANIM.dashPattern).toEqual([8, 8]);
  expect(ANIM.spacingBase).toBe(640);
});
it('pins export values', () => {
  expect(EXPORT.gifMaxFrames).toBe(300);
  expect(EXPORT.slideWidth).toBe(1280);
  expect(EXPORT.pngScales).toEqual([1, 2, 3]);
});
it('builds messages', () => {
  expect(MESSAGES.unknownLine).toBe('Not understood; kept as written.');
  expect(MESSAGES.strayEnd).toBe('`end` without a matching subgraph.');
  expect(MESSAGES.duplicateGroupId('A', 'A_2')).toBe('Subgraph id "A" is already used, so this one is "A_2".');
  expect(MESSAGES.layoutFailed).toBe('The diagram could not be laid out. The last picture is kept.');
  expect(MESSAGES.unknownNode('Z')).toBe('Unknown node "Z".');
  expect(MESSAGES.groupTooDeep).toBe('Subgraph nesting is too deep (limit 4).');
  expect(MESSAGES.unknownEdge(5)).toBe('Unknown arrow 5.');
  expect(MESSAGES.groupsInText).toBe('Groups are edited in the text.');
  expect(MESSAGES.videoFailed('x')).toBe('Video export failed: x');
  expect(SCHEME.storageKey).toBe('StackColorScheme');
  expect(BRAND.name).toBe('Gati-chitra');
  expect(BRAND.tools.map(t => t.id)).toEqual(['diff', 'anurup']);
  expect(SHARE.prefix).toBe('v1=');
});
