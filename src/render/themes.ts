import type { Theme, ThemeChoice, ThemeId } from '../core/types';

export const THEME_IDS: ThemeId[] = ['daylight', 'midnight', 'lagoon', 'ember'];

export const THEME_CHOICES: ThemeChoice[] = [
  'auto',
  'daylight',
  'midnight',
  'lagoon',
  'ember',
];

export const THEMES: Record<ThemeId, Theme> = {
  daylight: {
    id: 'daylight',
    name: 'Daylight',
    background: '#ffffff',
    backgroundGradient: null,
    nodeFill: '#f7f7fb',
    nodeStroke: '#34495e',
    nodeText: '#111418',
    edge: '#4f5660',
    edgeLabelBg: '#ffffff',
    edgeLabelText: '#111418',
    groupFill: '#f5f5fa',
    groupStroke: '#cfd1dc',
    groupTitle: '#34495e',
    particle: '#3b82f6',
    glow: '#3b82f6',
    selection: '#3b82f6',
    glowDefault: false,
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    background: '#303030',
    backgroundGradient: null,
    nodeFill: '#424242',
    nodeStroke: '#ecf0f1',
    nodeText: '#ebebeb',
    edge: '#bdc3c7',
    edgeLabelBg: '#303030',
    edgeLabelText: '#ebebeb',
    groupFill: '#3a3a3a',
    groupStroke: '#5e5e5e',
    groupTitle: '#bdc3c7',
    particle: '#8ab4ff',
    glow: '#8ab4ff',
    selection: '#8ab4ff',
    glowDefault: false,
  },
  lagoon: {
    id: 'lagoon',
    name: 'Lagoon',
    background: '#06222b',
    backgroundGradient: ['#06222b', '#0b4a52'],
    nodeFill: '#0d3a44',
    nodeStroke: '#43d9c5',
    nodeText: '#e6fffb',
    edge: '#2fb8a8',
    edgeLabelBg: '#0a2e36',
    edgeLabelText: '#e6fffb',
    groupFill: '#0a2f38',
    groupStroke: '#1f7f78',
    groupTitle: '#8ff0e2',
    particle: '#b6fff3',
    glow: '#43d9c5',
    selection: '#b6fff3',
    glowDefault: true,
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    background: '#1a0b12',
    backgroundGradient: ['#1a0b12', '#2b1020'],
    nodeFill: '#2a1220',
    nodeStroke: '#ff8a5b',
    nodeText: '#fff1e8',
    edge: '#d9673f',
    edgeLabelBg: '#1f0d17',
    edgeLabelText: '#fff1e8',
    groupFill: '#231019',
    groupStroke: '#7a3a2a',
    groupTitle: '#ffb59a',
    particle: '#ffd27a',
    glow: '#ff8a5b',
    selection: '#ffd27a',
    glowDefault: true,
  },
};

export function resolveTheme(choice: ThemeChoice, scheme: 'light' | 'dark'): ThemeId {
  if (choice === 'auto') {
    return scheme === 'dark' ? 'midnight' : 'daylight';
  }
  return choice;
}
