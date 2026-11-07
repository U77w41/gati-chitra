import { rovingStep } from './node-palette';

// The editor panel has two icon tabs: the Mermaid script, and Nodes (format the selection, add a
// node). On wide screens the properties panel lives in the Nodes tab, so selecting a node
// or arrow on the diagram opens that tab; on phones properties stay a sheet over the diagram.

export function setupEditorTabs(
  rootDoc: {
    getElementById: (id: string) => HTMLElement | null;
    activeElement?: Element | null;
  } | null = typeof document !== 'undefined' ? document : null,
): void {
  if (!rootDoc) return;
  const tabs = [rootDoc.getElementById('tab-script'), rootDoc.getElementById('tab-nodes')];
  const panes = [rootDoc.getElementById('script-pane'), rootDoc.getElementById('nodes-pane')];
  const props = rootDoc.getElementById('props');
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
  tabs[0]!.parentElement?.addEventListener('keydown', (e: KeyboardEvent) => {
    const next = rovingStep(tabs.indexOf((rootDoc.activeElement ?? null) as HTMLElement), e.key, tabs.length);
    if (next === null) return;
    e.preventDefault();
    select(next, true);
  });

  if (props && nodesPane && typeof MutationObserver !== 'undefined') {
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
