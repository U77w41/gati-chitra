import type { DiagramEngine } from '../engine';
import { layoutTimeline } from './layout';
import {
  applyTimelineOp,
  TIMELINE_ADD_CHOICES,
  TIMELINE_CAPS,
  TIMELINE_EDGE_VARIANTS,
  TIMELINE_SHAPE_CHOICES,
} from './ops';
import { parseTimeline } from './parse';

export const engine: DiagramEngine = {
  kind: 'timeline',
  caps: TIMELINE_CAPS,
  addChoices: TIMELINE_ADD_CHOICES,
  shapeChoices: TIMELINE_SHAPE_CHOICES,
  edgeVariants: TIMELINE_EDGE_VARIANTS,
  parse: parseTimeline,
  layout: layoutTimeline,
  applyOp: applyTimelineOp,
};
