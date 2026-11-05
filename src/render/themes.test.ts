import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_CHOICES,
  THEMES,
  THEME_CHOICES,
  THEME_IDS,
  composeTheme,
  resolveTheme,
} from './themes';
import type { Theme } from '../core/types';

describe('themes', () => {
  it('defines THEME_IDS, THEME_CHOICES, and BACKGROUND_CHOICES correctly', () => {
    expect(THEME_IDS).toEqual([
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
    ]);
    expect(THEME_CHOICES).toEqual(['auto', ...THEME_IDS]);
    expect(BACKGROUND_CHOICES).toEqual(['match', 'auto', ...THEME_IDS]);
  });

  it('contains complete definitions for each of the 16 themes with 4-tier nodeShades', () => {
    const requiredFields: (keyof Theme)[] = [
      'id',
      'name',
      'background',
      'backgroundGradient',
      'nodeFill',
      'nodeStroke',
      'nodeText',
      'nodeShades',
      'edge',
      'edgeLabelBg',
      'edgeLabelText',
      'groupFill',
      'groupStroke',
      'groupTitle',
      'particle',
      'glow',
      'selection',
      'glowDefault',
      'gridColor',
    ];

    expect(THEME_IDS.length).toBe(16);

    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      expect(theme).toBeDefined();
      for (const field of requiredFields) {
        expect(theme[field]).toBeDefined();
      }
      expect(typeof theme.gridColor).toBe('string');
      expect(theme.gridColor.length).toBeGreaterThan(0);
      expect(theme.nodeShades).toBeDefined();
      expect(theme.nodeShades?.length).toBe(4);
      for (let tier = 0; tier < 4; tier++) {
        expect(theme.nodeShades?.[tier].fill).toBeDefined();
        expect(theme.nodeShades?.[tier].stroke).toBeDefined();
      }
    }

    expect(THEMES.lagoon.backgroundGradient).toEqual(['#041e2b', '#0a2e3f']);
    expect(THEMES.ember.backgroundGradient).toEqual(['#180c0e', '#2a1215']);
    expect(THEMES.obsidian.backgroundGradient).toEqual(['#090a0f', '#10121a']);
    expect(THEMES.nordic.backgroundGradient).toEqual(['#242933', '#2e3440']);
    expect(THEMES.rosepine.backgroundGradient).toEqual(['#191724', '#1f1d2e']);
    expect(THEMES.tokyonight.backgroundGradient).toEqual(['#1a1b26', '#16161e']);
    expect(THEMES.monokai.backgroundGradient).toEqual(['#1c1917', '#24201d']);
    expect(THEMES.daylight.backgroundGradient).toBeNull();
    expect(THEMES.midnight.backgroundGradient).toBeNull();

    expect(THEMES.daylight.glowDefault).toBe(false);
    expect(THEMES.midnight.glowDefault).toBe(true);
    expect(THEMES.lagoon.glowDefault).toBe(true);
    expect(THEMES.ember.glowDefault).toBe(true);
    expect(THEMES.obsidian.glowDefault).toBe(true);
    expect(THEMES.rosepine.glowDefault).toBe(true);
    expect(THEMES.tokyonight.glowDefault).toBe(true);
    expect(THEMES.monokai.glowDefault).toBe(true);
  });

  it('resolves theme choices according to scheme', () => {
    expect(resolveTheme('auto', 'light')).toBe('daylight');
    expect(resolveTheme('auto', 'dark')).toBe('midnight');
    expect(resolveTheme('lagoon', 'dark')).toBe('lagoon');
    expect(resolveTheme('ember', 'light')).toBe('ember');
    expect(resolveTheme('daylight', 'dark')).toBe('daylight');
    expect(resolveTheme('midnight', 'light')).toBe('midnight');
    expect(resolveTheme('obsidian', 'light')).toBe('obsidian');
    expect(resolveTheme('flexoki', 'dark')).toBe('flexoki');
    expect(resolveTheme('paper', 'dark')).toBe('flexoki');
    expect(resolveTheme('lavender', 'light')).toBe('latte');
  });

  it('composes theme correctly when background is match or undefined', () => {
    const dTheme = composeTheme('obsidian', 'match', 'dark');
    expect(dTheme.nodeFill).toEqual(THEMES.obsidian.nodeFill);
    expect(dTheme.background).toEqual(THEMES.obsidian.background);

    const autoTheme = composeTheme('auto', undefined, 'light');
    expect(autoTheme.nodeFill).toEqual(THEMES.daylight.nodeFill);
    expect(autoTheme.background).toEqual(THEMES.daylight.background);

    const shadedTheme = composeTheme('daylight', undefined, 'light', 'semantic');
    expect(shadedTheme.shadingMode).toBe('semantic');
  });

  it('composes theme correctly with decoupled diagram and background', () => {
    const composed = composeTheme('obsidian', 'flexoki', 'light', 'shape');

    // Diagram elements come from obsidian
    expect(composed.nodeFill).toBe(THEMES.obsidian.nodeFill);
    expect(composed.nodeStroke).toBe(THEMES.obsidian.nodeStroke);
    expect(composed.nodeText).toBe(THEMES.obsidian.nodeText);
    expect(composed.edge).toBe(THEMES.obsidian.edge);
    expect(composed.particle).toBe(THEMES.obsidian.particle);
    expect(composed.glow).toBe(THEMES.obsidian.glow);
    expect(composed.selection).toBe(THEMES.obsidian.selection);
    expect(composed.groupFill).toBe(THEMES.obsidian.groupFill);
    expect(composed.groupStroke).toBe(THEMES.obsidian.groupStroke);
    expect(composed.groupTitle).toBe(THEMES.obsidian.groupTitle);
    expect(composed.shadingMode).toBe('shape');

    // Background elements come from flexoki
    expect(composed.background).toBe(THEMES.flexoki.background);
    expect(composed.backgroundGradient).toBe(THEMES.flexoki.backgroundGradient);
    expect(composed.gridColor).toBe(THEMES.flexoki.gridColor);
    expect(composed.edgeLabelBg).toBe(THEMES.flexoki.edgeLabelBg);
    expect(composed.edgeLabelText).toBe(THEMES.flexoki.edgeLabelText);
    expect(composed.titleText).toBe(THEMES.flexoki.titleText ?? THEMES.flexoki.edgeLabelText);
  });

  it('composes theme correctly with auto background', () => {
    const darkComposed = composeTheme('flexoki', 'auto', 'dark');
    expect(darkComposed.background).toBe(THEMES.midnight.background);
    expect(darkComposed.gridColor).toBe(THEMES.midnight.gridColor);
    expect(darkComposed.nodeFill).toBe(THEMES.flexoki.nodeFill);

    const lightComposed = composeTheme('obsidian', 'auto', 'light');
    expect(lightComposed.background).toBe(THEMES.daylight.background);
    expect(lightComposed.gridColor).toBe(THEMES.daylight.gridColor);
    expect(lightComposed.nodeFill).toBe(THEMES.obsidian.nodeFill);
  });
});
