import type { ParsedDoc } from '../core/types';

export function setupDiagnostics(
  diagnosticsEl: HTMLUListElement,
  sourceEl: HTMLTextAreaElement,
): (doc: ParsedDoc) => void {
  return function updateDiagnostics(doc: ParsedDoc): void {
    diagnosticsEl.innerHTML = '';
    for (const diag of doc.diagnostics) {
      const li = document.createElement('li');
      li.className = diag.severity;
      li.textContent = `Line ${diag.line}: ${diag.message}`;
      li.addEventListener('click', () => {
        const lines = sourceEl.value.split('\n');
        let start = 0;
        for (let i = 0; i < diag.line - 1 && i < lines.length; i++) {
          start += lines[i].length + 1;
        }
        sourceEl.focus();
        sourceEl.setSelectionRange(
          start,
          start + (lines[diag.line - 1]?.length ?? 0),
        );
      });
      diagnosticsEl.appendChild(li);
    }
  };
}
