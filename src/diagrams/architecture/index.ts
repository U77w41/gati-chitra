import type { DiagramEngine } from '../engine';
import { parseArchitecture } from './parse';
import { layoutArchitecture } from './layout';

export const engine: DiagramEngine = {
  kind: 'architecture',
  caps: {
    add: false,
    connect: false,
    rename: false,
    delete: false,
    move: true,
    shape: false,
    style: false,
    edgeVariant: false,
    reverse: false,
  },
  addChoices: [],
  shapeChoices: [],
  edgeVariants: [],
  parse: parseArchitecture,
  layout: layoutArchitecture,
  applyOp: () => ({ error: 'Operation not supported' }),
};
