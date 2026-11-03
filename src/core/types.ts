export type Direction = 'TB' | 'BT' | 'LR' | 'RL'; // "TD" in the text is read as 'TB'
export type ShapeKind =
  | 'rect' | 'round' | 'stadium' | 'circle' | 'diamond'
  | 'hexagon' | 'parallelogram' | 'parallelogramAlt' | 'cylinder' | 'subroutine'
  | 'trapezoid' | 'trapezoidAlt' | 'doubleCircle' | 'asymmetric' | 'document'
  | 'smallCircle' | 'filledCircle' | 'framedCircle' | 'forkBar' | 'text';
export type EdgeKind =
  | 'arrow' | 'open' | 'dottedArrow' | 'dotted' | 'thickArrow'
  | 'thick' | 'circleEnd' | 'crossEnd' | 'bidirectional'
  | 'dottedBidirectional' | 'thickBidirectional' | 'circleBoth' | 'crossBoth' | 'invisible';
export type StyleMap = Record<string, string>; // CSS-like, e.g. { fill: '#f9f', 'stroke-width': '2px' }

export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }

export interface GraphNode {
  id: string; label: string; shape: ShapeKind; classNames: string[];
  style: StyleMap; group: string | null; markdown: boolean;
  line: number; // 0-based index of the line where the node is first referenced
}
export interface EdgeAnim { animate: boolean | null; speed: 'fast' | 'slow' | null }
export interface NodeLink { url: string; tooltip: string | null; target: '_self' | '_blank' | '_parent' | '_top' }
export interface GraphEdge {
  id: string;    // `e${index}`
  index: number; // 0-based order of creation; matches linkStyle numbers
  from: string; to: string; kind: EdgeKind; label: string; length: number; style: StyleMap;
  ref: string | null;
  anim: EdgeAnim;
  markdown: boolean;
  fromIsGroup: boolean;
  toIsGroup: boolean;
  line: number;  // 0-based index of the line that defines the edge
}
export interface GraphGroup {
  id: string; title: string; parent: string | null; direction: Direction | null;
  directionLine?: number;
  markdown: boolean;
  line: number; // 0-based index of the `subgraph` line
}
export type LineKind =
  | 'frontmatter' | 'directive' | 'header' | 'blank' | 'comment' | 'pos' | 'statement'
  | 'subgraph' | 'end' | 'direction' | 'classDef' | 'class' | 'style' | 'linkStyle'
  | 'edgeProps' | 'click' | 'acc' | 'unknown';
export interface SourceLine {
  index: number; text: string; kind: LineKind;
  nodeIds: string[];     // nodes referenced on this line, in order, without duplicates
  edgeIndexes: number[]; // edges created on this line, in order
}
export interface Diagnostic { line: number; severity: 'error' | 'warning' | 'info'; message: string } // line is 1-based
export interface ParsedDoc {
  direction: Direction;
  nodes: GraphNode[]; edges: GraphEdge[]; groups: GraphGroup[];
  classDefs: Record<string, StyleMap>;
  pins: Record<string, Point>;
  title: string | null;
  accTitle: string | null;
  accDescr: string | null;
  links: Record<string, NodeLink>;
  explicitEdgeAnimation: boolean;
  lines: SourceLine[]; diagnostics: Diagnostic[];
  ok: boolean; // true when there is no diagnostic with severity 'error'
}

export interface NodeBox { id: string; center: Point; width: number; height: number; lines: string[] }
export interface GroupBox { id: string; rect: Rect; title: string; depth: number } // depth 0 = outermost
export interface EdgePath {
  id: string; kind: 'straight' | 'quad' | 'loop';
  from: Point; to: Point; control: Point | null; // control is null only for 'straight'
  labelPoint: Point; length: number;
}
export interface SceneLayout {
  nodes: Record<string, NodeBox>; groups: Record<string, GroupBox>;
  edges: Record<string, EdgePath>; bounds: Rect;
}
export interface Scene { doc: ParsedDoc; layout: SceneLayout }

export type ThemeId = 'daylight' | 'midnight' | 'lagoon' | 'ember';
export type ThemeChoice = ThemeId | 'auto'; // 'auto' ("Match page") is Daylight in the light page scheme and Midnight in the dark one
export type SchemePref = 'light' | 'dark' | 'auto'; // the saved choice of page colour scheme
export interface Theme {
  id: ThemeId; name: string; background: string; backgroundGradient: [string, string] | null;
  nodeFill: string; nodeStroke: string; nodeText: string;
  edge: string; edgeLabelBg: string; edgeLabelText: string;
  groupFill: string; groupStroke: string; groupTitle: string;
  particle: string; glow: string; selection: string; glowDefault: boolean;
}

export type AnimStyle = 'pulse' | 'traffic' | 'dash' | 'off';
export interface AnimSettings { style: AnimStyle; speed: number; density: number; glow: boolean }
export interface Particle { edgeId: string; u: number; alpha: number } // u: 0 at the start of the arrow, 1 at its head
export interface FrameState {
  particles: Particle[];
  dashOffset: number | null;         // a number only for style 'dash'; null otherwise
  nodeGlow: Record<string, number>;  // node id -> 0..1; absent means 0
}

export interface ViewState { zoom: number; panX: number; panY: number }
export interface Focus { nodes: string[]; edges: string[] }
export interface Selection { kind: 'node' | 'edge' | 'group'; id: string }
export interface DrawOptions {
  transparent: boolean; selection: Selection | null; handleNodeId: string | null;
  connectPreview: { from: Point; to: Point } | null; focus: Focus | null; showGlow: boolean;
}

export type ExportMode = 'content' | 'slide';
export interface ExportFrame { world: Rect; pixelWidth: number; pixelHeight: number; zoom: number }

export type TextOp =
  | { type: 'addNode'; label: string; shape: ShapeKind; pin?: Point }
  | { type: 'addEdge'; from: string; to: string; kind?: EdgeKind; label?: string }
  | { type: 'deleteNode'; id: string }
  | { type: 'deleteEdge'; index: number }
  | { type: 'renameNode'; id: string; label: string }
  | { type: 'renameEdge'; index: number; label: string }
  | { type: 'renameGroup'; id: string; title: string }
  | { type: 'setShape'; id: string; shape: ShapeKind }
  | { type: 'setEdgeKind'; index: number; kind: EdgeKind }
  | { type: 'reverseEdge'; index: number }
  | { type: 'setNodeStyle'; id: string; style: StyleMap }
  | { type: 'setPin'; id: string; x: number; y: number }
  | { type: 'clearPins' }
  | { type: 'setDirection'; direction: Direction };
export type TextOpResult = { text: string; createdId?: string } | { error: string };
