import { BRAND } from '../core/constants';
import { escapeXml } from '../render/xml';
import { ICONS, logoSvg } from './icons';
import {
  readPref,
  writePref,
  nextPref,
  isDark,
  applyScheme,
  startSchemeWatcher,
} from './scheme';
import type { KeyValueStore } from './storage';

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

  // One slim row: the logo and name, then icon-only controls whose names show on hover or focus
  // (.action-label), the same pattern as the canvas and editor icons.
  const label = (name: string) => `<span class="action-label">${name}</span>`;
  return (
    '<div class="container header-inner">' +
    '<a class="brand" href="./" aria-label="Gati-chitra home">' +
    logoSvg('brand-icon') +
    '<span class="brand-text"><span class="brand-name">Gati Chitra</span></span>' +
    '</a>' +
    '<nav class="site-nav" aria-label="Main">' +
    '<ul>' +
    '<li>' +
    `<button type="button" class="site-nav-btn action-btn" id="btn-install" aria-label="Install Gati-chitra as an app">${ICONS.install}${label('Install')}</button>` +
    '</li>' +
    '<li>' +
    `<button type="button" class="site-nav-btn action-btn" id="btn-help" aria-label="Help and keyboard shortcuts">${ICONS.help}${label('Help')}</button>` +
    '</li>' +
    '<li>' +
    '<div class="menu-social-dropdown">' +
    '<button type="button" class="menu-social-dropdown-toggle action-btn" id="tools-toggle" aria-label="My Other Tools" aria-haspopup="true" aria-expanded="false" aria-controls="menu-social-dropdown-tools">' +
    ICONS.grid +
    label('My Other Tools') +
    '</button>' +
    '<div class="menu-social-dropdown-panel" id="menu-social-dropdown-tools" hidden>' +
    '<p class="menu-social-dropdown-title">Tools</p>' +
    `<ul>${toolsHtml}</ul>` +
    '</div>' +
    '</div>' +
    '</li>' +
    '<li>' +
    `<a class="action-btn" href="${escapeXml(BRAND.hireUrl)}" aria-label="Hire Me">${ICONS.briefcase}${label('Hire Me')}</a>` +
    '</li>' +
    '<li class="mobile-hide">' +
    `<a class="support-link-item action-btn" data-testid="support-link" href="${escapeXml(BRAND.supportUrl)}" target="_blank" rel="noreferrer" aria-label="Support my work">${ICONS.support}${label('Support my work')}</a>` +
    '</li>' +
    '</ul>' +
    '</nav>' +
    '<span class="switcher switcher-1">' +
    '<input type="checkbox" id="theme-toggle" aria-label="Switch between light and dark colour scheme" />' +
    '<span class="switcher-track" aria-hidden="true">' +
    '<span class="switcher-option switcher-light">' +
    ICONS.sun +
    '</span>' +
    '<span class="switcher-option switcher-dark">' +
    ICONS.moon +
    '</span>' +
    '</span>' +
    '<label for="theme-toggle" aria-hidden="true"></label>' +
    '</span>' +
    '</div>'
  );
}

export function mountChrome(
  doc: Document,
  store: KeyValueStore | null,
  onSchemeChange?: (scheme: 'light' | 'dark') => void,
): () => void {
  const header = doc.getElementById('site-header');
  if (header) {
    header.innerHTML = headerHtml();
  }

  const sysDark = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const themeToggle = doc.getElementById('theme-toggle') as HTMLInputElement | null;

  // Sync checkbox checked state with the current resolved scheme.
  const syncToggle = () => {
    if (themeToggle) {
      themeToggle.checked = isDark(readPref(store), sysDark());
    }
  };
  syncToggle();

  const onToggleChange = () => {
    const isSys = sysDark();
    const cur = readPref(store);
    const nxt = nextPref(cur, isSys);
    writePref(store, nxt);
    const s = applyScheme(nxt, isSys, doc);
    syncToggle();
    onSchemeChange?.(s);
  };
  themeToggle?.addEventListener('change', onToggleChange);

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
    syncToggle();
    onSchemeChange?.(s);
  });

  return () => {
    themeToggle?.removeEventListener('change', onToggleChange);
    toolsToggle?.removeEventListener('click', onToolsClick);
    doc.removeEventListener('keydown', onKeyDown);
    doc.removeEventListener('click', onDocClick);
    disposeWatcher();
  };
}
