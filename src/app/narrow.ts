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
      (b) => b.textContent?.trim() === 'Diagram',
    );
  const tabText =
    env.tabs.querySelector<HTMLButtonElement>('#tab-text') ||
    Array.from(env.tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (b) => b.textContent?.trim() === 'Text',
    );

  const btnMore = typeof document !== 'undefined' ? document.querySelector<HTMLButtonElement>('#btn-more') : null;
  const moreMenu = typeof document !== 'undefined' ? document.querySelector<HTMLDivElement>('#more-menu') : null;
  const toolbar = typeof document !== 'undefined' ? document.querySelector<HTMLDivElement>('#toolbar') : null;
  const fileGroup = typeof document !== 'undefined' ? document.querySelector<HTMLDivElement>('#toolbar div[role="group"][aria-label="File"]') : null;
  const editGroup = typeof document !== 'undefined' ? document.querySelector<HTMLDivElement>('#toolbar div[role="group"][aria-label="Edit"]') : null;
  const viewGroup = typeof document !== 'undefined' ? document.querySelector<HTMLDivElement>('#toolbar div[role="group"][aria-label="View"]') : null;
  const spacer = typeof document !== 'undefined' ? document.querySelector<HTMLDivElement>('.toolbar-spacer') : null;

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

  const closeMore = () => {
    if (moreMenu) moreMenu.hidden = true;
    btnMore?.setAttribute('aria-expanded', 'false');
  };

  const openMore = () => {
    if (!moreMenu) return;
    moreMenu.hidden = false;
    btnMore?.setAttribute('aria-expanded', 'true');
    moreMenu.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
  };

  btnMore?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (moreMenu?.hidden) openMore();
    else closeMore();
  });

  moreMenu?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMore();
      btnMore?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const btns = Array.from(moreMenu.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
      if (!btns.length) return;
      const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'ArrowDown' ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
      btns[next]?.focus();
    }
  });

  moreMenu?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') closeMore();
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
      if (!moreMenu?.hidden && !moreMenu?.contains(e.target as Node) && e.target !== btnMore) closeMore();
    });
  }

  function applyLayout(narrow: boolean): void {
    if (narrow) {
      env.tabs.hidden = false;
      selectTab(currentTab);
      if (toolbar && moreMenu) {
        if (fileGroup) moreMenu.appendChild(fileGroup);
        if (viewGroup) moreMenu.appendChild(viewGroup);
        moreMenu.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
          b.setAttribute('role', 'menuitem');
        });
      }
    } else {
      env.tabs.hidden = true;
      env.textPanel.hidden = false;
      env.canvasPanel.hidden = false;
      if (toolbar && moreMenu) {
        moreMenu.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
          b.removeAttribute('role');
        });
        if (fileGroup && editGroup) toolbar.insertBefore(fileGroup, editGroup);
        if (viewGroup && spacer) toolbar.insertBefore(viewGroup, spacer);
        closeMore();
      }
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

  return () => {
    closeMore();
  };
}
