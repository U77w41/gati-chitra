import type {
  BackgroundChoice,
  NodeShadeMode,
  Theme,
  ThemeChoice,
  ThemeId,
} from '../core/types';
import { THEMES } from './theme-palettes';

export { THEMES };

export const THEME_IDS: ThemeId[] = [
  'daylight',
  'geist',
  'flexoki',
  'latte',
  'matcha',
  'clay',
  'swiss',
  'midnight',
  'obsidian',
  'graphite',
  'tokyonight',
  'nordic',
  'rosepine',
  'monokai',
  'lagoon',
  'ember',
];

export const THEME_CHOICES: ThemeChoice[] = ['auto', ...THEME_IDS];

export const BACKGROUND_CHOICES: BackgroundChoice[] = ['match', 'auto', ...THEME_IDS];

export function resolveTheme(choice: ThemeChoice, scheme: 'light' | 'dark'): ThemeId {
  if (choice === 'auto') {
    return scheme === 'dark' ? 'midnight' : 'daylight';
  }
  if (choice === 'paper') return 'flexoki';
  if (choice === 'lavender') return 'latte';
  return choice;
}

export function composeTheme(
  diagramChoice: ThemeChoice,
  bgChoice: BackgroundChoice | undefined,
  scheme: 'light' | 'dark',
  shadingMode?: NodeShadeMode,
): Theme {
  const dTheme = THEMES[resolveTheme(diagramChoice, scheme)] ?? THEMES.daylight;
  if (!bgChoice || bgChoice === 'match') {
    return shadingMode !== undefined ? { ...dTheme, shadingMode } : dTheme;
  }
  const bTheme = THEMES[resolveTheme(bgChoice, scheme)] ?? dTheme;
  return {
    ...dTheme,
    background: bTheme.background,
    backgroundGradient: bTheme.backgroundGradient,
    gridColor: bTheme.gridColor,
    edgeLabelBg: bTheme.edgeLabelBg,
    edgeLabelText: bTheme.edgeLabelText,
    titleText: bTheme.titleText ?? bTheme.edgeLabelText,
    ...(shadingMode !== undefined ? { shadingMode } : {}),
  };
}
