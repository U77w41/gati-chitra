import { MESSAGES } from '../../core/constants';
import type { DiagramEngine } from '../engine';
import { parseClass } from './parse';

export const engine: DiagramEngine = {
  kind: 'class',
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
  parse: parseClass,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
