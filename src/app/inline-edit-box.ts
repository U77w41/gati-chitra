// The label editor is a small pill centred on the label, in the same font and size as the label
// on the canvas, so the node's own shape stays visible around it while you type.

export const EDITOR = {
  padX: 10,
  border: 1,
  /** Room for the caret after the last character. */
  caret: 4,
  minWidth: 64,
  maxWidth: 320,
  minFont: 12,
  maxFont: 24,
} as const;

export function editorFontPx(labelSize: number, zoom: number): number {
  return Math.min(EDITOR.maxFont, Math.max(EDITOR.minFont, Math.round(labelSize * zoom)));
}

export function editorWidth(lineWidths: number[]): number {
  const text = Math.ceil(Math.max(0, ...lineWidths));
  const width = text + 2 * EDITOR.padX + 2 * EDITOR.border + EDITOR.caret;
  return Math.min(EDITOR.maxWidth, Math.max(EDITOR.minWidth, width));
}
