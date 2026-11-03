import type { ParsedDoc } from '../core/types';

export function setupDiagnostics(
  diagnosticsEl: HTMLUListElement,
  revealLine: (line: number) => void,
): (doc: ParsedDoc) => void {
  const summaryEl = document.querySelector<HTMLElement>('#diagnostics-summary');

  return function updateDiagnostics(doc: ParsedDoc): void {
    if (summaryEl) {
      const errorCount = doc.diagnostics.filter((d) => d.severity === 'error').length;
      const warningCount = doc.diagnostics.filter((d) => d.severity === 'warning').length;
      const parts: string[] = [];
      if (errorCount > 0) {
        parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`);
      }
      if (warningCount > 0) {
        parts.push(`${warningCount} warning${warningCount === 1 ? '' : 's'}`);
      }
      summaryEl.textContent = parts.join(', ');
    }

    diagnosticsEl.innerHTML = '';
    for (const diag of doc.diagnostics) {
      const li = document.createElement('li');
      li.className = diag.severity;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = diag.severity;
      btn.textContent = `Line ${diag.line}: ${diag.message}`;
      btn.addEventListener('click', () => {
        revealLine(diag.line);
      });
      li.appendChild(btn);
      diagnosticsEl.appendChild(li);
    }
  };
}
