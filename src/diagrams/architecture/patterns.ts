export const HEADER_RE = /^architecture-beta\s*$/;
export const GROUP_RE = /^group\s+([A-Za-z0-9_-]+)(?:\(([\w:-]+)\))?(?:\[([^\]]*)\])?(?:\s+in\s+([A-Za-z0-9_-]+))?$/d;
export const SERVICE_RE = /^service\s+([A-Za-z0-9_-]+)(?:\(([\w:-]+)\))?(?:\[([^\]]*)\])?(?:\s+in\s+([A-Za-z0-9_-]+))?$/d;
export const JUNCTION_RE = /^junction\s+([A-Za-z0-9_-]+)(?:\s+in\s+([A-Za-z0-9_-]+))?$/d;
export const EDGE_RE = /^([A-Za-z0-9_-]+)(\{group\})?:([LRTB])\s*((?:<)?--(?:>)?)\s*([LRTB]):([A-Za-z0-9_-]+)(\{group\})?$/d;
export const ALIGN_RE = /^align\s+(row|column)\b/;
