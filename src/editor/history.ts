import { LIMITS } from '../core/constants';

export interface History {
  past: string[];
  present: string;
  future: string[];
}

export function createHistory(text: string): History {
  return { past: [], present: text, future: [] };
}

export function pushText(
  h: History,
  text: string,
  opts?: { coalesce?: boolean },
): History {
  if (text === h.present) {
    return h;
  }
  if (opts?.coalesce && h.past.length > 0) {
    return {
      past: h.past,
      present: text,
      future: [],
    };
  }
  const past = [...h.past, h.present];
  const trimmedPast =
    past.length > LIMITS.undoDepth
      ? past.slice(past.length - LIMITS.undoDepth)
      : past;
  return {
    past: trimmedPast,
    present: text,
    future: [],
  };
}

export function undo(h: History): History {
  if (h.past.length === 0) {
    return h;
  }
  const present = h.past[h.past.length - 1];
  const past = h.past.slice(0, -1);
  const future = [h.present, ...h.future];
  return { past, present, future };
}

export function redo(h: History): History {
  if (h.future.length === 0) {
    return h;
  }
  const present = h.future[0];
  const future = h.future.slice(1);
  const past = [...h.past, h.present];
  return { past, present, future };
}

export function canUndo(h: History): boolean {
  return h.past.length > 0;
}

export function canRedo(h: History): boolean {
  return h.future.length > 0;
}
