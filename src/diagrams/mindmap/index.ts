import type { DiagramEngine } from '../engine';
import { layoutMindmap } from './layout';
import {
  applyMindmapOp,
  MINDMAP_ADD_CHOICES,
  MINDMAP_CAPS,
  MINDMAP_EDGE_VARIANTS,
  MINDMAP_SHAPE_CHOICES,
} from './ops';
import { parseMindmap } from './parse';

export const engine: DiagramEngine = {
  kind: 'mindmap',
  caps: MINDMAP_CAPS,
  addChoices: MINDMAP_ADD_CHOICES,
  shapeChoices: MINDMAP_SHAPE_CHOICES,
  edgeVariants: MINDMAP_EDGE_VARIANTS,
  parse: parseMindmap,
  layout: layoutMindmap,
  applyOp: applyMindmapOp,
};
