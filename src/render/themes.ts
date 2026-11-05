import type { BackgroundChoice, Theme, ThemeChoice, ThemeId } from '../core/types';
import { THEMES } from './theme-palettes';

export { THEMES };

export const THEME_IDS: ThemeId[] = Object.keys(THEMES) as ThemeId[];

export const THEME_CHOICES: ThemeChoice[] = ['auto', ...THEME_IDS];

export const BACKGROUND_CHOICES: BackgroundChoice[] = ['match', 'auto', ...THEME_IDS];

export function resolveTheme(choice: ThemeChoice, scheme: 'light' | 'dark'): ThemeId {
  if (choice === 'auto') {
    return scheme === 'dark' ? 'midnight' : 'daylight';
  }
  return choice;
}

export function composeTheme(
  diagramChoice: ThemeChoice,
  bgChoice: BackgroundChoice | undefined,
  scheme: 'light' | 'dark',
): Theme {
  const dTheme = THEMES[resolveTheme(diagramChoice, scheme)];
  if (!bgChoice || bgChoice === 'match') {
    return dTheme;
  }
  const bTheme = THEMES[resolveTheme(bgChoice, scheme)];
  return {
    ...dTheme,
    background: bTheme.background,
    backgroundGradient: bTheme.backgroundGradient,
    gridColor: bTheme.gridColor,
    edgeLabelBg: bTheme.edgeLabelBg,
    edgeLabelText: bTheme.edgeLabelText,
    titleText: bTheme.titleText ?? bTheme.edgeLabelText,
  };
}
