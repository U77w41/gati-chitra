import { LAYOUT, SEQ } from '../../core/constants';
import type { SeqEvent } from '../../core/diagram-types';
import type { Decoration, GraphEdge, MeasureText } from '../../core/types';

export function widenColumns(
  events: SeqEvent[],
  edgesMap: Map<string, GraphEdge>,
  colMap: Map<string, number>,
  x: number[],
  n: number,
  measure: MeasureText,
): void {
  for (const ev of events) {
    if (ev.type !== 'message') continue;
    const edge = edgesMap.get(ev.edgeId);
    if (!edge) continue;
    const a = colMap.get(edge.from);
    const b = colMap.get(edge.to);
    if (a === undefined || b === undefined) continue;
    const labelW = measure(edge.label, LAYOUT.edgeLabelFontSize);
    if (a !== b) {
      const i = Math.min(a, b);
      const j = Math.max(a, b);
      const need = labelW + 2 * SEQ.messageLabelPad;
      if (x[j] - x[i] < need) {
        const shift = need - (x[j] - x[i]);
        for (let k = j; k < n; k++) x[k] += shift;
      }
    } else if (a + 1 < n) {
      const need = SEQ.selfLoopW + labelW + 2 * SEQ.messageLabelPad;
      if (x[a + 1] - x[a] < need) {
        const shift = need - (x[a + 1] - x[a]);
        for (let k = a + 1; k < n; k++) x[k] += shift;
      }
    }
  }
}

export function closeRemainingActivations(
  participantIds: string[],
  level: Record<string, number>,
  actStart: Record<string, number[]>,
  colMap: Map<string, number>,
  x: number[],
  lastY: number,
  activationDecorations: Decoration[],
): void {
  for (const id of participantIds) {
    while ((level[id] ?? 0) > 0) {
      const lev = level[id];
      const start = actStart[id].pop()!;
      const c = colMap.get(id) ?? 0;
      activationDecorations.push({
        kind: 'rect', role: 'activation',
        rect: {
          x: x[c] - SEQ.activationW / 2 + SEQ.activationStep * (lev - 1),
          y: start,
          width: SEQ.activationW,
          height: Math.max(lastY - start, 8),
        },
        radius: 2,
      });
      level[id] = lev - 1;
    }
  }
}

export function buildLifelines(n: number, x: number[], topH: number, endY: number): Decoration[] {
  const lifelines: Decoration[] = [];
  for (let i = 0; i < n; i++) {
    lifelines.push({
      kind: 'line', role: 'lifeline',
      from: { x: x[i], y: topH },
      to: { x: x[i], y: endY },
    });
  }
  return lifelines;
}

export function buildBoxes(
  boxes: { label?: string; members: string[] }[],
  colMap: Map<string, number>,
  x: number[],
  w: number[],
  endY: number,
): Decoration[] {
  const boxDecorations: Decoration[] = [];
  for (const box of boxes) {
    if (box.members.length === 0) continue;
    let lo = Infinity;
    let hi = -Infinity;
    for (const m of box.members) {
      const c = colMap.get(m);
      if (c !== undefined) {
        lo = Math.min(lo, c);
        hi = Math.max(hi, c);
      }
    }
    if (lo === Infinity) continue;
    const boxLeft = x[lo] - w[lo] / 2 - SEQ.boxPad;
    const boxRight = x[hi] + w[hi] / 2 + SEQ.boxPad;
    boxDecorations.push({
      kind: 'rect', role: 'frame',
      rect: {
        x: boxLeft,
        y: -SEQ.boxPad,
        width: boxRight - boxLeft,
        height: endY + 2 * SEQ.boxPad,
      },
      radius: 4,
      ...(box.label ? { label: box.label } : {}),
    });
  }
  return boxDecorations;
}
