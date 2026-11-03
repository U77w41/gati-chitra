import { BRAND } from '../core/constants';
import { escapeXml } from '../render/svg';
import { ICONS, logoSvg } from './icons';
import {
  readPref,
  writePref,
  nextPref,
  applyScheme,
  startSchemeWatcher,
} from './scheme';
import type { KeyValueStore } from './storage';

export function copyrightText(year: number): string {
  if (year <= BRAND.startYear) {
    return `© ${BRAND.startYear} ${BRAND.owner}`;
  }
  return `© ${BRAND.startYear} – ${year} ${BRAND.owner}`;
}

export function headerHtml(): string {
  const toolsHtml = BRAND.tools
    .map((t) => {
      const icon = t.id === 'diff' ? ICONS.diff : ICONS.anurup;
      return (
        '<li>' +
        `<a href="${escapeXml(t.url)}" target="_blank" rel="noopener noreferrer">` +
        `<span class="menu-social-dropdown-icon">${icon}</span>` +
        '<span class="menu-social-dropdown-text">' +
        `<span class="menu-social-dropdown-name">${escapeXml(t.name)}</span>` +
        `<span class="menu-social-dropdown-description">${escapeXml(t.description)}</span>` +
        '</span>' +
        `<span class="menu-social-dropdown-external">${ICONS.external}</span>` +
        '</a>' +
        '</li>'
      );
    })
    .join('');

  return (
    '<div class="container header-inner">' +
    '<a class="brand" href="./" aria-label="Gati-chitra home">' +
    logoSvg('brand-icon') +
    '<span class="brand-text"><span class="brand-name">Gati Chitra</span></span>' +
    '</a>' +
    '<button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch between light and dark colour scheme" title="Switch between light and dark colour scheme">' +
    ICONS.moon +
    ICONS.sun +
    '</button>' +
    '<nav class="site-nav" aria-label="Main">' +
    '<ul>' +
    '<li>' +
    '<div class="menu-social-dropdown">' +
    '<button type="button" class="menu-social-dropdown-toggle nav-text-desktop" id="tools-toggle" title="My Other Tools" aria-label="My Other Tools" aria-haspopup="true" aria-expanded="false" aria-controls="menu-social-dropdown-tools">' +
    ICONS.grid +
    '<span class="nav-label">My Other Tools</span>' +
    `<span class="menu-social-dropdown-chevron" aria-hidden="true">${ICONS.chevron}</span>` +
    '</button>' +
    '<div class="menu-social-dropdown-panel" id="menu-social-dropdown-tools" hidden>' +
    '<p class="menu-social-dropdown-title">Tools</p>' +
    `<ul>${toolsHtml}</ul>` +
    '</div>' +
    '</div>' +
    '</li>' +
    '<li>' +
    `<a class="nav-text-desktop" href="${escapeXml(BRAND.hireUrl)}" aria-label="Hire Me">${ICONS.briefcase}<span class="nav-label">Hire Me</span></a>` +
    '</li>' +
    '<li class="mobile-hide">' +
    `<a class="support-link-item" data-testid="support-link" href="${escapeXml(BRAND.supportUrl)}" target="_blank" rel="noreferrer" title="Support my work: send a small tip over UPI">${ICONS.support}<span>Support my work</span></a>` +
    '</li>' +
    '</ul>' +
    '</nav>' +
    '</div>'
  );
}

export function footerHtml(year: number, sourceUrl: string): string {
  const diffTool = BRAND.tools.find((t) => t.id === 'diff');
  const anurupTool = BRAND.tools.find((t) => t.id === 'anurup');

  return (
    '<div class="container footer-row">' +
    '<p class="footer-meta">' +
    `<span class="copyright">${copyrightText(year)}</span>` +
    '<span class="footer-sep" aria-hidden="true">·</span>' +
    '<span>Runs entirely in your browser</span>' +
    '</p>' +
    '<nav class="footer-nav" aria-label="Footer">' +
    `<a href="${escapeXml(BRAND.hireUrl)}">Hire Me</a>` +
    `<a href="${escapeXml(diffTool?.url ?? 'https://u77w41.github.io/diff-checker/')}">Diff Checker</a>` +
    `<a href="${escapeXml(anurupTool?.url ?? 'https://u77w41.github.io/anurup/')}">Anurup</a>` +
    `<a href="${escapeXml(sourceUrl)}" target="_blank" rel="noreferrer">Source</a>` +
    `<a class="footer-support" data-testid="support-link-footer" href="${escapeXml(BRAND.supportUrl)}" target="_blank" rel="noreferrer" title="Support my work: send a small tip over UPI">${ICONS.support}<span>Support my work</span></a>` +
    '</nav>' +
    '</div>'
  );
}

export function mountChrome(
  doc: Document,
  store: KeyValueStore | null,
  sourceUrl: string,
  onSchemeChange?: (scheme: 'light' | 'dark') => void,
): () => void {
  const header = doc.getElementById('site-header');
  if (header) {
    header.innerHTML = headerHtml();
  }
  const footer = doc.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = footerHtml(new Date().getFullYear(), sourceUrl);
  }

  const sysDark = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const themeToggle = doc.getElementById('theme-toggle');
  const onToggleClick = () => {
    const isSys = sysDark();
    const cur = readPref(store);
    const nxt = nextPref(cur, isSys);
    writePref(store, nxt);
    const s = applyScheme(nxt, isSys, doc);
    onSchemeChange?.(s);
  };
  themeToggle?.addEventListener('click', onToggleClick);

  const toolsToggle = doc.getElementById('tools-toggle');
  const toolsPanel = doc.getElementById('menu-social-dropdown-tools');

  const closeTools = (restoreFocus = false) => {
    if (toolsPanel && !toolsPanel.hasAttribute('hidden')) {
      toolsPanel.setAttribute('hidden', '');
      toolsToggle?.setAttribute('aria-expanded', 'false');
      if (restoreFocus && toolsToggle) {
        toolsToggle.focus();
      }
    }
  };

  const onToolsClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!toolsPanel || !toolsToggle) return;
    const isHidden = toolsPanel.hasAttribute('hidden');
    if (isHidden) {
      toolsToggle.focus();
      toolsPanel.removeAttribute('hidden');
      toolsToggle.setAttribute('aria-expanded', 'true');
    } else {
      closeTools();
    }
  };
  toolsToggle?.addEventListener('click', onToolsClick);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && toolsPanel && !toolsPanel.hasAttribute('hidden')) {
      closeTools(true);
    }
  };
  doc.addEventListener('keydown', onKeyDown);

  const onDocClick = (e: MouseEvent) => {
    if (!toolsPanel || toolsPanel.hasAttribute('hidden')) return;
    const target = e.target as Node;
    if (toolsPanel.contains(target)) {
      if ((target as HTMLElement).closest('a')) {
        closeTools();
      }
    } else if (toolsToggle && !toolsToggle.contains(target)) {
      closeTools();
    }
  };
  doc.addEventListener('click', onDocClick);

  const disposeWatcher = startSchemeWatcher(store, (s) => {
    onSchemeChange?.(s);
  });

  return () => {
    themeToggle?.removeEventListener('click', onToggleClick);
    toolsToggle?.removeEventListener('click', onToolsClick);
    doc.removeEventListener('keydown', onKeyDown);
    doc.removeEventListener('click', onDocClick);
    disposeWatcher();
  };
}
