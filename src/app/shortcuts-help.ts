import type { ShortcutAction } from './shortcuts';

export const SHORTCUT_HELP: {
  keys: string;
  action: ShortcutAction | 'pan' | 'navigate' | 'nudge';
  text: string;
}[] = [
  { keys: 'Ctrl+Z / Cmd+Z', action: 'undo', text: 'Undo' },
  { keys: 'Ctrl+Y / Cmd+Shift+Z', action: 'redo', text: 'Redo' },
  { keys: 'Ctrl+0 / Cmd+0', action: 'fit', text: 'Fit diagram to view' },
  { keys: '+ / =', action: 'zoomIn', text: 'Zoom in' },
  { keys: '-', action: 'zoomOut', text: 'Zoom out' },
  { keys: 'P', action: 'present', text: 'Toggle present mode' },
  { keys: 'K', action: 'togglePause', text: 'Pause or resume animation' },
  { keys: 'Delete / Backspace', action: 'delete', text: 'Delete selected node or edge' },
  { keys: 'Enter', action: 'rename', text: 'Rename selected node' },
  { keys: 'Escape', action: 'escape', text: 'Deselect or exit' },
  { keys: '?', action: 'help', text: 'Show help and shortcuts' },
  { keys: 'Drag canvas', action: 'pan', text: 'Pan the diagram view' },
  { keys: 'Arrow keys in present mode', action: 'navigate', text: 'Next or previous present step' },
  { keys: 'Arrow keys on splitter', action: 'nudge', text: 'Resize panels' },
  { keys: 'Arrow keys on canvas', action: 'navigate', text: 'Select node in direction' },
  { keys: '[ / ] on canvas', action: 'navigate', text: 'Cycle arrows of selected node' },
  { keys: 'Shift+Arrow on canvas', action: 'nudge', text: 'Nudge selected node position' },
];
