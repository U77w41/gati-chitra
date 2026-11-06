import type { DiagramEngine } from '../engine';
import { layoutGitGraph } from './layout';
import {
  applyGitGraphOp,
  GITGRAPH_ADD_CHOICES,
  GITGRAPH_CAPS,
  GITGRAPH_EDGE_VARIANTS,
  GITGRAPH_SHAPE_CHOICES,
} from './ops';
import { parseGitGraph } from './parse';

export const engine: DiagramEngine = {
  kind: 'gitgraph',
  caps: GITGRAPH_CAPS,
  addChoices: GITGRAPH_ADD_CHOICES,
  shapeChoices: GITGRAPH_SHAPE_CHOICES,
  edgeVariants: GITGRAPH_EDGE_VARIANTS,
  parse: parseGitGraph,
  layout: layoutGitGraph,
  applyOp: applyGitGraphOp,
};
