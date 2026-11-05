import { FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { NodeBox } from '../core/types';
import { escapeXml } from './xml';

export function drawSections(
  ctx: CanvasRenderingContext2D,
  box: NodeBox,
  st: { stroke: string; text: string },
  textProg: number | undefined,
): void {
  if (!box.sections || box.sections.length === 0) return;

  const left = box.center.x - box.width / 2;
  const right = left + box.width;
  const top = box.center.y - box.height / 2;
  const cx = box.center.x;

  let totalRows = 0;
  for (const s of box.sections) {
    totalRows += s.rows.length;
  }
  const maxRows =
    textProg !== undefined ? Math.ceil(totalRows * Math.max(0, Math.min(1, textProg))) : totalRows;

  let rowsDrawn = 0;

  for (const s of box.sections) {
    if (s.divider) {
      const lineY = top + s.top;
      ctx.save();
      ctx.strokeStyle = st.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, lineY);
      ctx.lineTo(right, lineY);
      ctx.stroke();
      ctx.restore();
    }

    const weightPrefix = s.weight === 'normal' ? '' : `${s.weight} `;
    ctx.font = `${weightPrefix}${LAYOUT.sectionFontSize}px ${FONT_STACK_SANS}`;
    ctx.fillStyle = st.text;
    ctx.textBaseline = 'middle';

    for (let r = 0; r < s.rows.length; r++) {
      if (rowsDrawn >= maxRows) break;
      const row = s.rows[r];
      const y = top + s.top + LAYOUT.sectionPadY + (r + 0.5) * LAYOUT.sectionLineH;

      if (s.align === 'center') {
        ctx.textAlign = 'center';
        const text = row.join(' ');
        ctx.fillText(text, cx, y);
      } else {
        ctx.textAlign = 'left';
        for (let c = 0; c < row.length; c++) {
          const text = row[c] ?? '';
          if (text.length > 0) {
            const x = left + (s.colX[c] ?? LAYOUT.sectionPadX);
            ctx.fillText(text, x, y);
          }
        }
      }
      rowsDrawn++;
    }
  }
}

export function svgSections(
  box: NodeBox,
  st: { stroke: string; text: string },
): string {
  if (!box.sections || box.sections.length === 0) return '';

  const left = box.center.x - box.width / 2;
  const right = left + box.width;
  const top = box.center.y - box.height / 2;
  const cx = box.center.x;

  let out = '';

  for (const s of box.sections) {
    if (s.divider) {
      const lineY = top + s.top;
      out += `<line x1="${left}" y1="${lineY}" x2="${right}" y2="${lineY}" stroke="${st.stroke}" stroke-width="1"/>`;
    }

    const weightAttr = s.weight === 'bold' ? ' font-weight="bold"' : s.weight === 'italic' ? ' font-style="italic"' : '';

    for (let r = 0; r < s.rows.length; r++) {
      const row = s.rows[r];
      const y = top + s.top + LAYOUT.sectionPadY + (r + 0.5) * LAYOUT.sectionLineH;

      if (s.align === 'center') {
        const text = row.join(' ');
        out += `<text x="${cx}" y="${y}" dy="0.35em" text-anchor="middle" font-size="${LAYOUT.sectionFontSize}"${weightAttr} fill="${st.text}">${escapeXml(text)}</text>`;
      } else {
        for (let c = 0; c < row.length; c++) {
          const text = row[c] ?? '';
          if (text.length > 0) {
            const x = left + (s.colX[c] ?? LAYOUT.sectionPadX);
            out += `<text x="${x}" y="${y}" dy="0.35em" text-anchor="start" font-size="${LAYOUT.sectionFontSize}"${weightAttr} fill="${st.text}">${escapeXml(text)}</text>`;
          }
        }
      }
    }
  }

  return out;
}
