import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import './tokens.css';
import './chrome.css';
import './style.css';
import './shell.css';
import './present.css';
import { initApp } from './ui';
import { setupPropsDock } from './props-dock';
import { setupDock } from './dock-toggle';
import { setupEditorTabs } from './editor-tabs';

initApp();
setupPropsDock();
setupDock();
setupEditorTabs();
