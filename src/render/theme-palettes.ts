import type { NodeShade, Theme, ThemeId } from '../core/types';

const ns = (f: string, s: string): NodeShade => ({ fill: f, stroke: s });

function defTheme(
  id: ThemeId,
  name: string,
  background: string,
  nodeFill: string,
  nodeStroke: string,
  nodeText: string,
  edge: string,
  groupFill: string,
  groupStroke: string,
  groupTitle: string,
  particle: string,
  gridColor: string,
  shades: [NodeShade, NodeShade, NodeShade, NodeShade],
  glowDefault = false,
  backgroundGradient: [string, string] | null = null,
): Theme {
  return {
    id,
    name,
    background,
    backgroundGradient,
    nodeFill,
    nodeStroke,
    nodeText,
    nodeShades: shades,
    edge,
    edgeLabelBg: background,
    edgeLabelText: nodeText,
    titleText: nodeText,
    groupFill,
    groupStroke,
    groupTitle,
    particle,
    glow: particle,
    selection: particle,
    glowDefault,
    gridColor,
  };
}

export const THEMES: Record<string, Theme> = {
  daylight: defTheme('daylight', 'Daylight', '#ffffff', '#f7f7fb', '#34495e', '#111418', '#4f5660', '#f5f5fa', '#cfd1dc', '#34495e', '#3b82f6', 'rgba(15, 23, 42, 0.08)', [
    ns('#eff6ff', '#3b82f6'), ns('#f0fdf4', '#22c55e'), ns('#faf5ff', '#9333ea'), ns('#fff7ed', '#ea580c'),
  ]),
  geist: defTheme('geist', 'Vercel Mono', '#fafafa', '#ffffff', '#18181b', '#09090b', '#71717a', '#f4f4f5', '#d4d4d8', '#27272a', '#2563eb', 'rgba(24, 24, 27, 0.07)', [
    ns('#ffffff', '#18181b'), ns('#f4f4f5', '#3f3f46'), ns('#eff6ff', '#1d4ed8'), ns('#f5f3ff', '#6d28d9'),
  ]),
  flexoki: defTheme('flexoki', 'Flexoki Paper', '#fffcf0', '#f2f0e5', '#403e3c', '#100f0f', '#6f6e69', '#f7f5ea', '#dad8ce', '#575653', '#da702c', 'rgba(16, 15, 15, 0.07)', [
    ns('#f2f0e5', '#403e3c'), ns('#e2ece9', '#24837b'), ns('#efe9d5', '#ad8301'), ns('#e6e4d9', '#205ea6'),
  ]),
  latte: defTheme('latte', 'Catppuccin Latte', '#eff1f5', '#ffffff', '#4c4f69', '#4c4f69', '#7c7f93', '#e6e9ef', '#bcc0cc', '#5c5f77', '#8839ef', 'rgba(76, 79, 105, 0.08)', [
    ns('#ffffff', '#4c4f69'), ns('#e0f2f1', '#179299'), ns('#ffedd5', '#fe640b'), ns('#f3e8ff', '#8839ef'),
  ]),
  matcha: defTheme('matcha', 'Kyoto Sage', '#f4f7f4', '#ffffff', '#2d4a3e', '#16261f', '#5c7c6d', '#ebf1ec', '#c5d6c8', '#2d4a3e', '#10b981', 'rgba(45, 74, 62, 0.08)', [
    ns('#ffffff', '#2d4a3e'), ns('#dcfce7', '#15803d'), ns('#fef9c3', '#a16207'), ns('#e0f2fe', '#0369a1'),
  ]),
  clay: defTheme('clay', 'Terracotta Sand', '#fbf7f4', '#f5ebe6', '#5c4033', '#291d18', '#8c6d5e', '#f7efe9', '#e0cec4', '#6e4f41', '#ea580c', 'rgba(92, 64, 51, 0.08)', [
    ns('#f5ebe6', '#5c4033'), ns('#e9f0ec', '#3d6b58'), ns('#f7eed6', '#b45309'), ns('#fae5dc', '#c2410c'),
  ]),
  swiss: defTheme('swiss', 'Swiss Grid', '#f6f6f6', '#ffffff', '#111111', '#111111', '#555555', '#eeeeee', '#cccccc', '#111111', '#e11d48', 'rgba(17, 17, 17, 0.09)', [
    ns('#ffffff', '#111111'), ns('#eaeaea', '#111111'), ns('#fee2e2', '#b91c1c'), ns('#dbeafe', '#1d4ed8'),
  ]),
  midnight: defTheme('midnight', 'Midnight', '#0f172a', '#1e293b', '#475569', '#f8fafc', '#64748b', '#1e293b', '#334155', '#94a3b8', '#38bdf8', 'rgba(248, 250, 252, 0.07)', [
    ns('#1e293b', '#475569'), ns('#0f292a', '#14b8a6'), ns('#2b2118', '#f59e0b'), ns('#1e1b4b', '#6366f1'),
  ], true),
  obsidian: defTheme('obsidian', 'Linear Carbon', '#090a0f', '#141622', '#26293d', '#f3f4f6', '#4b5278', '#0e1018', '#1f2233', '#9ca3af', '#818cf8', 'rgba(129, 140, 248, 0.08)', [
    ns('#141622', '#26293d'), ns('#112229', '#22d3ee'), ns('#231829', '#c084fc'), ns('#171c30', '#818cf8'),
  ], true, ['#090a0f', '#10121a']),
  graphite: defTheme('graphite', 'Raycast Matte', '#111113', '#18181b', '#3f3f46', '#f4f4f5', '#71717a', '#141417', '#27272a', '#a1a1aa', '#a3e635', 'rgba(255, 255, 255, 0.07)', [
    ns('#18181b', '#3f3f46'), ns('#1a2418', '#84cc16'), ns('#27272a', '#71717a'), ns('#172026', '#38bdf8'),
  ]),
  tokyonight: defTheme('tokyonight', 'Tokyo Night', '#1a1b26', '#24283b', '#414868', '#c0caf5', '#565f89', '#1f2335', '#3b4261', '#7aa2f7', '#7dcfff', 'rgba(192, 202, 245, 0.07)', [
    ns('#24283b', '#414868'), ns('#1d2b2f', '#73daca'), ns('#2e2624', '#ff9e64'), ns('#292338', '#bb9af7'),
  ], true, ['#1a1b26', '#16161e']),
  nordic: defTheme('nordic', 'Nordic Frost', '#242933', '#3b4252', '#4c566a', '#eceff4', '#616e88', '#292e39', '#434c5e', '#d8dee9', '#88c0d0', 'rgba(216, 222, 233, 0.07)', [
    ns('#3b4252', '#4c566a'), ns('#2e3d3b', '#8fbcbb'), ns('#3d3733', '#ebcb8b'), ns('#333b4d', '#81a1c1'),
  ], false, ['#242933', '#2e3440']),
  rosepine: defTheme('rosepine', 'Rosé Velvet', '#191724', '#26233a', '#403d52', '#e0def4', '#6e6a86', '#1f1d2e', '#393552', '#908caa', '#f6c177', 'rgba(224, 222, 244, 0.07)', [
    ns('#26233a', '#403d52'), ns('#212e34', '#9ccfd8'), ns('#332732', '#f6c177'), ns('#2c253f', '#c4a7e7'),
  ], true, ['#191724', '#1f1d2e']),
  monokai: defTheme('monokai', 'Espresso Warm', '#1c1917', '#292524', '#44403c', '#f5f5f4', '#78716c', '#211e1c', '#383330', '#a8a29e', '#f59e0b', 'rgba(245, 245, 244, 0.07)', [
    ns('#292524', '#44403c'), ns('#1f2922', '#84cc16'), ns('#30261c', '#f59e0b'), ns('#2b2129', '#ec4899'),
  ], true, ['#1c1917', '#24201d']),
  lagoon: defTheme('lagoon', 'Lagoon', '#041e2b', '#0b3548', '#14536b', '#e0f2fe', '#0ea5e9', '#082a3a', '#0f4459', '#38bdf8', '#22d3ee', 'rgba(56, 189, 248, 0.09)', [
    ns('#0b3548', '#14536b'), ns('#083b3e', '#2dd4bf'), ns('#102e4a', '#38bdf8'), ns('#16284c', '#818cf8'),
  ], true, ['#041e2b', '#0a2e3f']),
  ember: defTheme('ember', 'Ember', '#180c0e', '#2d1519', '#4a2026', '#fef2f2', '#f43f5e', '#241013', '#3d181d', '#fb7185', '#fb923c', 'rgba(251, 113, 133, 0.08)', [
    ns('#2d1519', '#4a2026'), ns('#2b1d12', '#fb923c'), ns('#361520', '#fb7185'), ns('#261726', '#e879f9'),
  ], true, ['#180c0e', '#2a1215']),
};

// Aliases for backward compatibility
THEMES.paper = { ...THEMES.flexoki, id: 'paper' as ThemeId, name: 'Warm Paper' };
THEMES.lavender = { ...THEMES.latte, id: 'lavender' as ThemeId, name: 'Soft Mist' };
