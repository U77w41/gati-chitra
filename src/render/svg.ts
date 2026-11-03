import { EXPORT, FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { ExportMode, Scene, Theme } from '../core/types';
import { describeDiagram } from '../app/describe';
import { shapePolygon, tangentAt } from '../layout/geometry';
import type { MeasureText } from '../layout/measure';
import { parseInlineMarkdown } from '../layout/rich-text';
import { exportFrame } from './frame';
import { edgeStyle, nodeStyle } from './style';
import { documentPathData, ringRadii } from './shapes-extra';
import { escapeXml } from './xml';

export interface SvgOptions {
  mode: ExportMode;
  transparent: boolean;
}

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const factor = 10 ** EXPORT.svgDecimals;
  const rounded = Math.round(n * factor) / factor;
  if (rounded === 0 || Object.is(rounded, -0)) {
    return '0';
  }
  return String(rounded);
}

export { escapeXml } from './xml';

export function renderSvg(
  scene: Scene,
  theme: Theme,
  opts: SvgOptions,
  measure: MeasureText,
): string {
  const frame = exportFrame(scene.layout.bounds, opts.mode, 1);
  const desc = describeDiagram(scene.doc);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(frame.pixelWidth)}" height="${fmt(frame.pixelHeight)}" viewBox="${fmt(frame.world.x)} ${fmt(frame.world.y)} ${fmt(frame.world.width)} ${fmt(frame.world.height)}" role="img" aria-labelledby="gc-title gc-desc" font-family="${escapeXml(FONT_STACK_SANS)}">`;

  out += `<title id="gc-title">${escapeXml(desc.name)}</title><desc id="gc-desc">${escapeXml(desc.description)}</desc>`;

  if (scene.layout.title) {
    out += `<text x="${fmt(scene.layout.title.center.x)}" y="${fmt(scene.layout.title.center.y)}" dy="0.35em" text-anchor="middle" font-size="${LAYOUT.titleFontSize}" font-weight="bold" fill="${theme.nodeText}">${escapeXml(scene.layout.title.text)}</text>`;
  }

  if (!opts.transparent) {
    if (theme.backgroundGradient) {
      const [colA, colB] = theme.backgroundGradient;
      out += `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colA}"/><stop offset="1" stop-color="${colB}"/></linearGradient></defs>`;
      out += `<rect x="${fmt(frame.world.x)}" y="${fmt(frame.world.y)}" width="${fmt(frame.world.width)}" height="${fmt(frame.world.height)}" fill="url(#bg)"/>`;
    } else {
      out += `<rect x="${fmt(frame.world.x)}" y="${fmt(frame.world.y)}" width="${fmt(frame.world.width)}" height="${fmt(frame.world.height)}" fill="${theme.background}"/>`;
    }
  }

  const groups = Object.values(scene.layout.groups);
  groups.sort((a, b) => a.depth - b.depth);
  for (const g of groups) {
    out += `<rect x="${fmt(g.rect.x)}" y="${fmt(g.rect.y)}" width="${fmt(g.rect.width)}" height="${fmt(g.rect.height)}" rx="10" fill="${theme.groupFill}" stroke="${theme.groupStroke}" stroke-width="1.5"/>`;
    out += `<text x="${fmt(g.rect.x + 12)}" y="${fmt(g.rect.y + LAYOUT.groupTitleH / 2)}" dy="0.35em" font-size="14" font-weight="700" fill="${theme.groupTitle}">${escapeXml(g.title)}</text>`;
  }

  const arrowSize = LAYOUT.arrowSize;
  for (const edge of scene.doc.edges) {
    if (edge.kind === 'invisible') continue;
    const path = scene.layout.edges[edge.id];
    if (!path) continue;
    const st = edgeStyle(edge, theme);
    const d =
      path.kind === 'straight' || !path.control
        ? `M ${fmt(path.from.x)} ${fmt(path.from.y)} L ${fmt(path.to.x)} ${fmt(path.to.y)}`
        : `M ${fmt(path.from.x)} ${fmt(path.from.y)} Q ${fmt(path.control.x)} ${fmt(path.control.y)} ${fmt(path.to.x)} ${fmt(path.to.y)}`;
    const dash =
      st.dash && st.dash.length > 0 ? ` stroke-dasharray="${st.dash.map(fmt).join(' ')}"` : '';
    out += `<path d="${d}" fill="none" stroke="${st.stroke}" stroke-width="${fmt(st.width)}" stroke-linecap="round"${dash}/>`;

    if (st.startMarker === 'arrow' || st.startArrow) {
      const t0 = tangentAt(path, 0);
      const n0 = { x: -t0.y, y: t0.x };
      const from = path.from;
      const p1 = {
        x: from.x + t0.x * arrowSize + n0.x * arrowSize * 0.4,
        y: from.y + t0.y * arrowSize + n0.y * arrowSize * 0.4,
      };
      const p2 = {
        x: from.x + t0.x * arrowSize - n0.x * arrowSize * 0.4,
        y: from.y - t0.y * arrowSize - n0.y * arrowSize * 0.4,
      };
      out += `<polygon class="marker-arrow" points="${fmt(from.x)},${fmt(from.y)} ${fmt(p1.x)},${fmt(p1.y)} ${fmt(p2.x)},${fmt(p2.y)}" fill="${st.stroke}"/>`;
    } else if (st.startMarker === 'circle') {
      const t0 = tangentAt(path, 0);
      out += `<circle class="marker-circle" cx="${fmt(path.from.x + t0.x * 5)}" cy="${fmt(path.from.y + t0.y * 5)}" r="5" fill="${st.stroke}"/>`;
    } else if (st.startMarker === 'cross') {
      const t0 = tangentAt(path, 0);
      const cx = path.from.x + t0.x * 6;
      const cy = path.from.y + t0.y * 6;
      out += `<path class="marker-cross" d="M ${fmt(cx - 5)} ${fmt(cy - 5)} L ${fmt(cx + 5)} ${fmt(cy + 5)} M ${fmt(cx - 5)} ${fmt(cy + 5)} L ${fmt(cx + 5)} ${fmt(cy - 5)}" stroke="${st.stroke}" stroke-width="2" fill="none"/>`;
    }

    if (st.endMarker === 'arrow') {
      const t = tangentAt(path, 1);
      const n = { x: -t.y, y: t.x };
      const to = path.to;
      const p1 = {
        x: to.x - t.x * arrowSize + n.x * arrowSize * 0.4,
        y: to.y - t.y * arrowSize + n.y * arrowSize * 0.4,
      };
      const p2 = {
        x: to.x - t.x * arrowSize - n.x * arrowSize * 0.4,
        y: to.y - t.y * arrowSize - n.y * arrowSize * 0.4,
      };
      out += `<polygon class="marker-arrow" points="${fmt(to.x)},${fmt(to.y)} ${fmt(p1.x)},${fmt(p1.y)} ${fmt(p2.x)},${fmt(p2.y)}" fill="${st.stroke}"/>`;
    } else if (st.endMarker === 'circle') {
      const t = tangentAt(path, 1);
      out += `<circle class="marker-circle" cx="${fmt(path.to.x - t.x * 5)}" cy="${fmt(path.to.y - t.y * 5)}" r="5" fill="${st.stroke}"/>`;
    } else if (st.endMarker === 'cross') {
      const t = tangentAt(path, 1);
      const cx = path.to.x - t.x * 6;
      const cy = path.to.y - t.y * 6;
      out += `<path class="marker-cross" d="M ${fmt(cx - 5)} ${fmt(cy - 5)} L ${fmt(cx + 5)} ${fmt(cy + 5)} M ${fmt(cx - 5)} ${fmt(cy + 5)} L ${fmt(cx + 5)} ${fmt(cy - 5)}" stroke="${st.stroke}" stroke-width="2" fill="none"/>`;
    }
  }

  for (const edge of scene.doc.edges) {
    if (edge.label && edge.label.length > 0) {
      const path = scene.layout.edges[edge.id];
      if (!path) continue;
      let w = 0;
      if (edge.markdown) {
        const runs = parseInlineMarkdown(edge.label);
        w = runs.reduce((sum, r) => sum + measure(r.text, LAYOUT.edgeLabelFontSize, r), 0) + 2 * LAYOUT.edgeLabelPadX;
      } else {
        w = measure(edge.label, LAYOUT.edgeLabelFontSize) + 2 * LAYOUT.edgeLabelPadX;
      }
      const h = LAYOUT.edgeLabelH;
      const x = path.labelPoint.x - w / 2;
      const y = path.labelPoint.y - h / 2;
      out += `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="4" fill="${theme.edgeLabelBg}"/>`;
      if (edge.markdown) {
        const runs = parseInlineMarkdown(edge.label);
        out += `<text x="${fmt(path.labelPoint.x)}" y="${fmt(path.labelPoint.y)}" dy="0.35em" text-anchor="middle" font-size="13" fill="${theme.edgeLabelText}">`;
        for (const run of runs) {
          let attrs = '';
          if (run.bold) attrs += ' font-weight="bold"';
          if (run.italic) attrs += ' font-style="italic"';
          out += `<tspan${attrs}>${escapeXml(run.text)}</tspan>`;
        }
        out += '</text>';
      } else {
        out += `<text x="${fmt(path.labelPoint.x)}" y="${fmt(path.labelPoint.y)}" dy="0.35em" text-anchor="middle" font-size="13" fill="${theme.edgeLabelText}">${escapeXml(edge.label)}</text>`;
      }
    }
  }

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

    if (
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

  out += '</svg>';
  return out;
}
