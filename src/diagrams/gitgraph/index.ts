import { MESSAGES } from '../../core/constants';
import type { DiagramEngine } from '../engine';
import { layoutGitGraph } from './layout';
import { parseGitGraph } from './parse';

export const engine: DiagramEngine = {
  kind: 'gitgraph',
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
  parse: parseGitGraph,
  layout: layoutGitGraph,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
