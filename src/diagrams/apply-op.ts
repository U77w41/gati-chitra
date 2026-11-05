import { MESSAGES } from '../core/constants';
import type { TextOp, TextOpResult } from '../core/types';
import { applyOp } from '../mermaid/ops';
import { detectKind } from './detect';
import { getEngine } from './registry';

export function applyAnyOp(text: string, op: TextOp): TextOpResult {
  const d = detectKind(text);
  if (d.kind === 'flowchart' || d.kind === 'unknown') {
    return applyOp(text, op);
  }

  if (d.kind !== 'unsupported') {
    const engine = getEngine(d.kind);
    if (engine) {
      return engine.applyOp(text, op);
    }
  }

  return { error: MESSAGES.fixTextFirst };
}
