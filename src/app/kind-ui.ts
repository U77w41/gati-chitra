import type { Choice, EditCaps } from '../core/diagram-types';
import { EDGE_KIND_NAMES } from '../core/shapes';
import type { DiagramKind, ParsedDoc, ShapeKind } from '../core/types';
import type { DiagramEngine } from '../diagrams/engine';
import { FLOWCHART_ENGINE } from '../diagrams/flowchart-engine';
import { getEngine } from '../diagrams/registry';

export function engineOf(doc: ParsedDoc): DiagramEngine {
  return getEngine(doc.kind ?? 'flowchart') ?? FLOWCHART_ENGINE;
}

export function capsOf(doc: ParsedDoc): EditCaps {
  return engineOf(doc).caps;
}

export function kindControlModel(doc: ParsedDoc): {
  kind: DiagramKind;
  caps: EditCaps;
  addChoices: Choice<ShapeKind>[];
  shapeChoices: Choice<ShapeKind>[];
  edgeChoices: Choice[];
  cardEnabled: boolean;
} {
  const engine = engineOf(doc);
  const kind = doc.kind ?? 'flowchart';
  const isFlowchart = kind === 'flowchart';
  const edgeChoices: Choice[] = isFlowchart
    ? Object.entries(EDGE_KIND_NAMES).map(([value, name]) => ({ value, name }))
    : engine.edgeVariants;

  return {
    kind,
    caps: engine.caps,
    addChoices: engine.addChoices,
    shapeChoices: engine.shapeChoices,
    edgeChoices,
    cardEnabled: isFlowchart,
  };
}

let lastSeenKind: DiagramKind | null = null;
// A type's engine can load after its first parse, which used the flowchart fallback lists, so the
// lists are refilled when the engine changes as well as when the type does.
let lastSeenEngine: DiagramEngine | null = null;

export function syncKindControls(doc: ParsedDoc): void {
  if (typeof document === 'undefined') return;
  const model = kindControlModel(doc);
  const addShapeEl = document.querySelector<HTMLSelectElement>('#add-shape');
  const btnAutolayout = document.querySelector<HTMLButtonElement>('#btn-autolayout');
  const cardModeEl = document.querySelector<HTMLSelectElement>('#card-mode');
  const propShapeEl = document.querySelector<HTMLSelectElement>('#prop-shape');
  const propKindEl = document.querySelector<HTMLSelectElement>('#prop-kind');

  const engine = engineOf(doc);
  if (model.kind !== lastSeenKind || engine !== lastSeenEngine) {
    lastSeenKind = model.kind;
    lastSeenEngine = engine;
    if (addShapeEl) {
      addShapeEl.innerHTML = '';
      for (const choice of model.addChoices) {
        const opt = document.createElement('option');
        opt.value = choice.value;
        opt.textContent = choice.name;
        addShapeEl.appendChild(opt);
      }
    }
    if (propShapeEl) {
      propShapeEl.innerHTML = '';
      for (const choice of model.shapeChoices) {
        const opt = document.createElement('option');
        opt.value = choice.value;
        opt.textContent = choice.name;
        propShapeEl.appendChild(opt);
      }
    }
    if (propKindEl) {
      propKindEl.innerHTML = '';
      for (const choice of model.edgeChoices) {
        const opt = document.createElement('option');
        opt.value = choice.value;
        opt.textContent = choice.name;
        propKindEl.appendChild(opt);
      }
    }
  }

  if (addShapeEl) addShapeEl.disabled = !model.caps.add;
  if (btnAutolayout && !model.caps.move) {
    btnAutolayout.disabled = true;
  }
  if (cardModeEl) {
    if (!model.cardEnabled) {
      cardModeEl.disabled = true;
      cardModeEl.title = 'Card styles apply to flowcharts';
    } else {
      cardModeEl.disabled = false;
      cardModeEl.title = '';
    }
  }
}

function toggleCapControl(panelEl: HTMLElement, selector: string, allowed: boolean): void {
  const el = panelEl.querySelector<HTMLElement>(selector);
  if (!el) return;
  const id = el.id;
  const label = id ? panelEl.querySelector<HTMLElement>(`label[for="${id}"]`) : null;
  if (!allowed) {
    el.hidden = true;
    el.dataset.capsHidden = 'true';
    if (label) {
      label.hidden = true;
      label.dataset.capsHidden = 'true';
    }
  } else {
    if (el.dataset.capsHidden) {
      el.hidden = false;
      delete el.dataset.capsHidden;
    }
    if (label && label.dataset.capsHidden) {
      label.hidden = false;
      delete label.dataset.capsHidden;
    }
  }
}

export function applyCapsToProps(panelEl: HTMLElement, caps: EditCaps, isFlowchart = true): void {
  toggleCapControl(panelEl, '#prop-shape', caps.shape);
  toggleCapControl(panelEl, '#prop-fill', caps.style);
  toggleCapControl(panelEl, '#prop-stroke', caps.style);
  toggleCapControl(panelEl, '#prop-text-color', caps.style);
  toggleCapControl(panelEl, '#prop-clear-colours', caps.style);
  toggleCapControl(panelEl, '#prop-connect', caps.connect);
  toggleCapControl(panelEl, '#prop-connect-go', caps.connect);
  toggleCapControl(panelEl, '#prop-kind', isFlowchart || caps.edgeVariant);
  toggleCapControl(panelEl, '#prop-reverse', caps.reverse);
  toggleCapControl(panelEl, '#prop-delete', caps.delete);

  const propLabel = panelEl.querySelector<HTMLInputElement>('#prop-label');
  if (propLabel && !caps.rename) {
    propLabel.disabled = true;
  }
}
