import { MESSAGES } from '../../core/constants';
import type { DiagramEngine } from '../engine';
import { parseState } from './parse';

export const engine: DiagramEngine = {
  kind: 'state',
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
  parse: parseState,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
