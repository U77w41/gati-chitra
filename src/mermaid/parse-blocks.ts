import { LIMITS, MESSAGES } from '../core/constants';
import type {
  Diagnostic, Direction, EdgeAnim, GraphGroup, NodeLink, Point, SourceLine, StyleMap,
} from '../core/types';
import { readProps } from './props';
import {
  parseStyleString, type QueuedClass, type QueuedLinkStyle, type QueuedStyle,
} from './styles';

export interface BlockContext {
  lines: SourceLine[]; diagnostics: Diagnostic[];
  groups: GraphGroup[]; groupStack: string[];
  classDefs: Record<string, StyleMap>; pins: Record<string, Point>;
  queuedClasses: QueuedClass[]; queuedStyles: QueuedStyle[]; queuedLinkStyles: QueuedLinkStyle[];
  hasReportedMaxGroupDepth: boolean; links: Record<string, NodeLink>;
  edgeRefs: Set<string>; edgePropsMap: Map<string, EdgeAnim>;
  accTitleHolder: { title: string | null }; accDescrHolder: { descr: string | null };
  inAccDescr: { active: boolean; lines: string[] }; explicitEdgeAnimationHolder: { value: boolean };
}

const POS_REGEX = /^\s*%%\s*studio:pos\s+(\S+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;
const DIR_REGEX = /^direction\s+(TB|TD|BT|RL|LR)\s*;?$/;
const END_REGEX = /^end\s*;?$/;

export function parseBlockLine(raw: string, lineIndex: number, ctx: BlockContext): boolean {
  const trimmed = raw.trim();

  if (ctx.inAccDescr.active) {
    ctx.lines[lineIndex].kind = 'acc';
    if (trimmed === '}') {
      ctx.inAccDescr.active = false;
      ctx.accDescrHolder.descr = ctx.inAccDescr.lines.join('\n');
    } else {
      ctx.inAccDescr.lines.push(raw.trim());
    }
    return true;
  }

  if (trimmed === '') {
    ctx.lines[lineIndex].kind = 'blank';
    return true;
  }

  if (trimmed.startsWith('%%')) {
    const posMatch = POS_REGEX.exec(raw);
    if (posMatch) {
      ctx.lines[lineIndex].kind = 'pos';
      ctx.pins[posMatch[1]] = { x: parseFloat(posMatch[2]), y: parseFloat(posMatch[3]) };
    } else if (trimmed.startsWith('%%{')) {
      ctx.lines[lineIndex].kind = 'directive';
    } else {
      ctx.lines[lineIndex].kind = 'comment';
    }
    return true;
  }

  if (trimmed.startsWith('accTitle')) {
    const m = /^accTitle\s*:\s*(.*)$/.exec(trimmed);
    if (m) {
      ctx.lines[lineIndex].kind = 'acc';
      ctx.accTitleHolder.title = m[1].trim();
      return true;
    }
  }

  if (trimmed.startsWith('accDescr')) {
    if (/^accDescr\s*\{$/.test(trimmed)) {
      ctx.lines[lineIndex].kind = 'acc';
      ctx.inAccDescr.active = true;
      ctx.inAccDescr.lines = [];
      return true;
    }
    const m = /^accDescr\s*:\s*(.*)$/.exec(trimmed);
    if (m) {
      ctx.lines[lineIndex].kind = 'acc';
      ctx.accDescrHolder.descr = m[1].trim();
      return true;
    }
  }

  if (trimmed.startsWith('click ')) {
    ctx.lines[lineIndex].kind = 'click';
    const m = /^click\s+([\p{L}\p{N}_]+)(?:\s+href)?\s+(.*)$/u.exec(trimmed);
    if (!m || !m[2].trim().startsWith('"')) {
      ctx.diagnostics.push({ line: lineIndex + 1, severity: 'info', message: MESSAGES.clickCallbackIgnored });
      return true;
    }
    const id = m[1];
    const rest = m[2].trim();
    const q1End = rest.indexOf('"', 1);
    if (q1End === -1) {
      ctx.diagnostics.push({ line: lineIndex + 1, severity: 'info', message: MESSAGES.clickCallbackIgnored });
      return true;
    }
    const url = rest.slice(1, q1End);
    let afterUrl = rest.slice(q1End + 1).trim();
    let tooltip: string | null = null;
    let target: '_self' | '_blank' | '_parent' | '_top' = '_self';
    if (afterUrl.startsWith('"')) {
      const q2End = afterUrl.indexOf('"', 1);
      if (q2End !== -1) {
        tooltip = afterUrl.slice(1, q2End);
        afterUrl = afterUrl.slice(q2End + 1).trim();
      }
    }
    const targetMatch = /^(_self|_blank|_parent|_top)\b/.exec(afterUrl);
    if (targetMatch) target = targetMatch[1] as NodeLink['target'];
    if (/^(https?:|mailto:)/i.test(url)) ctx.links[id] = { url, tooltip, target };
    else ctx.diagnostics.push({ line: lineIndex + 1, severity: 'info', message: MESSAGES.linkBlocked });
    return true;
  }

  if (trimmed.includes('@{')) {
    const epMatch = /^([\p{L}\p{N}_]+)@\{/u.exec(trimmed);
    if (epMatch && ctx.edgeRefs.has(epMatch[1])) {
      const refId = epMatch[1];
      const pRes = readProps(trimmed, refId.length);
      if (pRes) {
        ctx.lines[lineIndex].kind = 'edgeProps';
        const props = pRes.props;
        let animate: boolean | null = null;
        let speed: 'fast' | 'slow' | null = null;
        if (props.animate === 'true') animate = true;
        else if (props.animate === 'false') animate = false;
        if (props.animation === 'fast') speed = 'fast';
        else if (props.animation === 'slow') speed = 'slow';
        if (speed !== null && animate === null) animate = true;
        ctx.edgePropsMap.set(refId, { animate, speed });
        ctx.explicitEdgeAnimationHolder.value = true;
        return true;
      }
    }
  }

  if (trimmed.startsWith('subgraph')) {
    let gId = '';
    let gTitle = '';
    const m1 = /^subgraph\s+([A-Za-z0-9_]+)\s*\[(.*)\]\s*;?$/.exec(trimmed);
    if (m1) {
      gId = m1[1];
      gTitle = m1[2].trim();
      if (gTitle.startsWith('"') && gTitle.endsWith('"') && gTitle.length >= 2) gTitle = gTitle.slice(1, -1);
    } else {
      const m2 = /^subgraph\s+"(.*)"\s*;?$/.exec(trimmed);
      if (m2) {
        let n = 1;
        while (ctx.groups.some(g => g.id === `group${n}`)) n++;
        gId = `group${n}`;
        gTitle = m2[1];
      } else {
        const m3 = /^subgraph\s+(.+?)\s*;?$/.exec(trimmed);
        if (m3) { gTitle = m3[1].trim(); gId = gTitle.replace(/[^A-Za-z0-9_]/g, '_'); }
      }
    }

    if (gId) {
      if (ctx.groups.some(g => g.id === gId)) {
        const originalId = gId;
        let suffix = 2;
        while (ctx.groups.some(g => g.id === `${originalId}_${suffix}`)) suffix++;
        gId = `${originalId}_${suffix}`;
        ctx.diagnostics.push({
          line: lineIndex + 1, severity: 'warning', message: MESSAGES.duplicateGroupId(originalId, gId),
        });
      }

      ctx.lines[lineIndex].kind = 'subgraph';
      const parent = ctx.groupStack.length > 0 ? ctx.groupStack[ctx.groupStack.length - 1] : null;
      ctx.groups.push({ id: gId, title: gTitle, parent, direction: null, markdown: false, line: lineIndex });
      ctx.groupStack.push(gId);
      if (ctx.groupStack.length > LIMITS.maxGroupDepth && !ctx.hasReportedMaxGroupDepth) {
        ctx.diagnostics.push({ line: lineIndex + 1, severity: 'error', message: MESSAGES.groupTooDeep });
        ctx.hasReportedMaxGroupDepth = true;
      }
      return true;
    }
  }

  if (END_REGEX.test(trimmed)) {
    ctx.lines[lineIndex].kind = 'end';
    if (ctx.groupStack.length === 0) {
      ctx.diagnostics.push({ line: lineIndex + 1, severity: 'warning', message: MESSAGES.strayEnd });
    } else {
      ctx.groupStack.pop();
    }
    return true;
  }

  if (DIR_REGEX.test(trimmed)) {
    ctx.lines[lineIndex].kind = 'direction';
    if (ctx.groupStack.length > 0) {
      const currId = ctx.groupStack[ctx.groupStack.length - 1];
      const grp = ctx.groups.find(g => g.id === currId);
      if (grp) {
        const dMatch = DIR_REGEX.exec(trimmed)![1];
        grp.direction = dMatch === 'TD' ? 'TB' : (dMatch as Direction);
        grp.directionLine = lineIndex;
      }
    }
    return true;
  }

  if (trimmed.startsWith('classDef ')) {
    ctx.lines[lineIndex].kind = 'classDef';
    const rest = trimmed.slice(9).trim();
    const spaceIdx = rest.search(/\s/);
    const firstToken = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
    let styleStr = spaceIdx === -1 ? '' : rest.slice(spaceIdx + 1).trim();
    if (styleStr.endsWith(';')) styleStr = styleStr.slice(0, -1).trim();
    const styleMap = parseStyleString(styleStr);
    for (const name of firstToken.split(',').map(s => s.trim()).filter(Boolean)) {
      ctx.classDefs[name] = { ...styleMap };
    }
    return true;
  }

  if (trimmed.startsWith('class ')) {
    ctx.lines[lineIndex].kind = 'class';
    const rest = trimmed.slice(6).trim();
    const parts = rest.split(/\s+/);
    if (parts.length >= 2) {
      const ids = parts[0].split(',').map(s => s.trim()).filter(Boolean);
      const className = parts[1].trim();
      ctx.queuedClasses.push({ ids, className });
    }
    return true;
  }

  if (trimmed.startsWith('style ')) {
    ctx.lines[lineIndex].kind = 'style';
    const rest = trimmed.slice(6).trim();
    const spaceIdx = rest.search(/\s/);
    if (spaceIdx !== -1) {
      const id = rest.slice(0, spaceIdx).trim();
      let styleStr = rest.slice(spaceIdx + 1).trim();
      if (styleStr.endsWith(';')) styleStr = styleStr.slice(0, -1).trim();
      const style = parseStyleString(styleStr);
      ctx.queuedStyles.push({ id, style });
    }
    return true;
  }

  if (trimmed.startsWith('linkStyle ')) {
    ctx.lines[lineIndex].kind = 'linkStyle';
    const rest = trimmed.slice(10).trim();
    const spaceIdx = rest.search(/\s/);
    if (spaceIdx !== -1) {
      const target = rest.slice(0, spaceIdx).trim();
      let styleStr = rest.slice(spaceIdx + 1).trim();
      if (styleStr.endsWith(';')) styleStr = styleStr.slice(0, -1).trim();
      const style = parseStyleString(styleStr);
      if (target === 'default') {
        ctx.queuedLinkStyles.push({ target: 'default', style });
      } else {
        const indexes = target.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        ctx.queuedLinkStyles.push({ target: indexes, style });
      }
    }
    return true;
  }

  return false;
}

export function checkUnclosedGroups(
  groups: GraphGroup[],
  groupStack: string[],
  diagnostics: Diagnostic[],
): void {
  for (const openGroupId of groupStack) {
    const grp = groups.find(g => g.id === openGroupId);
    if (grp) {
      diagnostics.push({
        line: grp.line + 1,
        severity: 'warning',
        message: MESSAGES.unclosedGroup(grp.id),
      });
    }
  }
}
