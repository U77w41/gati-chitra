import type { DiagramEngine } from '../engine';
import { parseUsecase } from './parse';

export const engine: DiagramEngine = {
  kind: 'usecase',
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
  parse: parseUsecase,
  applyOp: () => ({ error: 'Operation not supported' }),
};
