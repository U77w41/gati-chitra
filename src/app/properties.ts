import type { EdgeKind, ShapeKind, TextOp } from '../core/types';
import { resolveTheme, THEMES } from '../render/themes';
import type { AppState } from './state';

export interface PropertiesEnv {
  panelEl: HTMLElement;
  getState: () => AppState;
  executeOp: (op: TextOp) => void;
}

function toHexColor(colorStr: string | undefined, fallback: string): string {
  if (!colorStr) return fallback;
  const s = colorStr.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function setupProperties(env: PropertiesEnv): () => void {
  const { panelEl, getState, executeOp } = env;

  const propLabel = panelEl.querySelector<HTMLInputElement>('#prop-label')!;
  const propShape = panelEl.querySelector<HTMLSelectElement>('#prop-shape')!;
  const propFill = panelEl.querySelector<HTMLInputElement>('#prop-fill')!;
  const propStroke = panelEl.querySelector<HTMLInputElement>('#prop-stroke')!;
  const propClearColours = panelEl.querySelector<HTMLButtonElement>('#prop-clear-colours')!;
  const propDelete = panelEl.querySelector<HTMLButtonElement>('#prop-delete')!;

  const propKind = panelEl.querySelector<HTMLSelectElement>('#prop-kind')!;
  const propReverse = panelEl.querySelector<HTMLButtonElement>('#prop-reverse')!;

  const nodeSection = panelEl.querySelector<HTMLElement>('#prop-section-node')!;
  const edgeSection = panelEl.querySelector<HTMLElement>('#prop-section-edge')!;

  function onCommitLabel(): void {
    const state = getState();
    const sel = state.editor.selection;
    if (!sel || !state.doc.ok) return;
    const val = propLabel.value;
    if (sel.kind === 'node') {
      const node = state.doc.nodes.find((n) => n.id === sel.id);
      if (node && node.label !== val) executeOp({ type: 'renameNode', id: sel.id, label: val });
    } else if (sel.kind === 'edge') {
      const idx = Number(sel.id.slice(1));
      const edge = state.doc.edges[idx];
      if (edge && (edge.label ?? '') !== val) executeOp({ type: 'renameEdge', index: idx, label: val });
    } else if (sel.kind === 'group') {
      const grp = state.doc.groups.find((g) => g.id === sel.id);
      if (grp && grp.title !== val) executeOp({ type: 'renameGroup', id: sel.id, title: val });
    }
  }

  propLabel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommitLabel();
      propLabel.blur();
    }
  });
  propLabel.addEventListener('blur', onCommitLabel);

  propShape.addEventListener('change', () => {
    const state = getState();
    const sel = state.editor.selection;
    if (sel?.kind === 'node' && state.doc.ok) {
      executeOp({ type: 'setShape', id: sel.id, shape: propShape.value as ShapeKind });
    }
  });

  propFill.addEventListener('change', () => {
    const state = getState();
    const sel = state.editor.selection;
    if (sel?.kind === 'node' && state.doc.ok) {
      executeOp({ type: 'setNodeStyle', id: sel.id, style: { fill: propFill.value } });
    }
  });

  propStroke.addEventListener('change', () => {
    const state = getState();
    const sel = state.editor.selection;
    if (sel?.kind === 'node' && state.doc.ok) {
      executeOp({ type: 'setNodeStyle', id: sel.id, style: { stroke: propStroke.value } });
    }
  });

  propClearColours.addEventListener('click', () => {
    const state = getState();
    const sel = state.editor.selection;
    if (sel?.kind === 'node' && state.doc.ok) {
      executeOp({ type: 'setNodeStyle', id: sel.id, style: { fill: '', stroke: '' } });
    }
  });

  propKind.addEventListener('change', () => {
    const state = getState();
    const sel = state.editor.selection;
    if (sel?.kind === 'edge' && state.doc.ok) {
      executeOp({ type: 'setEdgeKind', index: Number(sel.id.slice(1)), kind: propKind.value as EdgeKind });
    }
  });

  propReverse.addEventListener('click', () => {
    const state = getState();
    const sel = state.editor.selection;
    if (sel?.kind === 'edge' && state.doc.ok) {
      executeOp({ type: 'reverseEdge', index: Number(sel.id.slice(1)) });
    }
  });

  propDelete.addEventListener('click', () => {
    const state = getState();
    const sel = state.editor.selection;
    if (!sel || !state.doc.ok) return;
    if (sel.kind === 'node') executeOp({ type: 'deleteNode', id: sel.id });
    else if (sel.kind === 'edge') executeOp({ type: 'deleteEdge', index: Number(sel.id.slice(1)) });
  });

  return function update(): void {
    const state = getState();
    const sel = state.editor.selection;
    if (!sel) {
      panelEl.hidden = true;
      return;
    }
    panelEl.hidden = false;

    const disabled = !state.doc.ok;
    const inputs = panelEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
      'input, select, button',
    );
    for (const inp of inputs) inp.disabled = disabled;

    if (disabled) return;

    const scheme = document.documentElement.getAttribute('data-scheme') === 'dark' ? 'dark' : 'light';
    const theme = THEMES[resolveTheme(state.settings.theme, scheme)];

    if (sel.kind === 'node') {
      nodeSection.hidden = false;
      edgeSection.hidden = true;
      propDelete.hidden = false;
      const node = state.doc.nodes.find((n) => n.id === sel.id);
      if (node) {
        if (document.activeElement !== propLabel) propLabel.value = node.label;
        if (document.activeElement !== propShape) propShape.value = node.shape;
        if (document.activeElement !== propFill) propFill.value = toHexColor(node.style.fill, theme.nodeFill);
        if (document.activeElement !== propStroke) propStroke.value = toHexColor(node.style.stroke, theme.nodeStroke);
      }
    } else if (sel.kind === 'edge') {
      nodeSection.hidden = true;
      edgeSection.hidden = false;
      propDelete.hidden = false;
      const idx = Number(sel.id.slice(1));
      const edge = state.doc.edges[idx];
      if (edge) {
        if (document.activeElement !== propLabel) propLabel.value = edge.label ?? '';
        if (document.activeElement !== propKind) propKind.value = edge.kind;
      }
    } else if (sel.kind === 'group') {
      nodeSection.hidden = true;
      edgeSection.hidden = true;
      propDelete.hidden = true;
      const grp = state.doc.groups.find((g) => g.id === sel.id);
      if (grp) {
        if (document.activeElement !== propLabel) propLabel.value = grp.title;
      }
    }
  };
}
