export const HEADER_RE = /^erDiagram\s*$/;
export const DIR_RE = /^direction\s+(TB|TD|BT|LR|RL)$/;
export const CLOSE_BRACE_RE = /^\}$/;

const ENT = String.raw`("[^"]+"|[A-Za-z0-9_-]+)(?:\["?([^\]"]+)"?\])?`;
const CARD_L = String.raw`(\|o|\|\||\}o|\}\|)`;
const CARD_R = String.raw`(o\||\|\||o\{|\|\{)`;
const WORD = String.raw`(one or zero|zero or one|one or more|one or many|many\(1\)|1\+|zero or more|zero or many|many\(0\)|0\+|only one|1)`;

export const ENTITY_BLOCK_OPEN_RE = new RegExp(`^${ENT}\\s*\\{$`, 'd');
export const ENTITY_BLOCK_EMPTY_RE = new RegExp(`^${ENT}\\s*\\{\\s*\\}$`, 'd');
export const ATTR_RE = new RegExp(String.raw`^([\w()\[\],.?-]+)\s+(\*?[\w-]+)(?:\s+((?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*))?(?:\s+"([^"]*)")?$`);

export const REL_SYMBOL_RE = new RegExp(`^${ENT}\\s+${CARD_L}(--|\\.\\.)${CARD_R}\\s+${ENT}\\s*:\\s*(.+)$`, 'd');
export const REL_WORD_RE = new RegExp(`^${ENT}\\s+${WORD}\\s+(to|optionally to)\\s+${WORD}\\s+${ENT}\\s*:\\s*(.+)$`, 'd');

export const ENTITY_DECL_RE = new RegExp(`^${ENT}$`, 'd');

export const SUBGRAPH_RE = /^subgraph\s+([\w-]+)(?:\s*\[([^\]]*)\])?$/;
export const END_RE = /^end$/;

export const CSS_CLASS_RE = /^class\s+([\w, -]+?)\s+([A-Za-z0-9_-]+)$/;
export const STYLE_RE = /^style\s+([A-Za-z0-9_-]+)\s+(.+)$/;
export const CLASS_DEF_RE = /^classDef\s+([A-Za-z0-9_-]+)\s+(.+)$/;
export const CLASS_APPLY_RE = /^([A-Za-z0-9_-]+(?:::[\w-]+)?(?:,[A-Za-z0-9_-]+(?:::[\w-]+)?)*)\s*:::\s*([A-Za-z0-9_-]+)$/;
