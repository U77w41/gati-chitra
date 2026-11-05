import type { EdgeKind, FlowShapeKind, ShapeKind } from './types';

export const SHAPE_NAMES: Record<FlowShapeKind, string> = {
  rect: 'Rectangle',
  round: 'Rounded',
  stadium: 'Stadium',
  circle: 'Circle',
  diamond: 'Diamond',
  hexagon: 'Hexagon',
  parallelogram: 'Parallelogram',
  parallelogramAlt: 'Parallelogram reversed',
  cylinder: 'Cylinder',
  subroutine: 'Subroutine',
  trapezoid: 'Trapezoid',
  trapezoidAlt: 'Trapezoid reversed',
  doubleCircle: 'Double circle',
  asymmetric: 'Flag',
  document: 'Document',
  smallCircle: 'Start point',
  filledCircle: 'Junction',
  framedCircle: 'Stop point',
  forkBar: 'Fork or join',
  text: 'Text only',
};

export const SHAPE_SHORT: Record<FlowShapeKind, string> = {
  rect: 'rect',
  round: 'rounded',
  stadium: 'stadium',
  circle: 'circle',
  diamond: 'diam',
  hexagon: 'hex',
  parallelogram: 'lean-r',
  parallelogramAlt: 'lean-l',
  cylinder: 'cyl',
  subroutine: 'fr-rect',
  trapezoid: 'trap-b',
  trapezoidAlt: 'trap-t',
  doubleCircle: 'dbl-circ',
  asymmetric: 'odd',
  document: 'doc',
  smallCircle: 'sm-circ',
  filledCircle: 'f-circ',
  framedCircle: 'fr-circ',
  forkBar: 'fork',
  text: 'text',
};

export const EDGE_KIND_NAMES: Record<EdgeKind, string> = {
  arrow: 'Arrow',
  open: 'Line',
  dottedArrow: 'Dotted arrow',
  dotted: 'Dotted line',
  thickArrow: 'Thick arrow',
  thick: 'Thick line',
  circleEnd: 'Circle end',
  crossEnd: 'Cross end',
  bidirectional: 'Both ways',
  dottedBidirectional: 'Dotted, both ways',
  thickBidirectional: 'Thick, both ways',
  circleBoth: 'Circle ends',
  crossBoth: 'Cross ends',
  invisible: 'Invisible link',
};

export const SHAPE_ALIASES: Record<string, { shape: ShapeKind; approx: boolean }> = {};

function addAliases(keys: string, shape: ShapeKind, approx: boolean) {
  for (const k of keys.split(/\s+/)) {
    if (k) SHAPE_ALIASES[k.toLowerCase()] = { shape, approx };
  }
}

// Exact aliases
addAliases('rect proc process rectangle', 'rect', false);
addAliases('rounded event', 'round', false);
addAliases('stadium pill terminal', 'stadium', false);
addAliases('circle circ', 'circle', false);
addAliases('diam decision diamond question', 'diamond', false);
addAliases('hex hexagon prepare', 'hexagon', false);
addAliases('lean-r in-out lean-right', 'parallelogram', false);
addAliases('lean-l lean-left out-in', 'parallelogramAlt', false);
addAliases('cyl cylinder database db', 'cylinder', false);
addAliases('fr-rect framed-rectangle subproc subprocess subroutine', 'subroutine', false);
addAliases('trap-b priority trapezoid trapezoid-bottom', 'trapezoid', false);
addAliases('trap-t inv-trapezoid manual trapezoid-top', 'trapezoidAlt', false);
addAliases('dbl-circ double-circle', 'doubleCircle', false);
addAliases('odd', 'asymmetric', false);
addAliases('doc document', 'document', false);
addAliases('sm-circ small-circle start', 'smallCircle', false);
addAliases('f-circ filled-circle junction', 'filledCircle', false);
addAliases('fr-circ framed-circle stop', 'framedCircle', false);
addAliases('fork join', 'forkBar', false);
addAliases('text', 'text', false);

// Approximate aliases
addAliases('docs documents st-doc stacked-document lin-doc lined-document tag-doc tagged-document', 'document', true);
addAliases('h-cyl das horizontal-cylinder lin-cyl disk lined-cylinder datastore data-store', 'cylinder', true);
addAliases('cross-circ crossed-circle summary', 'framedCircle', true);
addAliases('flag paper-tape', 'asymmetric', true);
addAliases('delay half-rounded-rectangle curv-trap curved-trapezoid display cloud bang', 'round', true);
addAliases('notch-pent loop-limit notched-pentagon', 'hexagon', true);
addAliases('brace brace-l comment brace-r braces', 'text', true);
addAliases(
  'st-rect processes procs stacked-rectangle div-rect div-proc divided-process divided-rectangle lin-rect lin-proc lined-process lined-rectangle shaded-process tag-rect tag-proc tagged-process tagged-rectangle win-pane internal-storage window-pane notch-rect card notched-rectangle sl-rect manual-input sloped-rectangle bow-rect bow-tie-rectangle stored-data hourglass collate bolt com-link lightning-bolt tri extract triangle flip-tri flipped-triangle manual-file folder directory browser console bucket person',
  'rect',
  true
);

export function shapeFromName(name: string): { shape: ShapeKind; approx: boolean } | null {
  const cleaned = name.trim().toLowerCase();
  return SHAPE_ALIASES[cleaned] ?? null;
}
