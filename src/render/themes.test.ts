import { describe, expect, it } from 'vitest';
import {
  THEMES,
  THEME_CHOICES,
  THEME_IDS,
  resolveTheme,
} from './themes';
import type { Theme } from '../core/types';

describe('themes', () => {
  it('defines THEME_IDS and THEME_CHOICES correctly', () => {
    expect(THEME_IDS).toEqual(['daylight', 'midnight', 'lagoon', 'ember']);
    expect(THEME_CHOICES).toEqual(['auto', 'daylight', 'midnight', 'lagoon', 'ember']);
  });

  it('contains complete definitions for each theme', () => {
    const requiredFields: (keyof Theme)[] = [
      'id',
      'name',
      'background',
      'backgroundGradient',
      'nodeFill',
      'nodeStroke',
      'nodeText',
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
    ];

    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      expect(theme).toBeDefined();
      for (const field of requiredFields) {
        expect(theme[field]).toBeDefined();
      }
    }

    expect(THEMES.lagoon.backgroundGradient).toEqual(['#06222b', '#0b4a52']);
    expect(THEMES.ember.backgroundGradient).toEqual(['#1a0b12', '#2b1020']);
    expect(THEMES.daylight.backgroundGradient).toBeNull();
    expect(THEMES.midnight.backgroundGradient).toBeNull();

    expect(THEMES.daylight.glowDefault).toBe(false);
    expect(THEMES.midnight.glowDefault).toBe(false);
    expect(THEMES.lagoon.glowDefault).toBe(true);
    expect(THEMES.ember.glowDefault).toBe(true);

    expect(THEMES.daylight.nodeStroke).toBe('#34495e');
    expect(THEMES.midnight.background).toBe('#303030');
  });

  it('resolves theme choices according to scheme', () => {
    expect(resolveTheme('auto', 'light')).toBe('daylight');
    expect(resolveTheme('auto', 'dark')).toBe('midnight');
    expect(resolveTheme('lagoon', 'dark')).toBe('lagoon');
    expect(resolveTheme('ember', 'light')).toBe('ember');
    expect(resolveTheme('daylight', 'dark')).toBe('daylight');
    expect(resolveTheme('midnight', 'light')).toBe('midnight');
  });
});
