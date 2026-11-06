import type { DiagramEngine } from '../engine';
import { parseEr } from './parse';
import {
  ER_ADD_CHOICES, ER_CAPS, ER_EDGE_VARIANTS, applyErOp,
} from './ops';

export const engine: DiagramEngine = {
  kind: 'er',
  caps: ER_CAPS,
  addChoices: ER_ADD_CHOICES,
  shapeChoices: [],
  edgeVariants: ER_EDGE_VARIANTS,
  parse: parseEr,
  applyOp: applyErOp,
};
