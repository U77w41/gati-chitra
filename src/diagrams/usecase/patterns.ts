export const HEADER_RE = /^usecase-beta\s*$/;
export const DIR_RE = /^direction\s+(TB|TD|BT|LR|RL)$/;
export const END_RE = /^end$/;

export const ACTOR_RE = /^actor\s+([A-Za-z0-9_-]+)(?:\(\s*"?([^")]*)"?\s*\))?$/d;
export const UC_ELLIPSE_RE = /^([A-Za-z0-9_-]+)\(\s*"?([^")]*)"?\s*\)$/d;
export const UC_RECT_RE = /^([A-Za-z0-9_-]+)\[\s*"?([^"\]]*)"?\s*\]$/d;

export const SYS_BOUNDARY_RE = /^systemBoundary\s+([A-Za-z0-9_-]+)(?:\[\s*"?([^"\]]*)"?\s*\])?$/d;
export const SYS_BOUNDARY_QUOTED_RE = /^systemBoundary\s+"([^"]*)"$/d;

export const LABELLED_ASSOC_RE = /^([A-Za-z0-9_-]+?)\s*--\s*"([^"]*)"\s*-+>\s*([A-Za-z0-9_-]+)$/d;
export const EDGE_RE = /^([A-Za-z0-9_-]+?)\s*(-{2,}>|<-{2,}|-{2,}o|o-{2,}|-{2,}x|x-{2,}|-{2,}\|>|\.\.>|-{2,})\s*([A-Za-z0-9_-]+)(?:\s*:\s*(.*))?$/d;

export const NOTE_RE = /^note\s+for\s+([A-Za-z0-9_-]+)\s+"([^"]*)"$/d;

export const STYLE_RE = /^style\s+([A-Za-z0-9_-]+)\s+(.+)$/;
export const CLASS_DEF_RE = /^classDef\s+([A-Za-z0-9_-]+)\s+(.+)$/;
export const CLASS_RE = /^class\s+([\w, -]+?)\s+([A-Za-z0-9_-]+)$/;
