import { EXPORT, FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { ExportMode, Scene, Theme } from '../core/types';
import { shapePolygon, tangentAt } from '../layout/geometry';
import type { MeasureText } from '../layout/measure';
import { exportFrame } from './frame';
import { edgeStyle, nodeStyle } from './style';

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

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderSvg(
  scene: Scene,
  theme: Theme,
  opts: SvgOptions,
  measure: MeasureText,
): string {
  const frame = exportFrame(scene.layout.bounds, opts.mode, 1);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(frame.pixelWidth)}" height="${fmt(frame.pixelHeight)}" viewBox="${fmt(frame.world.x)} ${fmt(frame.world.y)} ${fmt(frame.world.width)} ${fmt(frame.world.height)}" role="img" font-family="${escapeXml(FONT_STACK_SANS)}">`;

  out += `<title>Flowchart</title><desc>Flowchart with ${scene.doc.nodes.length} nodes and ${scene.doc.edges.length} arrows</desc>`;

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

    if (st.startArrow) {
      const t0 = tangentAt(path, 0);
      const n0 = { x: -t0.y, y: t0.x };
      const from = path.from;
      const p1 = {
        x: from.x + t0.x * arrowSize + n0.x * arrowSize * 0.4,
        y: from.y + t0.y * arrowSize + n0.y * arrowSize * 0.4,
      };
      const p2 = {
        x: from.x + t0.x * arrowSize - n0.x * arrowSize * 0.4,
        y: from.y + t0.y * arrowSize - n0.y * arrowSize * 0.4,
      };
      out += `<polygon points="${fmt(from.x)},${fmt(from.y)} ${fmt(p1.x)},${fmt(p1.y)} ${fmt(p2.x)},${fmt(p2.y)}" fill="${st.stroke}"/>`;
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
      out += `<polygon points="${fmt(to.x)},${fmt(to.y)} ${fmt(p1.x)},${fmt(p1.y)} ${fmt(p2.x)},${fmt(p2.y)}" fill="${st.stroke}"/>`;
    } else if (st.endMarker === 'circle') {
      const t = tangentAt(path, 1);
      out += `<circle cx="${fmt(path.to.x - t.x * 5)}" cy="${fmt(path.to.y - t.y * 5)}" r="5" fill="${st.stroke}"/>`;
    } else if (st.endMarker === 'cross') {
      const t = tangentAt(path, 1);
      const cx = path.to.x - t.x * 6;
      const cy = path.to.y - t.y * 6;
      out += `<path d="M ${fmt(cx - 5)} ${fmt(cy - 5)} L ${fmt(cx + 5)} ${fmt(cy + 5)} M ${fmt(cx - 5)} ${fmt(cy + 5)} L ${fmt(cx + 5)} ${fmt(cy - 5)}" stroke="${st.stroke}" stroke-width="2" fill="none"/>`;
    }
  }

  for (const edge of scene.doc.edges) {
    if (edge.label && edge.label.length > 0) {
      const path = scene.layout.edges[edge.id];
      if (!path) continue;
      const w = measure(edge.label, LAYOUT.edgeLabelFontSize) + 2 * LAYOUT.edgeLabelPadX;
      const h = LAYOUT.edgeLabelH;
      const x = path.labelPoint.x - w / 2;
      const y = path.labelPoint.y - h / 2;
      out += `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="4" fill="${theme.edgeLabelBg}"/>`;
      out += `<text x="${fmt(path.labelPoint.x)}" y="${fmt(path.labelPoint.y)}" dy="0.35em" text-anchor="middle" font-size="13" fill="${theme.edgeLabelText}">${escapeXml(edge.label)}</text>`;
    }
  }

  for (const node of scene.doc.nodes) {
    const box = scene.layout.nodes[node.id];
    if (!box) continue;
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
        out += `<ellipse cx="${fmt(cx)}" cy="${fmt(cy)}" rx="${fmt(w / 2)}" ry="${fmt(h / 2)}" ${strokeAttr}/>`;
        break;
      case 'diamond':
      case 'hexagon':
      case 'parallelogram':
      case 'parallelogramAlt': {
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

    const nLines = box.lines.length;
    for (let k = 0; k < nLines; k++) {
      const lineY = cy + (k - (nLines - 1) / 2) * LAYOUT.lineHeight;
      out += `<text x="${fmt(cx)}" y="${fmt(lineY)}" dy="0.35em" text-anchor="middle" font-size="16" fill="${st.text}">${escapeXml(box.lines[k])}</text>`;
    }
  }

  out += '</svg>';
  return out;
}
