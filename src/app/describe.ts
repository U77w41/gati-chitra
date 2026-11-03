import type { ParsedDoc } from '../core/types';

export function describeDiagram(doc: ParsedDoc): { name: string; description: string } {
  const name = doc.accTitle ?? doc.title ?? 'Flowchart';
  const nNodes = doc.nodes.length;
  const nArrows = doc.edges.filter((e) => e.kind !== 'invisible').length;
  const nodeStr = `${nNodes} ${nNodes === 1 ? 'node' : 'nodes'}`;
  const arrowStr = `${nArrows} ${nArrows === 1 ? 'arrow' : 'arrows'}`;
  const countStr = `${nodeStr}, ${arrowStr}.`;
  const description = doc.accDescr ? `${doc.accDescr} ${countStr}` : countStr;
  return { name, description };
}
