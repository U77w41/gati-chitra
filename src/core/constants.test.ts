import { expect, it } from 'vitest';
import { LIMITS, LAYOUT, ANIM, EXPORT, SHARE, MESSAGES, SCHEME, BRAND, TOUCH, ARCH, BLOCK, GIT, JOURNEY, MINDMAP, SEQ, TIMELINE } from './constants';

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
  expect(EXPORT.ogWidth).toBe(1200);
  expect(EXPORT.ogHeight).toBe(630);
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
  expect(MESSAGES.updateReady).toBe('A new version is available.');
  expect(MESSAGES.offlineReady).toBe('Ready to work offline.');
  expect(SCHEME.storageKey).toBe('StackColorScheme');
  expect(BRAND.name).toBe('Gati-chitra');
  expect(BRAND.tools.map(t => t.id)).toEqual(['diff', 'anurup']);
  expect(SHARE.prefix).toBe('v1=');
  expect(TOUCH.hitTolerance).toBe(14);
  expect(TOUCH.handleRadius).toBe(12);
  expect(TOUCH.longPressMs).toBe(500);
  expect(TOUCH.slop).toBe(8);
  expect(TOUCH.doubleTapMs).toBe(300);
});

it('has the diagram layout constants', () => {
  expect(LAYOUT.sectionLineH).toBe(18);
  expect(LAYOUT.iconSize).toBe(32);
  expect(SEQ.participantGap).toBe(40);
  expect(SEQ.minParticipantW).toBe(100);
  expect(GIT.commitGap).toBe(60);
  expect(ARCH.gapX).toBe(80);
  expect(MINDMAP.levelGap).toBe(80);
  expect(BLOCK.minUnitW).toBe(80);
  expect(JOURNEY.scoreStep).toBe(36);
  expect(TIMELINE.colMinW).toBe(150);
});

it('has the diagram messages', () => {
  expect(MESSAGES.unsupportedDiagram('Pie chart')).toBe('Pie chart is not supported yet. Supported types: flowchart, sequence, class, state, ER, requirement, use case, architecture, block, gitGraph, journey, timeline and mindmap.');
  expect(MESSAGES.loadingDiagram('Sequence')).toBe('Loading support for Sequence diagrams.');
  expect(MESSAGES.opUnsupported).toBe('This change is not available for this diagram type. Edit the text instead.');
  expect(MESSAGES.notFlowchart).toBe("Not a diagram this app can read. Start with a type such as 'flowchart TD' or 'sequenceDiagram'.");
});

