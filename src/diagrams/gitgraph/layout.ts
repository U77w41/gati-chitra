import { GIT } from '../../core/constants';
import type {
  Decoration, EdgePath, GroupBox, MeasureText, NodeBox, ParsedDoc, Point, SceneLayout,
} from '../../core/types';
import { growBounds } from '../../layout/decor-bounds';
import { borderPoint } from '../../layout/geometry';
import { computeBounds } from '../../layout/layout';
import { boxFor } from '../../layout/node-box';
import { makeEdgePath } from '../../layout/path';
import { placeTitle } from '../../layout/title';

export function layoutGitGraph(doc: ParsedDoc, measure: MeasureText): SceneLayout {
  const data = doc.data?.gitgraph;
  const rawBranches = data?.branches ?? [];
  const sortedBranches = [...rawBranches].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.colorIndex - b.colorIndex;
  });

  const laneMap = new Map<string, number>();
  sortedBranches.forEach((b, idx) => laneMap.set(b.name, idx));

  const commits = data?.commits ?? [];
  const maxOrdinal = Math.max(0, commits.length - 1);
  const dir = data?.direction ?? 'LR';

  const nodes: Record<string, NodeBox> = {};
  const commitBranchMap = new Map<string, string>();
  const nodesMap = new Map(doc.nodes.map((n) => [n.id, n]));

  for (const c of commits) {
    commitBranchMap.set(c.id, c.branch);
    const node = nodesMap.get(c.id);
    if (!node) continue;
    const lane = laneMap.get(c.branch) ?? 0;
    let cx = 0;
    let cy = 0;
    if (dir === 'LR') {
      cx = GIT.labelColW + c.ordinal * GIT.commitGap + GIT.commitGap / 2;
      cy = lane * GIT.laneGap;
    } else if (dir === 'TB') {
      cx = lane * GIT.laneGap;
      cy = 40 + c.ordinal * GIT.commitGap + GIT.commitGap / 2;
    } else {
      cx = lane * GIT.laneGap;
      cy = 40 + (maxOrdinal - c.ordinal) * GIT.commitGap + GIT.commitGap / 2;
    }
    nodes[c.id] = boxFor(node, measure, doc.direction, { x: cx, y: cy }, node.size);
  }

  const incomingEdges = new Map<string, string[]>();
  for (const edge of doc.edges) {
    const list = incomingEdges.get(edge.to) ?? [];
    list.push(edge.id);
    incomingEdges.set(edge.to, list);
  }

  const edges: Record<string, EdgePath> = {};
  for (const edge of doc.edges) {
    const pBox = nodes[edge.from];
    const cBox = nodes[edge.to];
    const pNode = nodesMap.get(edge.from);
    const cNode = nodesMap.get(edge.to);
    if (!pBox || !cBox || !pNode || !cNode) continue;

    const fromPt = borderPoint(pBox, pNode.shape, cBox.center);
    const toPt = borderPoint(cBox, cNode.shape, pBox.center);

    const pBranch = commitBranchMap.get(edge.from);
    const cBranch = commitBranchMap.get(edge.to);
    const sameBranch = pBranch === cBranch;

    let control: Point | null = null;
    if (!sameBranch) {
      const inc = incomingEdges.get(edge.to) ?? [];
      const isFirstParent = inc[0] === edge.id;
      if (isFirstParent) {
        control = dir === 'LR' ? { x: fromPt.x, y: toPt.y } : { x: toPt.x, y: fromPt.y };
      } else {
        control = dir === 'LR' ? { x: toPt.x, y: fromPt.y } : { x: fromPt.x, y: toPt.y };
      }
    }

    edges[edge.id] = makeEdgePath(edge.id, fromPt, toPt, control);
  }

  const laneDecorations: Decoration[] = [];
  const bandDecorations: Decoration[] = [];
  const captionDecorations: Decoration[] = [];
  const tagDecorations: Decoration[] = [];

  for (const branch of sortedBranches) {
    const lane = laneMap.get(branch.name) ?? 0;
    const branchCommits = commits.filter((c) => c.branch === branch.name);
    const lastCommit = branchCommits.length > 0 ? nodes[branchCommits[branchCommits.length - 1].id] : null;

    if (dir === 'LR') {
      const laneY = lane * GIT.laneGap;
      const lastX = lastCommit ? lastCommit.center.x + GIT.commitGap / 2 : GIT.labelColW - 8;
      laneDecorations.push({
        kind: 'line',
        role: 'lane',
        from: { x: GIT.labelColW - 8, y: laneY },
        to: { x: lastX, y: laneY },
        colorIndex: branch.colorIndex,
      });
      bandDecorations.push({
        kind: 'rect',
        role: 'band',
        rect: { x: 0, y: laneY - 12, width: GIT.labelColW - 16, height: 24 },
        radius: 12,
        label: branch.name,
        colorIndex: branch.colorIndex,
      });
    } else if (dir === 'TB') {
      const laneX = lane * GIT.laneGap;
      const lastY = lastCommit ? lastCommit.center.y + GIT.commitGap / 2 : 30;
      laneDecorations.push({
        kind: 'line',
        role: 'lane',
        from: { x: laneX, y: 30 },
        to: { x: laneX, y: lastY },
        colorIndex: branch.colorIndex,
      });
      bandDecorations.push({
        kind: 'rect',
        role: 'band',
        rect: { x: laneX - 40, y: 0, width: 80, height: 24 },
        radius: 12,
        label: branch.name,
        colorIndex: branch.colorIndex,
      });
    } else {
      const laneX = lane * GIT.laneGap;
      const bottomY = 40 + (maxOrdinal + 1) * GIT.commitGap + 10;
      laneDecorations.push({
        kind: 'line',
        role: 'lane',
        from: { x: laneX, y: 30 },
        to: { x: laneX, y: bottomY },
        colorIndex: branch.colorIndex,
      });
      bandDecorations.push({
        kind: 'rect',
        role: 'band',
        rect: { x: laneX - 40, y: bottomY, width: 80, height: 24 },
        radius: 12,
        label: branch.name,
        colorIndex: branch.colorIndex,
      });
    }
  }

  for (const c of commits) {
    const box = nodes[c.id];
    if (!box) continue;
    if (c.label) {
      if (dir === 'LR') {
        captionDecorations.push({
          kind: 'text',
          role: 'caption',
          at: { x: box.center.x, y: box.center.y + GIT.captionDrop },
          align: 'center',
          bold: false,
          text: c.label,
        });
      } else {
        captionDecorations.push({
          kind: 'text',
          role: 'caption',
          at: { x: box.center.x + 16, y: box.center.y },
          align: 'left',
          bold: false,
          text: c.label,
        });
      }
    }
    if (c.tag) {
      const tw = measure(c.tag, 12) + 16;
      tagDecorations.push({
        kind: 'rect',
        role: 'tag',
        rect: { x: box.center.x - tw / 2, y: box.center.y - GIT.tagLift - 10, width: tw, height: 20 },
        radius: 4,
        label: c.tag,
      });
    }
  }

  const decorations: Decoration[] = [
    ...laneDecorations,
    ...bandDecorations,
    ...captionDecorations,
    ...tagDecorations,
  ];

  const groups: Record<string, GroupBox> = {};
  let bounds = computeBounds(
    doc,
    { nodes, groups, edges, bounds: { x: 0, y: 0, width: 0, height: 0 }, title: null },
    measure,
  );
  bounds = growBounds(bounds, decorations);
  const placed = placeTitle(bounds, doc.title, measure);
  return { nodes, groups, edges, decorations, bounds: placed.bounds, title: placed.title };
}
