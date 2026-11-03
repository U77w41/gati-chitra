export function createRecordingContext(
  width = 800,
  height = 600,
): {
  ctx: CanvasRenderingContext2D;
  calls: { name: string; args: unknown[] }[];
} {
  const calls: { name: string; args: unknown[] }[] = [];

  const proxy = new Proxy({} as CanvasRenderingContext2D, {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      if (prop === 'canvas') {
        return { width, height };
      }
      if (prop === 'measureText') {
        return (text: string) => {
          calls.push({ name: 'measureText', args: [text] });
          return { width: text.length * 8 };
        };
      }
      if (prop === 'createLinearGradient') {
        return (...args: unknown[]) => {
          calls.push({ name: 'createLinearGradient', args });
          return {
            addColorStop: (...stopArgs: unknown[]) => {
              calls.push({ name: 'addColorStop', args: stopArgs });
            },
          };
        };
      }
      return (...args: unknown[]) => {
        calls.push({ name: prop, args });
      };
    },
    set(_target, prop: string | symbol, value: unknown) {
      if (typeof prop === 'string') {
        calls.push({ name: 'set:' + prop, args: [value] });
      }
      return true;
    },
  });

  return { ctx: proxy, calls };
}
