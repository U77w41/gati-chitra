import { LAYOUT } from '../core/constants';
import type { Scene, Theme } from '../core/types';
import { shapePolygon } from '../layout/geometry';
import type { MeasureText } from '../layout/measure';
import { svgIcon } from './icons';
import { labelCenter } from './label-pos';
import { svgSections } from './sections';
import { documentPathData, ringRadii } from './shapes-extra';
import { nodeStyle } from './style';
import { fmt } from './svg';
import { escapeXml } from './xml';

export function svgNodes(
  scene: Scene,
  theme: Theme,
  _measure: MeasureText,
): string {
  let out = '';
  for (const node of scene.doc.nodes) {
    const box = scene.layout.nodes[node.id];
    if (!box) continue;
    const link = scene.doc.links[node.id];
    if (link) {
      out += `<a href="${escapeXml(link.url)}" target="${link.target}" rel="noopener noreferrer">`;
      if (link.tooltip) {
        out += `<title>${escapeXml(link.tooltip)}</title>`;
      }
    }
    const st = nodeStyle(node, theme);
    const cx = box.center.x;
    const cy = box.center.y;
    const w = box.width;
    const h = box.height;
    const l = cx - w / 2;
    const r = cx + w / 2;
    const t = cy - h / 2;
    const b = cy + h / 2;
    const strokeAttr = `fill="${st.fill}" stroke="${st.stroke}" stroke-width="${fmt(st.strokeWidth)}"`;

    switch (node.shape) {
      case 'rect':
        out += `<rect x="${fmt(l)}" y="${fmt(t)}" width="${fmt(w)}" height="${fmt(h)}" rx="4" ${strokeAttr}/>`;
        break;
      case 'round':
        out += `<rect x="${fmt(l)}" y="${fmt(t)}" width="${fmt(w)}" height="${fmt(h)}" rx="12" ${strokeAttr}/>`;
        break;
      case 'stadium':
        out += `<rect x="${fmt(l)}" y="${fmt(t)}" width="${fmt(w)}" height="${fmt(h)}" rx="${fmt(h / 2)}" ${strokeAttr}/>`;
        break;
      case 'circle':
      case 'smallCircle':
        out += `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(w / 2)}" ${strokeAttr}/>`;
        break;
      case 'filledCircle':
        out += `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(w / 2)}" fill="${st.stroke}" stroke="${st.stroke}" stroke-width="${fmt(st.strokeWidth)}"/>`;
        break;
      case 'doubleCircle':
      case 'framedCircle': {
        const { outer, inner } = ringRadii(box);
        out += `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(outer)}" ${strokeAttr}/>`;
        out += `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(inner)}" fill="none" stroke="${st.stroke}" stroke-width="${fmt(st.strokeWidth)}"/>`;
        break;
      }
      case 'forkBar':
        out += `<rect x="${fmt(l)}" y="${fmt(t)}" width="${fmt(w)}" height="${fmt(h)}" fill="${st.stroke}" stroke="${st.stroke}" stroke-width="${fmt(st.strokeWidth)}"/>`;
        break;
      case 'document': {
        const d = documentPathData(box);
        const pathStr = `M ${fmt(d.start.x)} ${fmt(d.start.y)} L ${fmt(d.topRight.x)} ${fmt(d.topRight.y)} L ${fmt(d.rightBottom.x)} ${fmt(d.rightBottom.y)} C ${fmt(d.curve1.cp1.x)} ${fmt(d.curve1.cp1.y)}, ${fmt(d.curve1.cp2.x)} ${fmt(d.curve1.cp2.y)}, ${fmt(d.curve1.to.x)} ${fmt(d.curve1.to.y)} C ${fmt(d.curve2.cp1.x)} ${fmt(d.curve2.cp1.y)}, ${fmt(d.curve2.cp2.x)} ${fmt(d.curve2.cp2.y)}, ${fmt(d.curve2.to.x)} ${fmt(d.curve2.to.y)} Z`;
        out += `<path d="${pathStr}" ${strokeAttr}/>`;
        break;
      }
      case 'text':
        break;
      case 'diamond':
      case 'hexagon':
      case 'parallelogram':
      case 'parallelogramAlt':
      case 'trapezoid':
      case 'trapezoidAlt':
      case 'asymmetric': {
        const poly = shapePolygon(box, node.shape);
        if (poly && poly.length > 0) {
          const pts = poly.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
          out += `<polygon points="${pts}" ${strokeAttr}/>`;
        }
        break;
      }
      case 'cylinder': {
        const rx = w / 2;
        const ry = 8;
        const dBody = `M ${fmt(l)} ${fmt(t + ry)} A ${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(r)} ${fmt(t + ry)} L ${fmt(r)} ${fmt(b - ry)} A ${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(l)} ${fmt(b - ry)} Z`;
        const dRim = `M ${fmt(l)} ${fmt(t + ry)} A ${fmt(rx)} ${fmt(ry)} 0 0 0 ${fmt(r)} ${fmt(t + ry)}`;
        out += `<path d="${dBody}" ${strokeAttr}/>`;
        out += `<path d="${dRim}" fill="none" stroke="${st.stroke}" stroke-width="${fmt(st.strokeWidth)}"/>`;
        break;
      }
      case 'subroutine':
        out += `<rect x="${fmt(l)}" y="${fmt(t)}" width="${fmt(w)}" height="${fmt(h)}" rx="4" ${strokeAttr}/>`;
        out += `<line x1="${fmt(l + 8)}" y1="${fmt(t)}" x2="${fmt(l + 8)}" y2="${fmt(b)}" stroke="${st.stroke}" stroke-width="${fmt(st.strokeWidth)}"/>`;
        out += `<line x1="${fmt(r - 8)}" y1="${fmt(t)}" x2="${fmt(r - 8)}" y2="${fmt(b)}" stroke="${st.stroke}" stroke-width="${fmt(st.strokeWidth)}"/>`;
        break;
      default:
        out += `<rect x="${fmt(l)}" y="${fmt(t)}" width="${fmt(w)}" height="${fmt(h)}" rx="4" ${strokeAttr}/>`;
        break;
    }

    if (box.sections && box.sections.length > 0) {
      out += svgSections(box, st);
    } else if (node.icon) {
      const iconSize = Math.min(LAYOUT.iconSize, box.width * 0.6);
      const top = cy - box.height / 2;
      const iconCenterY =
        node.label.length === 0
          ? cy
          : top + LAYOUT.nodePadY + iconSize / 2;
      const iconColor = node.shape === 'filledCircle' ? st.fill : st.stroke;
      out += svgIcon(node.icon, cx, iconCenterY, iconSize, iconColor);
      if (node.label.length > 0) {
        const center = labelCenter(node, box);
        if (box.runs) {
          const nLines = box.runs.length;
          for (let k = 0; k < nLines; k++) {
            const lineY = center.y + (k - (nLines - 1) / 2) * LAYOUT.lineHeight;
            out += `<text x="${fmt(center.x)}" y="${fmt(lineY)}" dy="0.35em" text-anchor="middle" font-size="16" fill="${st.text}">`;
            for (const run of box.runs[k]) {
              let attrs = '';
              if (run.bold) attrs += ' font-weight="bold"';
              if (run.italic) attrs += ' font-style="italic"';
              out += `<tspan${attrs}>${escapeXml(run.text)}</tspan>`;
            }
            out += '</text>';
          }
        } else {
          const nLines = box.lines.length;
          for (let k = 0; k < nLines; k++) {
            const lineY = center.y + (k - (nLines - 1) / 2) * LAYOUT.lineHeight;
            out += `<text x="${fmt(center.x)}" y="${fmt(lineY)}" dy="0.35em" text-anchor="middle" font-size="16" fill="${st.text}">${escapeXml(box.lines[k])}</text>`;
          }
        }
      }
    } else if (
      node.shape !== 'smallCircle' &&
      node.shape !== 'filledCircle' &&
      node.shape !== 'forkBar'
    ) {
      if (box.runs) {
        const nLines = box.runs.length;
        for (let k = 0; k < nLines; k++) {
          const lineY = cy + (k - (nLines - 1) / 2) * LAYOUT.lineHeight;
          out += `<text x="${fmt(cx)}" y="${fmt(lineY)}" dy="0.35em" text-anchor="middle" font-size="16" fill="${st.text}">`;
          for (const run of box.runs[k]) {
            let attrs = '';
            if (run.bold) attrs += ' font-weight="bold"';
            if (run.italic) attrs += ' font-style="italic"';
            out += `<tspan${attrs}>${escapeXml(run.text)}</tspan>`;
          }
          out += '</text>';
        }
      } else {
        const nLines = box.lines.length;
        for (let k = 0; k < nLines; k++) {
          const lineY = cy + (k - (nLines - 1) / 2) * LAYOUT.lineHeight;
          out += `<text x="${fmt(cx)}" y="${fmt(lineY)}" dy="0.35em" text-anchor="middle" font-size="16" fill="${st.text}">${escapeXml(box.lines[k])}</text>`;
        }
      }
    }

    if (link) {
      out += '</a>';
    }
  }
  return out;
}
