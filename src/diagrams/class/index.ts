import type { DiagramEngine } from '../engine';
import { parseClass } from './parse';
import {
  CLASS_ADD_CHOICES, CLASS_CAPS, CLASS_EDGE_VARIANTS, applyClassOp,
} from './ops';

export const engine: DiagramEngine = {
  kind: 'class',
  caps: CLASS_CAPS,
  addChoices: CLASS_ADD_CHOICES,
  shapeChoices: [],
  edgeVariants: CLASS_EDGE_VARIANTS,
  parse: parseClass,
  applyOp: applyClassOp,
};
