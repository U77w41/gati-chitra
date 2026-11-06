import type { DiagramEngine } from '../engine';
import { layoutSequence } from './layout';
import {
  applySequenceOp, SEQUENCE_ADD_CHOICES, SEQUENCE_CAPS,
  SEQUENCE_EDGE_VARIANTS, SEQUENCE_SHAPE_CHOICES,
} from './ops';
import { parseSequence } from './parse';

export const engine: DiagramEngine = {
  kind: 'sequence',
  caps: SEQUENCE_CAPS,
  addChoices: SEQUENCE_ADD_CHOICES,
  shapeChoices: SEQUENCE_SHAPE_CHOICES,
  edgeVariants: SEQUENCE_EDGE_VARIANTS,
  parse: parseSequence,
  layout: layoutSequence,
  applyOp: applySequenceOp,
};
