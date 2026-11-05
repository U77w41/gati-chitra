import type { ParsedDoc, Selection } from '../core/types';
import { SHAPE_NAMES } from '../core/shapes';
import { KIND_NAMES } from '../diagrams/kinds';

export function describeDiagram(doc: ParsedDoc): { name: string; description: string } {
  const kind = doc.kind ?? 'flowchart';
  const name =
    doc.accTitle ??
    doc.title ??
    (kind === 'flowchart' ? 'Flowchart' : `${KIND_NAMES[kind]} diagram`);
  const nNodes = doc.nodes.length;
  const nArrows = doc.edges.filter((e) => e.kind !== 'invisible').length;
  const nodeStr = `${nNodes} ${nNodes === 1 ? 'node' : 'nodes'}`;
  const arrowStr = `${nArrows} ${nArrows === 1 ? 'arrow' : 'arrows'}`;
  const countStr = `${nodeStr}, ${arrowStr}.`;
  const description = doc.accDescr ? `${doc.accDescr} ${countStr}` : countStr;
  return { name, description };
}

export function announceSelection(doc: ParsedDoc, sel: Selection | null): string {
  if (!sel) return 'No selection.';

  if (sel.kind === 'node') {
    const node = doc.nodes.find((n) => n.id === sel.id);
    if (!node) return 'No selection.';
    const shapeName = (SHAPE_NAMES as Record<string, string>)[node.shape] ?? 'Rectangle';
    const labelPart = node.label && node.label !== node.id ? `, ${node.label}` : '';
    const inCount = doc.edges.filter((e) => e.kind !== 'invisible' && e.to === node.id).length;
    const outCount = doc.edges.filter((e) => e.kind !== 'invisible' && e.from === node.id).length;
    return `Node ${node.id}${labelPart}, ${shapeName}. ${inCount} in, ${outCount} out.`;
  }

  if (sel.kind === 'edge') {
    const edge = doc.edges.find((e) => e.id === sel.id);
    if (!edge) return 'No selection.';
    const labelPart = edge.label ? `, ${edge.label}` : '';
    return `Arrow from ${edge.from} to ${edge.to}${labelPart}.`;
  }

  if (sel.kind === 'group') {
    const group = doc.groups.find((g) => g.id === sel.id);
    if (!group) return 'No selection.';
    return `Group ${group.title ?? group.id}.`;
  }

  return 'No selection.';
}
