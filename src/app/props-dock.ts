import { UI } from '../core/constants';

// On wide screens the canvas panel has a fixed height, so a properties panel inside it took its
// height from the canvas: selecting a node shrank the diagram and moved the node out from under
// the pointer. There it sits in the format section of the editor's Nodes tab instead. On phones it
// stays in the canvas panel, where it is a bottom sheet that must show over the Canvas tab.

export interface PropsDockEnv {
  props: Element;
  /** Where the panel goes on wide screens: the Nodes tab's format section. */
  wideParent: Element;
  canvasPanel: Element;
  /** The element that follows #props in the canvas panel markup. */
  anchor: Element | null;
}

export function placeProps(env: PropsDockEnv, wide: boolean): void {
  if (wide) {
    if (env.props.parentElement !== env.wideParent) env.wideParent.appendChild(env.props);
  } else if (env.props.parentElement !== env.canvasPanel) {
    env.canvasPanel.insertBefore(env.props, env.anchor);
  }
}

export function setupPropsDock(): void {
  if (typeof document === 'undefined' || typeof window.matchMedia !== 'function') return;
  const props = document.getElementById('props');
  const wideParent = document.getElementById('format-slot');
  const canvasPanel = document.getElementById('canvas-panel');
  if (!props || !wideParent || !canvasPanel) return;
  const env: PropsDockEnv = { props, wideParent, canvasPanel, anchor: document.getElementById('inline-edit') };
  const mql = window.matchMedia(`(min-width: ${UI.narrowBreakpoint}px)`);
  placeProps(env, mql.matches);
  mql.addEventListener('change', (e) => placeProps(env, e.matches));
}
