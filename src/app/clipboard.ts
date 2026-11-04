export interface ClipboardDeps {
  clipboard?: Pick<Clipboard, 'write' | 'writeText'>;
  makeItem?: (items: Record<string, Promise<Blob>>) => ClipboardItem;
}

function defaultDeps(): ClipboardDeps {
  return {
    clipboard: typeof navigator !== 'undefined' ? navigator.clipboard : undefined,
    makeItem:
      typeof ClipboardItem !== 'undefined'
        ? (items) => new ClipboardItem(items)
        : undefined,
  };
}

export async function copyImage(
  png: Promise<Blob>,
  deps: ClipboardDeps = defaultDeps(),
): Promise<'ok' | 'unsupported' | 'denied'> {
  if (!deps.clipboard?.write || !deps.makeItem) {
    return 'unsupported';
  }
  try {
    const item = deps.makeItem({ 'image/png': png });
    await deps.clipboard.write([item]);
    return 'ok';
  } catch {
    return 'denied';
  }
}

export async function copyText(
  text: string,
  deps: ClipboardDeps = defaultDeps(),
): Promise<'ok' | 'denied'> {
  if (!deps.clipboard?.writeText) {
    return 'denied';
  }
  try {
    await deps.clipboard.writeText(text);
    return 'ok';
  } catch {
    return 'denied';
  }
}
