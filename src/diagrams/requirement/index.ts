import type { DiagramEngine } from '../engine';
import { parseRequirement } from './parse';
import {
  REQUIREMENT_ADD_CHOICES, REQUIREMENT_CAPS, REQUIREMENT_EDGE_VARIANTS,
  applyRequirementOp,
} from './ops';

export const engine: DiagramEngine = {
  kind: 'requirement',
  caps: REQUIREMENT_CAPS,
  addChoices: REQUIREMENT_ADD_CHOICES,
  shapeChoices: [],
  edgeVariants: REQUIREMENT_EDGE_VARIANTS,
  parse: parseRequirement,
  applyOp: applyRequirementOp,
};
