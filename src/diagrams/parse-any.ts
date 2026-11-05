import { LIMITS, MESSAGES } from '../core/constants';
import type { DiagramKind, ParsedDoc, SourceLine } from '../core/types';
import { emptyDoc, parseMermaid } from '../mermaid/parse';
import { detectKind } from './detect';
import { engineFailed, getEngine, hasLoader, loadEngine } from './registry';

function makeUnknownLines(text: string): SourceLine[] {
  return text.split(/\r\n|\r|\n/).map((t, index) => ({
    index,
    text: t,
    kind: 'unknown',
    nodeIds: [],
    edgeIndexes: [],
  }));
}

function makeErrorDoc(
  text: string,
  line: number,
  message: string,
  kind?: DiagramKind,
): ParsedDoc {
  const doc = emptyDoc(makeUnknownLines(text), [{ line, severity: 'error', message }]);
  if (kind) doc.kind = kind;
  return doc;
}

export function parseDocument(text: string): ParsedDoc {
  if (text.length > LIMITS.maxTextChars) {
    return parseMermaid(text);
  }

  const d = detectKind(text);
  if (d.kind === 'flowchart' || d.kind === 'unknown') {
    return parseMermaid(text);
  }

  if (d.kind === 'unsupported') {
    return makeErrorDoc(text, d.headerIdx + 1, MESSAGES.unsupportedDiagram(d.name));
  }

  if (!hasLoader(d.kind)) {
    return makeErrorDoc(
      text,
      d.headerIdx + 1,
      MESSAGES.unsupportedDiagram(`${d.name} diagram`),
      d.kind,
    );
  }

  const engine = getEngine(d.kind);
  if (engine !== null) {
    return engine.parse(text);
  }

  if (engineFailed(d.kind)) {
    return makeErrorDoc(
      text,
      d.headerIdx + 1,
      MESSAGES.diagramLoadFailed(d.name),
      d.kind,
    );
  }

  void loadEngine(d.kind).catch(() => undefined);
  const doc = emptyDoc(makeUnknownLines(text), [
    { line: d.headerIdx + 1, severity: 'info', message: MESSAGES.loadingDiagram(d.name) },
  ]);
  doc.kind = d.kind;
  doc.pending = true;
  doc.ok = false;
  return doc;
}
