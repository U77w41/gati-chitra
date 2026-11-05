import { FONT_STACK_SANS } from '../core/constants';
import type { Decoration, Theme } from '../core/types';
import { shadeFor } from './style';
import { fmt } from './svg';
import { escapeXml } from './xml';

export function drawDecorations(
  ctx: CanvasRenderingContext2D,
  decorations: Decoration[],
  theme: Theme,
): void {
  for (const d of decorations) {
    ctx.save();
    const shade = shadeFor(theme, d.colorIndex);

    if (d.kind === 'line') {
      let stroke = theme.edge;
      let width = 1;
      let dash: number[] | null = null;
      let alpha = 1;

      switch (d.role) {
        case 'lifeline':
          stroke = theme.edge;
          width = 1;
          dash = [4, 4];
          alpha = 0.6;
          break;
        case 'frameDivider':
          stroke = theme.groupStroke;
          width = 1;
          dash = [6, 4];
          break;
        case 'lane':
          stroke = shade?.stroke ?? theme.edge;
          width = 2;
          dash = [2, 6];
          alpha = 0.5;
          break;
        case 'axis':
          stroke = theme.edge;
          width = 2;
          break;
        default:
          break;
      }

      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.strokeStyle = stroke;
      if (dash) ctx.setLineDash(dash);

      ctx.beginPath();
      ctx.moveTo(d.from.x, d.from.y);
      ctx.lineTo(d.to.x, d.to.y);
      ctx.stroke();
    } else if (d.kind === 'rect') {
      let fill = theme.groupFill;
      let stroke = theme.groupStroke;
      let width = 1;

      switch (d.role) {
        case 'activation':
          fill = theme.nodeFill;
          stroke = theme.nodeStroke;
          width = 1;
          break;
        case 'frame':
          fill = theme.groupFill;
          stroke = theme.groupStroke;
          width = 1.5;
          break;
        case 'band':
          fill = shade?.fill ?? theme.groupFill;
          stroke = shade?.stroke ?? theme.groupStroke;
          width = 1.5;
          break;
        case 'tag':
          fill = theme.edgeLabelBg;
          stroke = theme.edge;
          width = 1;
          break;
        default:
          break;
      }

      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;

      ctx.beginPath();
      if (d.radius > 0) {
        ctx.roundRect(d.rect.x, d.rect.y, d.rect.width, d.rect.height, d.radius);
      } else {
        ctx.rect(d.rect.x, d.rect.y, d.rect.width, d.rect.height);
      }
      ctx.fill();
      ctx.stroke();

      if (d.label) {
        if (d.role === 'frame') {
          ctx.font = `bold 13px ${FONT_STACK_SANS}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = theme.groupTitle;
          ctx.fillText(d.label, d.rect.x + 8, d.rect.y + 14);
        } else if (d.role === 'band') {
          ctx.font = `bold 14px ${FONT_STACK_SANS}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = theme.nodeText;
          ctx.fillText(d.label, d.rect.x + d.rect.width / 2, d.rect.y + d.rect.height / 2);
        } else if (d.role === 'tag') {
          ctx.font = `12px ${FONT_STACK_SANS}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = theme.edgeLabelText;
          ctx.fillText(d.label, d.rect.x + d.rect.width / 2, d.rect.y + d.rect.height / 2);
        }
      }
    } else if (d.kind === 'text') {
      const sz = d.size ?? 12;
      ctx.font = `${d.bold ? 'bold ' : ''}${sz}px ${FONT_STACK_SANS}`;
      ctx.textAlign = d.align;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.nodeText;
      ctx.fillText(d.text, d.at.x, d.at.y);
    }
    ctx.restore();
  }
}

export function svgDecorations(decorations: Decoration[], theme: Theme): string {
  let out = '';
  for (const d of decorations) {
    const shade = shadeFor(theme, d.colorIndex);

    if (d.kind === 'line') {
      let stroke = theme.edge;
      let width = 1;
      let dash: number[] | null = null;
      let alpha = 1;

      switch (d.role) {
        case 'lifeline':
          stroke = theme.edge;
          width = 1;
          dash = [4, 4];
          alpha = 0.6;
          break;
        case 'frameDivider':
          stroke = theme.groupStroke;
          width = 1;
          dash = [6, 4];
          break;
        case 'lane':
          stroke = shade?.stroke ?? theme.edge;
          width = 2;
          dash = [2, 6];
          alpha = 0.5;
          break;
        case 'axis':
          stroke = theme.edge;
          width = 2;
          break;
        default:
          break;
      }

      let attrs = `stroke="${stroke}" stroke-width="${fmt(width)}"`;
      if (dash) attrs += ` stroke-dasharray="${dash.map(fmt).join(' ')}"`;
      if (alpha < 1) attrs += ` stroke-opacity="${fmt(alpha)}"`;

      out += `<line x1="${fmt(d.from.x)}" y1="${fmt(d.from.y)}" x2="${fmt(d.to.x)}" y2="${fmt(d.to.y)}" ${attrs}/>`;
    } else if (d.kind === 'rect') {
      let fill = theme.groupFill;
      let stroke = theme.groupStroke;
      let width = 1;

      switch (d.role) {
        case 'activation':
          fill = theme.nodeFill;
          stroke = theme.nodeStroke;
          width = 1;
          break;
        case 'frame':
          fill = theme.groupFill;
          stroke = theme.groupStroke;
          width = 1.5;
          break;
        case 'band':
          fill = shade?.fill ?? theme.groupFill;
          stroke = shade?.stroke ?? theme.groupStroke;
          width = 1.5;
          break;
        case 'tag':
          fill = theme.edgeLabelBg;
          stroke = theme.edge;
          width = 1;
          break;
        default:
          break;
      }

      let rAttr = '';
      if (d.radius > 0) rAttr = ` rx="${fmt(d.radius)}"`;

      out += `<rect x="${fmt(d.rect.x)}" y="${fmt(d.rect.y)}" width="${fmt(d.rect.width)}" height="${fmt(d.rect.height)}"${rAttr} fill="${fill}" stroke="${stroke}" stroke-width="${fmt(width)}"/>`;

      if (d.label) {
        if (d.role === 'frame') {
          out += `<text x="${fmt(d.rect.x + 8)}" y="${fmt(d.rect.y + 14)}" dy="0.35em" text-anchor="start" font-size="13" font-weight="bold" fill="${theme.groupTitle}">${escapeXml(d.label)}</text>`;
        } else if (d.role === 'band') {
          out += `<text x="${fmt(d.rect.x + d.rect.width / 2)}" y="${fmt(d.rect.y + d.rect.height / 2)}" dy="0.35em" text-anchor="middle" font-size="14" font-weight="bold" fill="${theme.nodeText}">${escapeXml(d.label)}</text>`;
        } else if (d.role === 'tag') {
          out += `<text x="${fmt(d.rect.x + d.rect.width / 2)}" y="${fmt(d.rect.y + d.rect.height / 2)}" dy="0.35em" text-anchor="middle" font-size="12" fill="${theme.edgeLabelText}">${escapeXml(d.label)}</text>`;
        }
      }
    } else if (d.kind === 'text') {
      const sz = d.size ?? 12;
      const anchor = d.align === 'center' ? 'middle' : 'start';
      const weight = d.bold ? ' font-weight="bold"' : '';
      out += `<text x="${fmt(d.at.x)}" y="${fmt(d.at.y)}" dy="0.35em" text-anchor="${anchor}" font-size="${sz}"${weight} fill="${theme.nodeText}">${escapeXml(d.text)}</text>`;
    }
  }
  return out;
}
