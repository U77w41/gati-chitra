import { expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { applyOp } from '../mermaid/ops';
import { applyAnyOp } from './apply-op';

it('sends flowchart ops to the flowchart code and refuses other types with no engine', () => {
  const t = 'flowchart TD\nA-->B';
  const op = { type: 'renameNode', id: 'A', label: 'Start' } as const;
  expect(applyAnyOp(t, op)).toEqual(applyOp(t, op));
  expect(applyAnyOp('sequenceDiagram\n  A->>B: hi', op)).toEqual({ error: MESSAGES.fixTextFirst });
  expect(applyOp(t, { type: 'setEdgeVariant', index: 0, variant: 'x' })).toEqual({ error: MESSAGES.opUnsupported });
});
