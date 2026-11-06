import { MESSAGES } from '../../core/constants';
import type { DiagramEngine } from '../engine';
import { layoutJourney } from './layout';
import { parseJourney } from './parse';

export const engine: DiagramEngine = {
  kind: 'journey',
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
  parse: parseJourney,
  layout: layoutJourney,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
