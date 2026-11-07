import { escapeXml } from '../render/xml';
import { shapeIcon } from './shape-icons';

// The Nodes tab shows one button per node kind the current diagram can add, each with its icon
// and name. The hidden #add-shape select stays the list's source, because kind-ui.ts refills it
// (and disables it) whenever the diagram type changes; the palette redraws when it does.

export function rovingStep(index: number, key: string, count: number): number | null {
  if (count <= 0) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowRight' || key === 'ArrowDown') return index < 0 ? 0 : (index + 1) % count;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return index < 0 ? count - 1 : (index - 1 + count) % count;
  return null;
}

export interface NodePaletteEnv {
  palette: HTMLElement;
  hint: HTMLElement | null;
  select: HTMLSelectElement;
  /** Runs before a node is added, for example to show the diagram on a phone. */
  beforeAdd?: () => Promise<void>;
  onAdd: () => void;
}

export function setupNodePalette(env: NodePaletteEnv): void {
  const { palette, select } = env;
  const items = () => Array.from(palette.querySelectorAll<HTMLButtonElement>('button'));

  const render = (): void => {
    const off = select.disabled;
    palette.innerHTML = Array.from(select.options)
      .map((o, i) => {
        const name = escapeXml(o.text);
        return `<button type="button" data-index="${i}" tabindex="${i === 0 ? 0 : -1}" title="${name}"${off ? ' disabled' : ''}>${shapeIcon(o.value)}<span>${name}</span></button>`;
      })
      .join('');
    if (env.hint) env.hint.hidden = !off;
  };

  palette.addEventListener('click', async (e) => {
    const item = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!item || item.disabled) return;
    select.selectedIndex = Number(item.dataset.index);
    await env.beforeAdd?.();
    env.onAdd();
  });

  palette.addEventListener('keydown', (e) => {
    const list = items();
    const next = rovingStep(list.indexOf(document.activeElement as HTMLButtonElement), e.key, list.length);
    if (next === null) return;
    e.preventDefault();
    list.forEach((b, i) => (b.tabIndex = i === next ? 0 : -1));
    list[next]?.focus();
  });

  new MutationObserver(render).observe(select, { childList: true, attributes: true, attributeFilter: ['disabled'] });
  render();
}
