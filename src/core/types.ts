import type { DiagramData } from './diagram-types';
export type { DiagramData };

export type Direction = 'TB' | 'BT' | 'LR' | 'RL'; // "TD" in the text is read as 'TB'

export type DiagramKind =
  | 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'requirement' | 'usecase'
  | 'architecture' | 'block' | 'gitgraph' | 'journey' | 'timeline' | 'mindmap';

// The 20 shapes flowcharts can write. The toolbar and the flowchart text ops only ever use these.
export type FlowShapeKind =
  | 'rect' | 'round' | 'stadium' | 'circle' | 'diamond'
  | 'hexagon' | 'parallelogram' | 'parallelogramAlt' | 'cylinder' | 'subroutine'
  | 'trapezoid' | 'trapezoidAlt' | 'doubleCircle' | 'asymmetric' | 'document'
  | 'smallCircle' | 'filledCircle' | 'framedCircle' | 'forkBar' | 'text';
export type ExtraShapeKind = 'note' | 'actor' | 'ellipse' | 'cloud' | 'bang' | 'blockArrow';
export type ShapeKind = FlowShapeKind | ExtraShapeKind;

export type MarkerKind =
  | 'none' | 'arrow' | 'circle' | 'cross' | 'openArrow' | 'triangle' | 'diamond' | 'diamondFilled'
  | 'erOne' | 'erZeroOrOne' | 'erOneOrMore' | 'erZeroOrMore';

export type IconName =
  | 'cloud' | 'database' | 'disk' | 'internet' | 'server'
  | 'faceHappy' | 'faceNeutral' | 'faceSad' | 'cross';

export type BlockArrowDir = 'right' | 'left' | 'up' | 'down' | 'x' | 'y';

export interface Span { line: number; from: number; to: number } // 0-based line; character offsets in that line; `to` is exclusive

export interface NodeSection {
  rows: string[][];                       // each row is one or more cells; one cell = one text
  align: 'center' | 'left';
  weight: 'bold' | 'normal' | 'italic';
  divider: boolean;                       // draw a line above this section
}
export interface SectionBox extends NodeSection {
  top: number;                            // offset from the top of the node box
  height: number;
  colX: number[];                         // x offset of each column from the left of the node box
}

export type DecorationRole =
  | 'lifeline' | 'activation' | 'frame' | 'frameDivider' | 'band' | 'lane' | 'tag' | 'caption' | 'axis';
export type Decoration =
  | { kind: 'line'; role: DecorationRole; from: Point; to: Point; colorIndex?: number }
  | { kind: 'rect'; role: DecorationRole; rect: Rect; radius: number; label?: string; colorIndex?: number }
  | { kind: 'text'; role: DecorationRole; at: Point; text: string; align: 'left' | 'center'; bold: boolean; size?: number; colorIndex?: number };

export interface DocStages { nodes: Record<string, number>; edges: Record<string, number> }

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
  sections?: NodeSection[];      // compartments (class, ER, requirement); when set, the box shows these instead of `label`
  icon?: IconName;               // drawn above the label (or alone when the label is empty)
  size?: { width: number; height: number }; // fixed box size; sizeNode returns it unchanged
  colorIndex?: number;           // see Part 1.4 decision 7
  arrowDir?: BlockArrowDir;      // only for shape 'blockArrow'
  labelSpan?: Span;              // where the visible label is written in the text
  defSpan?: Span;                // block diagrams only: the whole item (id, shape, label, `:N`)
  refLines?: number[];           // 0-based lines that exist only for this node; deleted with it
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
  markers?: { start: MarkerKind; end: MarkerKind }; // when set, these replace the markers implied by `kind`
  endLabels?: { from?: string; to?: string };        // small texts near each end (class cardinality)
  variant?: string;              // the operator as the engine knows it, for example '<|--' or '||--o{'
  colorIndex?: number;
  labelSpan?: Span;
  opSpan?: Span;                 // where the operator is written (types with edge variants)
}
export interface GraphGroup {
  id: string; title: string; parent: string | null; direction: Direction | null;
  directionLine?: number;
  markdown: boolean;
  line: number; // 0-based index of the `subgraph` line
  labelSpan?: Span;
  endLine?: number;              // 0-based line that closes the group (`}` or `end`)
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
  kind?: DiagramKind;            // undefined means 'flowchart'
  stages?: DocStages;            // undefined means: use topological depth (today's behaviour)
  pending?: boolean;             // true while the engine for `kind` is loading
  data?: DiagramData;            // engine-specific data for custom layouts (src/core/diagram-types.ts)
}

export interface FontStyle { bold?: boolean; italic?: boolean }
export interface TextRun { text: string; bold: boolean; italic: boolean }
export type MeasureText = (text: string, fontSize: number, style?: FontStyle) => number;
export interface NodeBox {
  id: string; center: Point; width: number; height: number; lines: string[];
  runs?: TextRun[][];
  sections?: SectionBox[];
  arrowDir?: BlockArrowDir;      // copied from the node by the block layout; read by shapePolygon for 'blockArrow'
}
export interface GroupBox { id: string; rect: Rect; title: string; depth: number } // depth 0 = outermost
export interface EdgePath {
  id: string; kind: 'straight' | 'quad' | 'loop';
  from: Point; to: Point; control: Point | null; // control is null only for 'straight'
  labelPoint: Point; length: number;
}
export interface SceneLayout {
  nodes: Record<string, NodeBox>; groups: Record<string, GroupBox>;
  edges: Record<string, EdgePath>; bounds: Rect;
  title: { text: string; center: Point } | null;
  decorations?: Decoration[];
}
export interface Scene { doc: ParsedDoc; layout: SceneLayout }

export type ThemeId =
  | 'daylight'
  | 'geist'
  | 'flexoki'
  | 'latte'
  | 'matcha'
  | 'clay'
  | 'swiss'
  | 'midnight'
  | 'obsidian'
  | 'graphite'
  | 'tokyonight'
  | 'nordic'
  | 'rosepine'
  | 'monokai'
  | 'lagoon'
  | 'ember'
  | 'paper'
  | 'lavender';
export type ThemeChoice = ThemeId | 'auto'; // 'auto' ("Match page") is Daylight in the light page scheme and Midnight in the dark one
export type BackgroundChoice = 'match' | ThemeChoice;
export type SchemePref = 'light' | 'dark' | 'auto'; // the saved choice of page colour scheme
export type NodeShadeMode = 'shape' | 'semantic' | 'node' | 'off';
export type CardStyleMode = 'classic' | 'pipeline' | 'workflow';
export interface NodeShade {
  fill: string;
  stroke: string;
}
export interface Theme {
  id: ThemeId; name: string; background: string; backgroundGradient: [string, string] | null;
  nodeFill: string; nodeStroke: string; nodeText: string;
  nodeShades?: [NodeShade, NodeShade, NodeShade, NodeShade];
  shadingMode?: NodeShadeMode;
  edge: string; edgeLabelBg: string; edgeLabelText: string;
  groupFill: string; groupStroke: string; groupTitle: string;
  particle: string; glow: string; selection: string; glowDefault: boolean;
  gridColor: string;
  titleText?: string;
}

export type AnimStyle = 'pulse' | 'traffic' | 'dash' | 'build' | 'typewriter' | 'off';
export interface AnimSettings { style: AnimStyle; speed: number; density: number; glow: boolean }
export interface Particle { edgeId: string; u: number; alpha: number } // u: 0 at the start of the arrow, 1 at its head
export interface FrameState {
  particles: Particle[];
  dashOffset: number | null;         // a number only for style 'dash' or post-build flowing dashes; null otherwise
  nodeGlow: Record<string, number>;  // node id -> 0..1; absent means 0
  titleChars?: number;
  nodeAlpha?: Record<string, number>;
  nodeTextProgress?: Record<string, number>;
  edgeGrow?: Record<string, number>;
  edgeTextProgress?: Record<string, number>;
}

export interface ViewState { zoom: number; panX: number; panY: number }
export interface Focus { nodes: string[]; edges: string[] }
export interface Selection { kind: 'node' | 'edge' | 'group'; id: string }
export interface DrawOptions {
  transparent: boolean; selection: Selection | null; handleNodeId: string | null;
  connectPreview: { from: Point; to: Point } | null; focus: Focus | null; showGlow: boolean;
  showGrid?: boolean;
  cardMode?: CardStyleMode;
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
  | { type: 'setDirection'; direction: Direction }
  | { type: 'setEdgeVariant'; index: number; variant: string };
export type TextOpResult = { text: string; createdId?: string } | { error: string };
