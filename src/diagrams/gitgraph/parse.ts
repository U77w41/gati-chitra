import { GIT, MESSAGES } from '../../core/constants';
import type { GitGraphData } from '../../core/diagram-types';
import type {
  Direction, GraphEdge, GraphNode, ParsedDoc, ShapeKind, Span,
} from '../../core/types';
import {
  checkLimits, commonLine, finishDoc, makeEdge, makeNode, newCommonState,
  readPrelude,
} from '../common/prelude';
import {
  BRANCH_RE, CHECKOUT_RE, CHERRY_PICK_RE, COMMIT_RE, HEADER_RE, MERGE_RE,
} from './patterns';

interface BranchInfo {
  name: string;
  colorIndex: number;
  order: number;
  head: string | null;
}

interface CommitAttrs {
  id?: string;
  idSpan?: Span;
  type?: string;
  tag?: string;
  msg?: string;
  order?: number;
}

function parseAttrs(raw: string, line: number): CommitAttrs {
  const ATTR_RE = /(id|type|tag|msg|order|parent)\s*:\s*("([^"]*)"|[\w.-]+)/dg;
  const result: CommitAttrs = {};
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(raw)) !== null) {
    const key = m[1];
    const val = m[3] ?? m[2];
    if (key === 'id') {
      result.id = val;
      if (m[3] !== undefined) {
        const indices = (m as unknown as { indices?: [number, number][] }).indices;
        if (indices && indices[3]) {
          result.idSpan = { line, from: indices[3][0], to: indices[3][1] };
        }
      }
    } else if (key === 'type') {
      result.type = val;
    } else if (key === 'tag') {
      result.tag = val;
    } else if (key === 'msg') {
      result.msg = val;
    } else if (key === 'order') {
      const num = Number(val);
      if (!Number.isNaN(num)) result.order = num;
    }
  }
  return result;
}

export function parseGitGraph(text: string): ParsedDoc {
  const p = readPrelude(text, HEADER_RE);
  if ('ok' in p) return p;

  const headerMatch = HEADER_RE.exec(p.headerText.trim());
  const direction = (headerMatch?.[1] as Direction) ?? 'LR';

  const st = newCommonState();
  const branches: BranchInfo[] = [{ name: 'main', colorIndex: 0, order: 0, head: null }];
  const branchMap = new Map<string, BranchInfo>();
  branchMap.set('main', branches[0]);
  let currentBranch = branches[0];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const commits: GitGraphData['commits'] = [];
  const stageNodes: Record<string, number> = {};
  const stageEdges: Record<string, number> = {};

  let commitCounter = 0;
  let edgeCounter = 0;

  for (let i = p.headerIdx + 1; i < p.rawLines.length; i++) {
    const raw = p.rawLines[i];
    if (commonLine(raw, i, p.lines, st)) continue;
    const t = raw.trim();

    const branchMatch = BRANCH_RE.exec(t);
    if (branchMatch) {
      p.lines[i].kind = 'statement';
      const name = branchMatch[2];
      if (branchMap.has(name)) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.gitBranchExists(name) });
        continue;
      }
      const attrs = parseAttrs(branchMatch[3] ?? '', i);
      const colorIndex = branches.length;
      const order = attrs.order ?? colorIndex;
      const bInfo: BranchInfo = { name, colorIndex, order, head: currentBranch.head };
      branches.push(bInfo);
      branchMap.set(name, bInfo);
      currentBranch = bInfo;
      continue;
    }

    const checkMatch = CHECKOUT_RE.exec(t);
    if (checkMatch) {
      p.lines[i].kind = 'statement';
      const name = checkMatch[2];
      const target = branchMap.get(name);
      if (!target) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.gitNoBranch(name) });
        continue;
      }
      currentBranch = target;
      continue;
    }

    const mergeMatch = MERGE_RE.exec(t);
    if (mergeMatch) {
      p.lines[i].kind = 'statement';
      const targetName = mergeMatch[2];
      const targetBranch = branchMap.get(targetName);
      if (!targetBranch || targetName === currentBranch.name || targetBranch.head === null) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.gitMergeInvalid(targetName) });
        continue;
      }
      if (!checkLimits(nodes, edges, p.diagnostics, i + 1)) continue;

      const attrs = parseAttrs(mergeMatch[3] ?? '', i);
      const commitId = `c${commitCounter}`;
      const ordinal = commitCounter++;
      const label = attrs.id ?? '';
      const tag = attrs.tag ?? null;

      const node = makeNode(commitId, label, 'doubleCircle', i, {
        size: { width: GIT.mergeD, height: GIT.mergeD },
        colorIndex: currentBranch.colorIndex,
        labelSpan: attrs.idSpan,
        refLines: [i],
      });
      nodes.push(node);
      stageNodes[commitId] = ordinal;

      if (currentBranch.head !== null) {
        const e1 = makeEdge(edgeCounter++, currentBranch.head, commitId, 'thick', '', i, {
          colorIndex: currentBranch.colorIndex,
          markers: { start: 'none', end: 'none' },
        });
        edges.push(e1);
        stageEdges[e1.id] = ordinal;
      }

      const e2 = makeEdge(edgeCounter++, targetBranch.head, commitId, 'thick', '', i, {
        colorIndex: targetBranch.colorIndex,
        markers: { start: 'none', end: 'none' },
      });
      edges.push(e2);
      stageEdges[e2.id] = ordinal;

      currentBranch.head = commitId;
      commits.push({ id: commitId, branch: currentBranch.name, ordinal, tag, label });
      continue;
    }

    const cherryMatch = CHERRY_PICK_RE.exec(t);
    if (cherryMatch) {
      p.lines[i].kind = 'statement';
      const attrs = parseAttrs(cherryMatch[1] ?? '', i);
      const targetId = attrs.id;
      const targetNode = targetId ? nodes.find((n) => n.id === targetId || n.label === targetId) : undefined;
      if (!targetNode) {
        p.diagnostics.push({ line: i + 1, severity: 'error', message: MESSAGES.gitNoCommit(targetId ?? '') });
        continue;
      }
      if (!checkLimits(nodes, edges, p.diagnostics, i + 1)) continue;

      const commitId = `c${commitCounter}`;
      const ordinal = commitCounter++;
      const label = `cherry-pick: ${targetNode.id}`;
      const node = makeNode(commitId, label, 'filledCircle', i, {
        size: { width: GIT.commitD, height: GIT.commitD },
        colorIndex: currentBranch.colorIndex,
        refLines: [i],
      });
      nodes.push(node);
      stageNodes[commitId] = ordinal;

      if (currentBranch.head !== null) {
        const e1 = makeEdge(edgeCounter++, currentBranch.head, commitId, 'thick', '', i, {
          colorIndex: currentBranch.colorIndex,
          markers: { start: 'none', end: 'none' },
        });
        edges.push(e1);
        stageEdges[e1.id] = ordinal;
      }

      const e2 = makeEdge(edgeCounter++, targetNode.id, commitId, 'dotted', '', i, {
        colorIndex: currentBranch.colorIndex,
      });
      edges.push(e2);
      stageEdges[e2.id] = ordinal;

      currentBranch.head = commitId;
      commits.push({ id: commitId, branch: currentBranch.name, ordinal, tag: null, label });
      continue;
    }

    const commitMatch = COMMIT_RE.exec(t);
    if (commitMatch) {
      p.lines[i].kind = 'statement';
      if (!checkLimits(nodes, edges, p.diagnostics, i + 1)) continue;

      const attrs = parseAttrs(commitMatch[1] ?? '', i);
      const commitId = `c${commitCounter}`;
      const ordinal = commitCounter++;
      const label = attrs.id ?? '';
      const tag = attrs.tag ?? null;

      let shape: ShapeKind = 'filledCircle';
      let size: { width: number; height: number } = { width: GIT.commitD, height: GIT.commitD };
      let icon: 'cross' | undefined;

      if (attrs.type === 'HIGHLIGHT') {
        shape = 'framedCircle';
        size = { width: GIT.highlightD, height: GIT.highlightD };
      } else if (attrs.type === 'REVERSE') {
        shape = 'filledCircle';
        icon = 'cross';
      }

      const node = makeNode(commitId, label, shape, i, {
        size,
        colorIndex: currentBranch.colorIndex,
        labelSpan: attrs.idSpan,
        refLines: [i],
        ...(icon ? { icon } : {}),
      });
      nodes.push(node);
      stageNodes[commitId] = ordinal;

      if (currentBranch.head !== null) {
        const e = makeEdge(edgeCounter++, currentBranch.head, commitId, 'thick', '', i, {
          colorIndex: currentBranch.colorIndex,
          markers: { start: 'none', end: 'none' },
        });
        edges.push(e);
        stageEdges[e.id] = ordinal;
      }

      currentBranch.head = commitId;
      commits.push({ id: commitId, branch: currentBranch.name, ordinal, tag, label });
      continue;
    }

    p.lines[i].kind = 'statement';
    p.diagnostics.push({ line: i + 1, severity: 'warning', message: MESSAGES.unknownLine });
  }

  const cleanBranches = branches.map((b) => ({
    name: b.name,
    colorIndex: b.colorIndex,
    order: b.order,
  }));

  const data: { gitgraph: GitGraphData } = {
    gitgraph: {
      direction: direction === 'TB' || direction === 'BT' ? direction : 'LR',
      branches: cleanBranches,
      commits,
    },
  };

  return finishDoc('gitgraph', p, st, {
    direction,
    nodes,
    edges,
    groups: [],
    classDefs: {},
    title: null,
    stages: { nodes: stageNodes, edges: stageEdges },
    data,
  });
}
