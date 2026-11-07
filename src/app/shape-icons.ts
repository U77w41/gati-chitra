import type { ShapeKind } from '../core/types';

// Small outline drawings of each node shape for the add-node menu, on a 24 px grid. They use
// currentColor so both colour schemes follow, and they are decorative: the menu item's text names the shape.
const BODY: Record<ShapeKind, string> = {
  rect: '<rect x="3" y="6" width="18" height="12" rx="1"/>',
  round: '<rect x="3" y="6" width="18" height="12" rx="4"/>',
  stadium: '<rect x="2" y="6" width="20" height="12" rx="6"/>',
  circle: '<circle cx="12" cy="12" r="8.5"/>',
  diamond: '<path d="M12 3 21 12 12 21 3 12z"/>',
  hexagon: '<path d="M7 5h10l4 7-4 7H7l-4-7z"/>',
  parallelogram: '<path d="M7 6h14l-4 12H3z"/>',
  parallelogramAlt: '<path d="M3 6h14l4 12H7z"/>',
  cylinder: '<path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3v10c0 1.7-3.6 3-8 3s-8-1.3-8-3z"/><path d="M4 7c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  subroutine: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M6.5 6v12M17.5 6v12"/>',
  trapezoid: '<path d="M7 6h10l4 12H3z"/>',
  trapezoidAlt: '<path d="M3 6h18l-4 12H7z"/>',
  doubleCircle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/>',
  asymmetric: '<path d="M3 6h18v12H3l4-6z"/>',
  document: '<path d="M4 5h16v12c-2.7 2-5.3-1-8 0s-5.3 2-8 0z"/>',
  smallCircle: '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  filledCircle: '<circle cx="12" cy="12" r="6.5" fill="currentColor"/>',
  framedCircle: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/>',
  forkBar: '<rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor"/>',
  text: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  note: '<path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/>',
  actor: '<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V14M6 10h12M12 14l-4.5 6M12 14l4.5 6"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="10" ry="6.5"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A5.5 5.5 0 0 1 17 8.2 4 4 0 0 1 17.5 18z"/>',
  bang: '<path d="M12 2.5l2.2 4.3 4.6-1.3-1.2 4.6L22 12l-4.4 2 1.2 4.6-4.6-1.3L12 21.5l-2.2-4.2-4.6 1.3 1.2-4.6L2 12l4.4-1.9-1.2-4.6 4.6 1.3z"/>',
  blockArrow: '<path d="M3 9h11V5l7 7-7 7v-4H3z"/>',
};

const FALLBACK = '<rect class="shape-icon-fallback" x="4" y="6" width="16" height="12" rx="2" stroke-dasharray="3 2"/>';

export function shapeIcon(shape: string): string {
  const body = (BODY as Record<string, string>)[shape] ?? FALLBACK;
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
