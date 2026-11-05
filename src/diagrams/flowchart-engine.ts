import { SHAPE_NAMES } from '../core/shapes';
import type { ShapeKind } from '../core/types';
import { applyOp } from '../mermaid/ops';
import { parseMermaid } from '../mermaid/parse';
import type { DiagramEngine } from './engine';

const choices = (Object.entries(SHAPE_NAMES) as [ShapeKind, string][]).map(
  ([value, name]) => ({ value, name }),
);

export const FLOWCHART_ENGINE: DiagramEngine = {
  kind: 'flowchart',
  caps: {
    add: true,
    connect: true,
    rename: true,
    delete: true,
    move: true,
    shape: true,
    style: true,
    edgeVariant: false,
    reverse: true,
  },
  addChoices: choices,
  shapeChoices: choices,
  edgeVariants: [],
  parse: parseMermaid,
  applyOp,
};
