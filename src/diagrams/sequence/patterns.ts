export const HEADER_RE = /^sequenceDiagram\s*$/;
export const AUTONUMBER_RE = /^autonumber(?:\s+(\d+))?(?:\s+(\d+))?$/;
export const TITLE_RE = /^title\s*:?\s*(.+)$/;
export const BOX_RE = /^box(?:\s+(.*))?$/;
export const FRAME_START_RE = /^(loop|alt|opt|par|critical|break|rect)\b\s*(.*)$/;
export const FRAME_DIVIDER_RE = /^(else|and|option)\b\s*(.*)$/;
export const END_RE = /^end$/;
export const ACTIVATE_RE = /^activate\s+(\S+)$/;
export const DEACTIVATE_RE = /^deactivate\s+(\S+)$/;
export const NOTE_RE = /^[Nn]ote\s+(left of|right of|over)\s+([^:]+?)\s*:\s*(.*)$/d;
export const IGNORED_MENUS_RE = /^(links?|properties|details)\b/;
export const CREATE_RE = /^create\s+(participant|actor)\s+(.*)$/;
export const DESTROY_RE = /^destroy\s+(\S+)$/;

export const PARTICIPANT_TYPE_RE = /^(participant|actor)\s+([^\s@]+)@\{(.*)\}(?:\s+as\s+(.+))?$/d;
export const PARTICIPANT_RE = /^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/d;

export const ARROWS = ['<<-->>', '<<->>', '-->>', '->>', '--x', '-x', '--)', '-)', '-->', '->'];
export const HALF = ['--|\\', '-|\\', '--|/', '-|/', '--\\\\', '-\\\\', '--//', '-//'];

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ops = [...HALF, ...ARROWS].map(escapeRegExp).join('|');
export const MSG_RE = new RegExp(
  String.raw`^([^\s:+-][^\s:]*?)\s*(${ops})\s*([+-]?)\s*([^\s:]+?)\s*(?::(.*))?$`,
  'd',
);
