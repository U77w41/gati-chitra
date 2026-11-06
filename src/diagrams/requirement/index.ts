import type { DiagramEngine } from '../engine';
import { parseRequirement } from './parse';

export const engine: DiagramEngine = {
  kind: 'requirement',
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
  parse: parseRequirement,
  applyOp: () => ({ error: 'Operation not supported' }),
};
