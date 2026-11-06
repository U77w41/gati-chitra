import { MESSAGES } from '../../core/constants';
import type { Choice, EditCaps } from '../../core/diagram-types';
import type { ShapeKind, TextOp, TextOpResult } from '../../core/types';
import {
  appendLine, cleanForText, deleteLines, guardOk, indentOf, lastContentLine,
  nextId, pinOps, rebuildLine, renameBySpan, textLines,
} from '../common/edit';
import { parseGitGraph } from './parse';

export const GITGRAPH_CAPS: EditCaps = {
  add: true,
  connect: false,
  rename: true,
  delete: true,
  move: false,
  shape: false,
  style: false,
  edgeVariant: false,
  reverse: false,
};

export const GITGRAPH_ADD_CHOICES: Choice<ShapeKind>[] = [
  { value: 'filledCircle', name: 'Commit' },
];

export const GITGRAPH_SHAPE_CHOICES: Choice<ShapeKind>[] = [];
export const GITGRAPH_EDGE_VARIANTS: { value: string; name: string }[] = [];

const FORBID = /["]/g;

export function applyGitGraphOp(text: string, op: TextOp): TextOpResult {
  const doc = parseGitGraph(text);
  const guard = guardOk(doc);
  if (guard) return guard;

  const pinRes = pinOps(text, doc, op, GITGRAPH_CAPS);
  if (pinRes) return pinRes;

  const lines = textLines(text);

  if (op.type === 'addNode') {
    const id = nextId(doc, 'c');
    const label = cleanForText(op.label, FORBID);
    const lastIdx = lastContentLine(doc);
    const indent = lastIdx >= 0 ? indentOf(lines[lastIdx]) : '  ';
    const newLine = `${indent}commit id: "${label}"`;
    return {
      text: appendLine(text, doc, newLine),
      createdId: id,
    };
  }

  if (op.type === 'renameNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    if (node.label.startsWith('cherry-pick:')) {
      return { error: MESSAGES.opUnsupported };
    }
    const label = cleanForText(op.label, FORBID);
    if (node.labelSpan) {
      return renameBySpan(text, node.labelSpan, label, FORBID) ?? { error: MESSAGES.opUnsupported };
    }
    const raw = node.line >= 0 && node.line < lines.length ? lines[node.line] : '';
    let updated = raw;
    if (/^\s*commit\b/.test(raw)) {
      updated = raw.replace(/^(\s*commit\b)/, `$1 id: "${label}"`);
    } else if (/^\s*merge\b/.test(raw)) {
      updated = raw.replace(/^(\s*merge\s+(?:"[^"]*"|[\w.-]+))/, `$1 id: "${label}"`);
    } else {
      return { error: MESSAGES.opUnsupported };
    }
    return { text: rebuildLine(text, node.line, updated.trimStart()) };
  }

  if (op.type === 'deleteNode') {
    const node = doc.nodes.find((n) => n.id === op.id);
    if (!node) return { error: MESSAGES.unknownNode(op.id) };
    return { text: deleteLines(text, node.refLines ?? [node.line]) };
  }

  return { error: MESSAGES.opUnsupported };
}
