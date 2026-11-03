function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

export function minimalChange(
  a: string,
  b: string
): { from: number; to: number; insert: string } | null {
  if (a === b) return null;

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start++;
  }

  if (
    start > 0 &&
    isHighSurrogate(a.charCodeAt(start - 1)) &&
    isLowSurrogate(a.charCodeAt(start))
  ) {
    start--;
  }

  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  if (
    endA < a.length &&
    isHighSurrogate(a.charCodeAt(endA - 1)) &&
    isLowSurrogate(a.charCodeAt(endA))
  ) {
    endA++;
    endB++;
  }

  return {
    from: start,
    to: endA,
    insert: b.slice(start, endB),
  };
}
