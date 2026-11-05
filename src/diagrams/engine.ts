import type { Choice, EditCaps } from '../core/diagram-types';
import type {
  DiagramKind,
  MeasureText,
  ParsedDoc,
  SceneLayout,
  ShapeKind,
  TextOp,
  TextOpResult,
} from '../core/types';

export interface DiagramEngine {
  kind: DiagramKind;
  caps: EditCaps;
  addChoices: Choice<ShapeKind>[]; // "Add node" list; the first entry is the default; [] when caps.add is false
  shapeChoices: Choice<ShapeKind>[]; // properties "Shape" list; [] when caps.shape is false
  edgeVariants: Choice[]; // properties "Arrow" list; [] when caps.edgeVariant is false
  parse(text: string): ParsedDoc; // sets doc.kind
  layout?: (doc: ParsedDoc, measure: MeasureText) => SceneLayout; // absent = shared dagre path
  applyOp(text: string, op: TextOp): TextOpResult; // unsupported op → { error: MESSAGES.opUnsupported }
}
