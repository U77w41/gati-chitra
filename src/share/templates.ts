export interface TemplateInfo {
  id: string;
  title: string;
  file: string;
}

export function templateUrl(baseUrl: string, file: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const cleanFile = file.replace(/^\/+/, '');
  return `${base}/templates/${cleanFile}`;
}

export async function loadTemplateIndex(
  baseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<TemplateInfo[]> {
  try {
    const url = templateUrl(baseUrl, 'index.json');
    const res = await fetchFn(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export async function loadTemplate(
  baseUrl: string,
  info: TemplateInfo,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const url = templateUrl(baseUrl, info.file);
    const res = await fetchFn(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
