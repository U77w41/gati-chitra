import type { DiagramEngine } from '../engine';
import { parseArchitecture } from './parse';
import { layoutArchitecture } from './layout';
import {
  ARCHITECTURE_ADD_CHOICES, ARCHITECTURE_CAPS,
  ARCHITECTURE_EDGE_VARIANTS, applyArchitectureOp,
} from './ops';

export const engine: DiagramEngine = {
  kind: 'architecture',
  caps: ARCHITECTURE_CAPS,
  addChoices: ARCHITECTURE_ADD_CHOICES,
  shapeChoices: [],
  edgeVariants: ARCHITECTURE_EDGE_VARIANTS,
  parse: parseArchitecture,
  layout: layoutArchitecture,
  applyOp: applyArchitectureOp,
};
