import type { DiagramEngine } from '../engine';
import { layoutBlock } from './layout';
import {
  applyBlockOp,
  BLOCK_ADD_CHOICES,
  BLOCK_CAPS,
  BLOCK_EDGE_VARIANTS,
  BLOCK_SHAPE_CHOICES,
} from './ops';
import { parseBlock } from './parse';

export const engine: DiagramEngine = {
  kind: 'block',
  caps: BLOCK_CAPS,
  addChoices: BLOCK_ADD_CHOICES,
  shapeChoices: BLOCK_SHAPE_CHOICES,
  edgeVariants: BLOCK_EDGE_VARIANTS,
  parse: parseBlock,
  layout: layoutBlock,
  applyOp: applyBlockOp,
};
