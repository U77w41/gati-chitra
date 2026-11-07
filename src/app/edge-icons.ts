// Small SVG outline drawings of each connector / edge kind for the edge palette.
// Uses currentColor so both light and dark colour schemes follow.

const BODY: Record<string, string> = {
  arrow: '<line x1="2" y1="8" x2="23" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="18,4 23,8 18,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  open: '<line x1="2" y1="8" x2="26" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  dottedArrow: '<line x1="2" y1="8" x2="23" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3"/><polyline points="18,4 23,8 18,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  dotted: '<line x1="2" y1="8" x2="26" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3"/>',
  thickArrow: '<line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><polygon points="19,4 26,8 19,12" fill="currentColor" stroke="none"/>',
  thick: '<line x1="2" y1="8" x2="26" y2="8" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>',
  bidirectional: '<polyline points="8,4 3,8 8,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="8" x2="25" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="20,4 25,8 20,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  dottedBidirectional: '<polyline points="8,4 3,8 8,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="8" x2="25" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3"/><polyline points="20,4 25,8 20,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  thickBidirectional: '<polygon points="7,4 1,8 7,12" fill="currentColor" stroke="none"/><line x1="5" y1="8" x2="23" y2="8" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><polygon points="21,4 27,8 21,12" fill="currentColor" stroke="none"/>',
  circleEnd: '<line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="23" cy="8" r="3" fill="currentColor"/>',
  crossEnd: '<line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="5" x2="26" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="26" y1="5" x2="20" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  circleBoth: '<circle cx="5" cy="8" r="3" fill="currentColor"/><line x1="8" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="23" cy="8" r="3" fill="currentColor"/>',
  crossBoth: '<line x1="2" y1="5" x2="8" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="5" x2="2" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="5" x2="26" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="26" y1="5" x2="20" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  invisible: '<line x1="2" y1="8" x2="26" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1 4" opacity="0.5"/>',
};

const FALLBACK = '<line x1="2" y1="8" x2="23" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="18,4 23,8 18,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

export function edgeIcon(kind: string): string {
  const body = BODY[kind] ?? FALLBACK;
  return `<svg viewBox="0 0 28 16" width="28" height="16" fill="none" stroke="currentColor" aria-hidden="true">${body}</svg>`;
}
