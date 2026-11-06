import type { DiagramEngine } from '../engine';
import { parseState } from './parse';
import { STATE_CAPS, applyStateOp } from './ops';

export const engine: DiagramEngine = {
  kind: 'state',
  caps: STATE_CAPS,
  addChoices: [{ value: 'round', name: 'State' }],
  shapeChoices: [],
  edgeVariants: [],
  parse: parseState,
  applyOp: applyStateOp,
};
