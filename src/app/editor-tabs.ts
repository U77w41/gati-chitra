import { rovingStep } from './node-palette';

// The editor panel has two icon tabs: the Mermaid script, and Nodes (format the selection, add a
// node). On wide screens the properties panel lives in the Nodes tab, so selecting a node
// or arrow on the diagram opens that tab; on phones properties stay a sheet over the diagram.

export function setupEditorTabs(): void {
  if (typeof document === 'undefined') return;
  const tabs = [document.getElementById('tab-script'), document.getElementById('tab-nodes')];
  const panes = [document.getElementById('script-pane'), document.getElementById('nodes-pane')];
  const props = document.getElementById('props');
  const nodesPane = panes[1];
  if (tabs.some((t) => !t) || panes.some((p) => !p)) return;

  const select = (index: number, focus = false): void => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab!.setAttribute('aria-selected', on ? 'true' : 'false');
      tab!.tabIndex = on ? 0 : -1;
      panes[i]!.hidden = !on;
    });
    if (focus) tabs[index]!.focus();
  };

  tabs.forEach((tab, i) => tab!.addEventListener('click', () => select(i)));
  tabs[0]!.parentElement!.addEventListener('keydown', (e) => {
    const next = rovingStep(tabs.indexOf(document.activeElement as HTMLElement), e.key, tabs.length);
    if (next === null) return;
    e.preventDefault();
    select(next, true);
  });

  if (props && nodesPane) {
    let wasHidden = props.hidden;
    new MutationObserver(() => {
      const opened = wasHidden && !props.hidden;
      wasHidden = props.hidden;
      if (!opened || !nodesPane.contains(props)) return;
      select(1);
      // Format is the pane's first section, so the selection's controls show without scrolling.
      nodesPane.scrollTop = 0;
    }).observe(props, { attributes: true, attributeFilter: ['hidden'] });
  }

  select(0);
}
