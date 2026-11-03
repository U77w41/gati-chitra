export function safeFilename(name: string, ext: string): string {
  let s = name.trim().toLowerCase();
  const lowerExt = ext.toLowerCase();
  if (s.endsWith('.' + lowerExt)) {
    s = s.slice(0, -(lowerExt.length + 1));
  }
  s = s.replace(/[^a-z0-9._-]+/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^[-.]+|[-.]+$/g, '');
  if (!s) s = 'diagram';
  return `${s}.${lowerExt}`;
}
