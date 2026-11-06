import type { DiagramEngine } from '../engine';
import { parseUsecase } from './parse';
import {
  USECASE_ADD_CHOICES, USECASE_CAPS, USECASE_EDGE_VARIANTS,
  applyUsecaseOp,
} from './ops';

export const engine: DiagramEngine = {
  kind: 'usecase',
  caps: USECASE_CAPS,
  addChoices: USECASE_ADD_CHOICES,
  shapeChoices: [],
  edgeVariants: USECASE_EDGE_VARIANTS,
  parse: parseUsecase,
  applyOp: applyUsecaseOp,
};
