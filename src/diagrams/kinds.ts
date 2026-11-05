import type { DiagramKind } from '../core/types';

export const KIND_NAMES: Record<DiagramKind, string> = {
  flowchart: 'Flowchart',
  sequence: 'Sequence',
  class: 'Class',
  state: 'State',
  er: 'ER',
  requirement: 'Requirement',
  usecase: 'Use case',
  architecture: 'Architecture',
  block: 'Block',
  gitgraph: 'Git graph',
  journey: 'User journey',
  timeline: 'Timeline',
  mindmap: 'Mindmap',
};

// Tested in order; the first match wins. Each pattern is matched against the trimmed header line.
export const HEADER_PATTERNS: [DiagramKind, RegExp][] = [
  ['flowchart', /^(flowchart|graph)\b/],
  ['sequence', /^sequenceDiagram\s*$/],
  ['class', /^classDiagram(-v2)?\s*$/],
  ['state', /^stateDiagram(-v2)?\s*$/],
  ['er', /^erDiagram\s*$/],
  ['requirement', /^requirementDiagram\s*$/],
  ['usecase', /^usecase-beta\s*$/],
  ['architecture', /^architecture-beta\s*$/],
  ['block', /^block(-beta)?\s*$/],
  ['gitgraph', /^gitGraph(\s+(LR|TB|BT))?\s*:?\s*$/],
  ['journey', /^journey\s*$/],
  ['timeline', /^timeline(\s+(LR|TD))?\s*$/],
  ['mindmap', /^mindmap\s*$/],
];

export const UNSUPPORTED_HEADERS: [RegExp, string][] = [
  [/^gantt\b/, 'Gantt chart'],
  [/^pie\b/, 'Pie chart'],
  [/^quadrantChart\b/, 'Quadrant chart'],
  [/^xychart(-beta)?\b/, 'XY chart'],
  [/^sankey(-beta)?\b/, 'Sankey diagram'],
  [/^packet(-beta)?\b/, 'Packet diagram'],
  [/^kanban\b/, 'Kanban board'],
  [/^radar(-beta)?\b/, 'Radar chart'],
  [/^treemap(-beta)?\b/, 'Treemap'],
  [/^C4(Context|Container|Component|Dynamic|Deployment)\b/, 'C4 diagram'],
  [/^zenuml\b/, 'ZenUML diagram'],
  [/^venn(-beta)?\b/, 'Venn diagram'],
];
