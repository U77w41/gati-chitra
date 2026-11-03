import { downloadBlob as downloadBlobFile } from '../export/download';

export { downloadBlobFile as downloadBlob };

export function downloadText(
  data: string,
  filename: string,
  mime = 'text/plain',
): void {
  const blob = new Blob([data], { type: mime });
  downloadBlobFile(blob, filename);
}
