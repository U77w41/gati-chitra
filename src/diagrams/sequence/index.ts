import type { DiagramEngine } from '../engine';
import { layoutSequence } from './layout';
import { parseSequence } from './parse';

export const engine: DiagramEngine = {
  kind: 'sequence',
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
  parse: parseSequence,
  layout: layoutSequence,
  applyOp: () => ({ error: 'Operation not supported' }),
};
