export function stripFences(text: string): string {
  const lines = text.split(/\r?\n/);
  let start = 0;
  while (start < lines.length && lines[start].trim() === '') {
    start++;
  }
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === '') {
    end--;
  }

  if (start <= end) {
    const firstMatch = /^\s*(```|~~~)\s*mermaid\s*$/i.test(lines[start]);
    const lastMatch = /^\s*(```|~~~)\s*$/.test(lines[end]);
    if (firstMatch && lastMatch) {
      return lines.slice(start + 1, end).join('\n');
    }
  }

  return text;
}
