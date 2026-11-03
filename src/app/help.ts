import { SHORTCUT_HELP } from './shortcuts';

export interface HelpEnv {
  dialogEl: HTMLDialogElement;
  btnHelp: HTMLButtonElement;
}

export function setupHelpDialog(env: HelpEnv): {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
} {
  const { dialogEl, btnHelp } = env;
  const closeBtn = dialogEl.querySelector<HTMLButtonElement>('#help-close');
  const bodyEl = dialogEl.querySelector<HTMLElement>('#help-body') ?? dialogEl;

  bodyEl.innerHTML = `
    <section>
      <h3>Keyboard shortcuts</h3>
      <table class="help-table">
        <thead>
          <tr>
            <th scope="col">Keys</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          ${SHORTCUT_HELP.map(
            (s) => `<tr><td><kbd>${s.keys}</kbd></td><td>${s.text}</td></tr>`
          ).join('')}
        </tbody>
      </table>
    </section>
    <section>
      <h3>Mermaid syntax cheat sheet</h3>
      <table class="help-table">
        <thead>
          <tr>
            <th scope="col">Element</th>
            <th scope="col">Syntax</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Statements</td><td><code>A --&gt; B; C --&gt; D</code></td></tr>
          <tr><td>Node ids</td><td><code>node-1["Hyphenated id"]</code></td></tr>
          <tr><td>Arrow kinds</td><td><code>--&gt;, ---, ==&gt;, -.-&gt;, &lt;--&gt;, o--o, x--x, ~~~</code></td></tr>
          <tr><td>Node shapes</td><td><code>[Rectangle], (Rounded), ([Stadium]), ((Circle)), {Diamond}, {{Hexagon}}</code></td></tr>
          <tr><td>Labels</td><td><code>A --&gt;|pipe| B, A["\`**bold** and *italic*\`"]</code></td></tr>
          <tr><td>Directives &amp; Lines</td><td><code>direction LR, classDef hot fill:#f00, style A fill:#f9f</code></td></tr>
          <tr><td>Subgraphs</td><td><code>subgraph sub1 [Title] ... end</code></td></tr>
          <tr><td>Links</td><td><code>click A "https://example.com"</code></td></tr>
        </tbody>
      </table>
    </section>
  `;

  function open(): void {
    if (dialogEl.showModal) {
      dialogEl.showModal();
    } else {
      dialogEl.setAttribute('open', '');
    }
    closeBtn?.focus();
  }

  function close(): void {
    if (dialogEl.close) {
      dialogEl.close();
    } else {
      dialogEl.removeAttribute('open');
    }
    btnHelp.focus();
  }

  btnHelp.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  dialogEl.addEventListener('close', () => {
    btnHelp.focus();
  });
  dialogEl.addEventListener('cancel', () => {
    close();
  });
  dialogEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  });

  return { open, close, isOpen: () => dialogEl.open };
}
