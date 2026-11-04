export function canShareFile(
  file: File,
  nav: Pick<Navigator, 'canShare'> | undefined,
): boolean {
  if (!nav || typeof nav.canShare !== 'function') return false;
  try {
    return nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function shareFile(
  file: File,
  nav: Pick<Navigator, 'share'> | undefined,
): Promise<'shared' | 'cancelled' | 'unsupported'> {
  if (!nav || typeof nav.share !== 'function') return 'unsupported';
  try {
    await nav.share({ files: [file] });
    return 'shared';
  } catch (err: unknown) {
    if (
      (err instanceof DOMException && err.name === 'AbortError') ||
      (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError')
    ) {
      return 'cancelled';
    }
    return 'unsupported';
  }
}
