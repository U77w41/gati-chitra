import { MESSAGES } from '../../core/constants';
import type { DiagramEngine } from '../engine';
import { layoutMindmap } from './layout';
import { parseMindmap } from './parse';

export const engine: DiagramEngine = {
  kind: 'mindmap',
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
  parse: parseMindmap,
  layout: layoutMindmap,
  applyOp: () => ({ error: MESSAGES.opUnsupported }),
};
