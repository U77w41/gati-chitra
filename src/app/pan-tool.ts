// The Move button in the canvas's bottom-right corner (#btn-pan) is a tool you switch on: while it
// is on, dragging anywhere on the canvas moves the view, even when the drag starts on a node.
// Mouse drags reuse the controller's Space-held pan; touch drags skip their node hit test.

export function panToolOn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.getElementById('btn-pan')?.getAttribute('aria-pressed') === 'true';
}

export function setupPanTool(): void {
  if (typeof document === 'undefined') return;
  const btn = document.getElementById('btn-pan');
  btn?.addEventListener('click', () => btn.setAttribute('aria-pressed', panToolOn() ? 'false' : 'true'));
}
