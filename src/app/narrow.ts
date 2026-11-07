import { UI } from '../core/constants';

export function isNarrow(width: number): boolean {
  return width < UI.narrowBreakpoint;
}

export interface NarrowEnv {
  tabs: HTMLElement;
  textPanel: HTMLElement;
  canvasPanel: HTMLElement;
  onShowDiagram(): void;
}

export function setupNarrowLayout(env: NarrowEnv): () => void {
  const tabDiagram =
    env.tabs.querySelector<HTMLButtonElement>('#tab-diagram') ||
    Array.from(env.tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (b) => b.textContent?.trim() === 'Canvas',
    );
  const tabText =
    env.tabs.querySelector<HTMLButtonElement>('#tab-text') ||
    Array.from(env.tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (b) => b.textContent?.trim() === 'Editor',
    );


  let currentTab: 'diagram' | 'text' = 'diagram';

  const mql =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(`(max-width: ${UI.narrowBreakpoint - 1}px)`)
      : null;

  function selectTab(tab: 'diagram' | 'text', focus = false): void {
    currentTab = tab;
    const isDiagram = tab === 'diagram';

    tabDiagram?.setAttribute('aria-selected', isDiagram ? 'true' : 'false');
    tabDiagram?.setAttribute('tabindex', isDiagram ? '0' : '-1');
    tabText?.setAttribute('aria-selected', isDiagram ? 'false' : 'true');
    tabText?.setAttribute('tabindex', isDiagram ? '-1' : '0');

    if (!mql || mql.matches) {
      env.canvasPanel.hidden = !isDiagram;
      env.textPanel.hidden = isDiagram;
    }

    if (focus) (isDiagram ? tabDiagram : tabText)?.focus();
    if (isDiagram) env.onShowDiagram();
  }

  tabDiagram?.addEventListener('click', () => selectTab('diagram'));
  tabText?.addEventListener('click', () => selectTab('text'));

  env.tabs.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectTab(currentTab === 'diagram' ? 'text' : 'diagram', true);
    }
  });

  function applyLayout(narrow: boolean): void {
    if (narrow) {
      env.tabs.hidden = false;
      selectTab(currentTab);
    } else {
      env.tabs.hidden = true;
      env.textPanel.hidden = false;
      env.canvasPanel.hidden = false;
    }
  }

  if (mql) {
    applyLayout(mql.matches);
    const onChange = (e: MediaQueryListEvent) => applyLayout(e.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(onChange);
    }
  } else {
    applyLayout(true);
  }

  return () => {};
}
