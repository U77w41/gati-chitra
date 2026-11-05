import { EXPORT, FONT_STACK_SANS, LAYOUT } from '../core/constants';
import type { ExportMode, Scene, Theme } from '../core/types';
import { describeDiagram } from '../app/describe';
import { tangentAt } from '../layout/geometry';
import type { MeasureText } from '../layout/measure';
import { parseInlineMarkdown } from '../layout/rich-text';
import { svgEdgeEndLabels } from './edge-extras';
import { exportFrame } from './frame';
import { markerPrims, svgMarker } from './markers';
import { edgeStyle } from './style';
import { svgNodes } from './svg-nodes';
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
    out += `<text x="${fmt(scene.layout.title.center.x)}" y="${fmt(scene.layout.title.center.y)}" dy="0.35em" text-anchor="middle" font-size="${LAYOUT.titleFontSize}" font-weight="bold" fill="${theme.titleText ?? theme.nodeText}">${escapeXml(scene.layout.title.text)}</text>`;
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
    } else if (st.startMarker !== 'none') {
      const t0 = tangentAt(path, 0);
      const u0 = { x: -t0.x, y: -t0.y };
      const prims = markerPrims(st.startMarker, path.from, u0);
      out += svgMarker(prims, st.stroke, theme.background, st.width);
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
    } else if (st.endMarker !== 'none') {
      const t = tangentAt(path, 1);
      const prims = markerPrims(st.endMarker, path.to, t);
      out += svgMarker(prims, st.stroke, theme.background, st.width);
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
      out += `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${fmt(LAYOUT.edgeLabelRadius)}" fill="${theme.edgeLabelBg}" stroke="${theme.edge}" stroke-opacity="0.3"/>`;
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

  out += svgEdgeEndLabels(scene, theme);

  out += svgNodes(scene, theme, measure);
  out += '</svg>';
  return out;
}
