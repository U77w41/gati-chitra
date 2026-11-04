export function cacheName(buildId: string): string {
  return `gati-chitra-${buildId}`;
}

export function precacheUrls(files: string[], base: string): string[] {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const result: string[] = [normalizedBase];

  for (const f of files) {
    if (f === 'sw.js' || f.endsWith('.map')) continue;
    const clean = f.startsWith('/') ? f.slice(1) : f;
    const full = `${normalizedBase}${clean}`;
    if (!result.includes(full)) {
      result.push(full);
    }
  }

  return result;
}

export function strategyFor(
  url: URL,
  scope: URL,
): 'network-first' | 'cache-first' | 'bypass' {
  if (url.origin !== scope.origin) {
    return 'bypass';
  }
  if (!url.pathname.startsWith(scope.pathname)) {
    return 'bypass';
  }
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    return 'network-first';
  }
  return 'cache-first';
}
