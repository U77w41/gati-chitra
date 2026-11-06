export const HEADER_RE = /^requirementDiagram\s*$/;
export const DIR_RE = /^direction\s+(TB|TD|BT|LR|RL)$/;
export const CLOSE_BRACE_RE = /^\}$/;

export const REQ_BLOCK_OPEN_RE = /^(requirement|functionalRequirement|interfaceRequirement|performanceRequirement|physicalRequirement|designConstraint)\s+("?)([^"{]+?)\2\s*\{$/d;
export const EL_BLOCK_OPEN_RE = /^element\s+("?)([^"{]+?)\1\s*\{$/d;
export const FIELD_RE = /^(id|text|risk|verifymethod|type|docref)\s*:\s*(.*)$/i;

export const REL_FORWARD_RE = /^(\S+)\s+-\s+(contains|copies|derives|satisfies|verifies|refines|traces)\s+->\s+(\S+)$/d;
export const REL_BACKWARD_RE = /^(\S+)\s+<-\s+(contains|copies|derives|satisfies|verifies|refines|traces)\s+-\s+(\S+)$/d;

export const STYLE_RE = /^style\s+([A-Za-z0-9_-]+)\s+(.+)$/;
export const CLASS_DEF_RE = /^classDef\s+([A-Za-z0-9_-]+)\s+(.+)$/;
export const CLASS_RE = /^class\s+([\w, -]+?)\s+([A-Za-z0-9_-]+)$/;
export const CLASS_APPLY_RE = /^([A-Za-z0-9_-]+(?:::[\w-]+)?(?:,[A-Za-z0-9_-]+(?:::[\w-]+)?)*)\s*:::\s*([A-Za-z0-9_-]+)$/;
