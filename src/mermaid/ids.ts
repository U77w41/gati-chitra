import type { ParsedDoc } from '../core/types';

export function nextNodeId(doc: ParsedDoc): string {
  let maxN = 0;
  for (const node of doc.nodes) {
    const match = /^n(\d+)$/.exec(node.id);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxN) {
        maxN = val;
      }
    }
  }
  return `n${maxN + 1}`;
}
