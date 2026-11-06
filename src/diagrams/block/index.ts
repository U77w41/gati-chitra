import { MESSAGES } from '../../core/constants';
import type { DiagramEngine } from '../engine';
import { layoutBlock } from './layout';
import { parseBlock } from './parse';

export const engine: DiagramEngine = {
  kind: 'block',
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
  parse: parseBlock,
  layout: layoutBlock,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
