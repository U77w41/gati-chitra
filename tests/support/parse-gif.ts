export function parseGif(bytes: Uint8Array): {
  width: number;
  height: number;
  frames: number;
  delays: number[];
  loop: boolean;
} {
  const header = String.fromCharCode(...bytes.subarray(0, 6));
  if (header !== 'GIF89a' && header !== 'GIF87a') {
    throw new Error('Not a GIF document');
  }

  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  const flags = bytes[10];
  let pos = 13;
  if (flags & 0x80) {
    pos += 3 * 2 ** ((flags & 7) + 1);
  }

  let frames = 0;
  const delays: number[] = [];
  let loop = false;

  while (pos < bytes.length) {
    const b = bytes[pos];
    if (b === 0x3b) {
      break;
    }
    if (b === 0x21) {
      const label = bytes[pos + 1];
      if (label === 0xf9) {
        delays.push(bytes[pos + 4] | (bytes[pos + 5] << 8));
      }
      if (label === 0xff) {
        const app = String.fromCharCode(...bytes.subarray(pos + 3, pos + 14));
        if (app === 'NETSCAPE2.0') {
          loop = true;
        }
      }
      pos += 2;
      while (bytes[pos] !== 0) {
        pos += bytes[pos] + 1;
      }
      pos += 1;
    } else if (b === 0x2c) {
      frames += 1;
      const local = bytes[pos + 9];
      pos += 10;
      if (local & 0x80) {
        pos += 3 * 2 ** ((local & 7) + 1);
      }
      pos += 1;
      while (bytes[pos] !== 0) {
        pos += bytes[pos] + 1;
      }
      pos += 1;
    } else {
      throw new Error(`Unexpected byte 0x${b.toString(16)} at offset ${pos}`);
    }
  }

  return { width, height, frames, delays, loop };
}
