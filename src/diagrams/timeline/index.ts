import { MESSAGES } from '../../core/constants';
import type { DiagramEngine } from '../engine';
import { layoutTimeline } from './layout';
import { parseTimeline } from './parse';

export const engine: DiagramEngine = {
  kind: 'timeline',
  caps: {
    add: false,
    connect: false,
    rename: false,
    delete: false,
    move: false,
    shape: false,
    style: false,
    edgeVariant: false,
    reverse: false,
  },
  addChoices: [],
  shapeChoices: [],
  edgeVariants: [],
  parse: parseTimeline,
  layout: layoutTimeline,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
