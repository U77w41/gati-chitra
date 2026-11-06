import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseRequirement } from './parse';
import { applyRequirementOp } from './ops';

const B = 'requirementDiagram\n  requirement r1 {\n    id: 1\n  }\n  element e1 {\n  }\n  e1 - satisfies -> r1\n';
const text = (r: ReturnType<typeof applyRequirementOp>) => ('text' in r ? r.text : r.error);

describe('applyRequirementOp', () => {
  it('adds requirements and relations', () => {
    expect(applyRequirementOp(B, { type: 'addNode', label: 'Fast', shape: 'rect' })).toEqual({
      text: B + '  requirement req1 {\n    id: 1\n    text: Fast\n    risk: medium\n    verifymethod: test\n  }\n',
      createdId: 'req1',
    });
    expect(text(applyRequirementOp(B, { type: 'addEdge', from: 'r1', to: 'e1' }))).toBe(B + '  r1 - satisfies -> e1\n');
  });

  it('renames a requirement everywhere and refuses a taken name', () => {
    expect(text(applyRequirementOp(B, { type: 'renameNode', id: 'r1', label: 'fast checkout' }))).toBe(
      'requirementDiagram\n  requirement fast_checkout {\n    id: 1\n  }\n  element e1 {\n  }\n  e1 - satisfies -> fast_checkout\n',
    );
    expect(applyRequirementOp(B, { type: 'renameNode', id: 'r1', label: 'e1' })).toEqual({ error: MESSAGES.nameTaken('e1') });
    expect(applyRequirementOp(B, { type: 'renameEdge', index: 0, label: 'x' })).toEqual({ error: MESSAGES.opUnsupported });
  });

  it('changes, reverses and deletes', () => {
    expect(text(applyRequirementOp(B, { type: 'setEdgeVariant', index: 0, variant: 'verifies' }))).toBe(B.replace('satisfies', 'verifies'));
    expect(text(applyRequirementOp(B, { type: 'reverseEdge', index: 0 }))).toBe(B.replace('e1 - satisfies -> r1', 'r1 - satisfies -> e1'));
    expect(text(applyRequirementOp(B, { type: 'deleteNode', id: 'e1' }))).toBe('requirementDiagram\n  requirement r1 {\n    id: 1\n  }\n');
  });

  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseRequirement(text(applyRequirementOp(B, { type: 'renameNode', id: 'r1', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes).toHaveLength(2);
    expect(d.nodes[0].label).toMatch(/^say_+hi_+now_+1_+ok$/);
  });

  it('refuses ops while the text has errors', () => {
    expect(applyRequirementOp('requirementDiagram\n  requirement r {\n', { type: 'deleteNode', id: 'r' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
