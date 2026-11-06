import type { DiagramEngine } from '../engine';
import { MESSAGES } from '../../core/constants';
import { parseEr } from './parse';

export const engine: DiagramEngine = {
  kind: 'er',
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
  parse: parseEr,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
