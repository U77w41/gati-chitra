import { SHORTCUT_HELP } from './shortcuts-help';
import { KIND_NAMES } from '../diagrams/kinds';

export interface HelpEnv {
  dialogEl: HTMLDialogElement;
  btnHelp: HTMLButtonElement;
}

const DIAGRAM_TYPES: { name: string; header: string }[] = [
  { name: KIND_NAMES.flowchart, header: 'flowchart TD' },
  { name: KIND_NAMES.sequence, header: 'sequenceDiagram' },
  { name: KIND_NAMES.class, header: 'classDiagram' },
  { name: KIND_NAMES.state, header: 'stateDiagram-v2' },
  { name: KIND_NAMES.er, header: 'erDiagram' },
  { name: KIND_NAMES.requirement, header: 'requirementDiagram' },
  { name: KIND_NAMES.usecase, header: 'usecase-beta' },
  { name: KIND_NAMES.architecture, header: 'architecture-beta' },
  { name: KIND_NAMES.block, header: 'block' },
  { name: KIND_NAMES.gitgraph, header: 'gitGraph' },
  { name: KIND_NAMES.journey, header: 'journey' },
  { name: KIND_NAMES.timeline, header: 'timeline' },
  { name: KIND_NAMES.mindmap, header: 'mindmap' },
];

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
    <section>
      <h3>Diagram types</h3>
      <ul class="help-list">
        ${DIAGRAM_TYPES.map(
          (t) => `<li>${t.name}: <code>${t.header}</code></li>`
        ).join('')}
      </ul>
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
