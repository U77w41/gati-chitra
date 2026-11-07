import { rovingStep } from './node-palette';
import { edgeIcon } from './edge-icons';
import { escapeXml } from '../render/xml';

// The Edge Palette renders visual buttons for connector kinds (Solid arrow, Dotted arrow,
// Thick arrow, Lines, etc.) inside the Properties panel when an edge is selected.
// It reflects and controls the underlying #prop-kind select element.

export interface EdgePaletteEnv {
  palette: HTMLElement;
  select: HTMLSelectElement;
  onSelect?: (value: string) => void;
}

export interface EdgePaletteInstance {
  sync: () => void;
}

export function setupEdgePalette(env: EdgePaletteEnv): EdgePaletteInstance {
  const { palette, select } = env;

  const items = (): HTMLButtonElement[] =>
    Array.from(palette.querySelectorAll<HTMLButtonElement>('button'));

  const sync = (): void => {
    const current = select.value;
    const off = select.disabled;
    const buttons = items();
    buttons.forEach((btn) => {
      const active = btn.dataset.value === current;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        btn.classList.add('active');
        btn.tabIndex = 0;
      } else {
        btn.classList.remove('active');
        btn.tabIndex = -1;
      }
      btn.disabled = off;
    });
  };

  const render = (): void => {
    const off = select.disabled;
    const current = select.value;
    const options = Array.from(select.options);

    palette.innerHTML = options
      .map((opt, i) => {
        const val = opt.value;
        const name = escapeXml(opt.text);
        const active = val === current || (!current && i === 0);
        return `<button type="button" class="edge-palette-btn${active ? ' active' : ''}" data-value="${escapeXml(val)}" data-index="${i}" tabindex="${active ? 0 : -1}" aria-pressed="${active ? 'true' : 'false'}" title="${name}"${off ? ' disabled' : ''}>${edgeIcon(val)}<span>${name}</span></button>`;
      })
      .join('');
  };

  palette.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn || btn.disabled) return;
    const val = btn.dataset.value;
    if (val !== undefined && select.value !== val) {
      select.value = val;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      env.onSelect?.(val);
    }
  });

  palette.addEventListener('keydown', (e: KeyboardEvent) => {
    const list = items();
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const currIdx = list.indexOf(activeEl as HTMLButtonElement);
    const next = rovingStep(currIdx, e.key, list.length);
    if (next === null) return;
    e.preventDefault();
    list.forEach((b, i) => (b.tabIndex = i === next ? 0 : -1));
    list[next]?.focus();
  });

  select.addEventListener('change', sync);

  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(() => {
      render();
      sync();
    }).observe(select, { childList: true, attributes: true, attributeFilter: ['disabled'] });
  }

  render();
  sync();

  return { sync };
}
