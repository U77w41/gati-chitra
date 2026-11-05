import type { DiagramKind } from '../../src/core/types';
import type { DiagramEngine } from '../../src/diagrams/engine';

export function fakeEngine(kind: DiagramKind): DiagramEngine {
  return {
    kind,
    caps: {
      add: true,
      connect: true,
      rename: true,
      delete: true,
      move: true,
      shape: true,
      style: true,
      edgeVariant: true,
      reverse: true,
    },
    addChoices: [{ value: 'rect', name: 'Rectangle' }],
    shapeChoices: [{ value: 'rect', name: 'Rectangle' }],
    edgeVariants: [{ value: '-->', name: 'Arrow' }],
    parse: () => ({
      direction: 'TB',
      nodes: [
        {
          id: 'F',
          label: 'fake',
          shape: 'rect',
          classNames: [],
          style: {},
          group: null,
          markdown: false,
          line: 0,
        },
      ],
      edges: [],
      groups: [],
      classDefs: {},
      pins: {},
      title: null,
      accTitle: null,
      accDescr: null,
      links: {},
      explicitEdgeAnimation: false,
      lines: [],
      diagnostics: [],
      ok: true,
      kind,
    }),
    layout: () => ({
      nodes: {
        F: {
          id: 'F',
          center: { x: 0, y: 0 },
          width: 80,
          height: 40,
          lines: ['fake'],
        },
      },
      groups: {},
      edges: {},
      bounds: { x: -40, y: -20, width: 80, height: 40 },
      title: null,
    }),
    applyOp: (text) => ({ text: text + '%% op\n' }),
  };
}
