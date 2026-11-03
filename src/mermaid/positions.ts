export const PIN_MARKER = '%% studio:layout v1';
export const PIN_LINE_RE =
  /^\s*%%\s*studio:pos\s+(\S+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;

export function formatPinLine(id: string, x: number, y: number): string {
  return `%% studio:pos ${id} ${Math.round(x)} ${Math.round(y)}`;
}
