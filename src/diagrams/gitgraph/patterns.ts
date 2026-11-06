export const HEADER_RE = /^gitGraph(?:\s+(LR|TB|BT))?\s*:?\s*$/;
export const COMMIT_RE = /^commit\b(.*)$/d;
export const BRANCH_RE = /^branch\s+("?)([^"\s]+)\1(.*)$/d;
export const CHECKOUT_RE = /^(?:checkout|switch)\s+("?)([^"\s]+)\1$/;
export const MERGE_RE = /^merge\s+("?)([^"\s]+)\1(.*)$/d;
export const CHERRY_PICK_RE = /^cherry-pick\b(.*)$/d;
