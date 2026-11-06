import type { DiagramEngine } from '../engine';
import { layoutJourney } from './layout';
import {
  applyJourneyOp,
  JOURNEY_ADD_CHOICES,
  JOURNEY_CAPS,
  JOURNEY_EDGE_VARIANTS,
  JOURNEY_SHAPE_CHOICES,
} from './ops';
import { parseJourney } from './parse';

export const engine: DiagramEngine = {
  kind: 'journey',
  caps: JOURNEY_CAPS,
  addChoices: JOURNEY_ADD_CHOICES,
  shapeChoices: JOURNEY_SHAPE_CHOICES,
  edgeVariants: JOURNEY_EDGE_VARIANTS,
  parse: parseJourney,
  layout: layoutJourney,
  applyOp: applyJourneyOp,
};
