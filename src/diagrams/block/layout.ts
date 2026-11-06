import { BLOCK } from '../../core/constants';
import type { BlockItem } from '../../core/diagram-types';
import type {
  Decoration, GraphNode, GroupBox, MeasureText, NodeBox, ParsedDoc, SceneLayout,
} from '../../core/types';
import { growBounds } from '../../layout/decor-bounds';
import { routeEdges } from '../../layout/geometry';
import { computeBounds } from '../../layout/layout';
import { sizeNode } from '../../layout/measure';
import { boxFor } from '../../layout/node-box';
import { placeTitle } from '../../layout/title';

export function layoutBlock(doc: ParsedDoc, measure: MeasureText): SceneLayout {
  if (doc.nodes.length === 0) {
    return {
      nodes: {},
      groups: {},
      edges: {},
      decorations: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      title: null,
    };
  }

  let maxLeafW = 0;
  let maxLeafH = 0;
  for (const node of doc.nodes) {
    const s = sizeNode(node, measure, doc.direction);
    if (s.width > maxLeafW) maxLeafW = s.width;
    if (s.height > maxLeafH) maxLeafH = s.height;
  }
  const unitW = Math.max(BLOCK.minUnitW, maxLeafW);
  const unitH = maxLeafH;

  const nodeMap = new Map<string, GraphNode>(doc.nodes.map((n) => [n.id, n]));
  const nodes: Record<string, NodeBox> = {};
  const groups: Record<string, GroupBox> = {};

  function placeItems(
    items: BlockItem[],
    cols: number,
    uW: number,
    uH: number,
    x0: number,
    y0: number,
    depth: number,
  ): number {
    let c = 0;
    let rowTop = y0;
    let rowH = 0;

    for (const item of items) {
      const span = Math.min(item.span, cols);
      if (c + span > cols) {
        rowTop += rowH + BLOCK.gap;
        c = 0;
        rowH = 0;
      }
      const x = x0 + c * (uW + BLOCK.gap);
      const w = span * uW + (span - 1) * BLOCK.gap;

      if (item.type === 'node') {
        const node = nodeMap.get(item.id);
        if (node) {
          nodes[item.id] = boxFor(
            node,
            measure,
            doc.direction,
            { x: x + w / 2, y: rowTop + uH / 2 },
            { width: w, height: uH },
          );
        }
        rowH = Math.max(rowH, uH);
      } else if (item.type === 'space') {
        rowH = Math.max(rowH, uH);
      } else if (item.type === 'block') {
        const innerCols = item.columns ?? (item.children.length > 0 ? item.children.length : 1);
        const innerUnitW = (w - 2 * BLOCK.pad - (innerCols - 1) * BLOCK.gap) / innerCols;
        const innerH = placeItems(
          item.children,
          innerCols,
          innerUnitW,
          uH,
          x + BLOCK.pad,
          rowTop + BLOCK.pad,
          depth + 1,
        );
        const blockH = innerH + 2 * BLOCK.pad;
        groups[item.id] = {
          id: item.id,
          title: '',
          rect: { x, y: rowTop, width: w, height: blockH },
          depth,
        };
        rowH = Math.max(rowH, blockH);
      }

      c += span;
    }

    return (rowTop + rowH) - y0;
  }

  const blockData = doc.data?.block;
  const topItems = blockData?.items ?? [];
  const topCols = blockData?.columns ?? (topItems.length > 0 ? topItems.length : 1);

  placeItems(topItems, topCols, unitW, unitH, 0, 0, 0);

  const edges = routeEdges(doc, nodes, groups);
  const decorations: Decoration[] = [];
  let bounds = computeBounds(
    doc,
    { nodes, groups, edges, bounds: { x: 0, y: 0, width: 0, height: 0 }, title: null },
    measure,
  );
  bounds = growBounds(bounds, decorations);
  const placed = placeTitle(bounds, doc.title, measure);

  return { nodes, groups, edges, decorations, bounds: placed.bounds, title: placed.title };
}
