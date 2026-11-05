import { LAYOUT } from '../core/constants';
import type { MeasureText, NodeSection, SectionBox } from '../core/types';
import { wrapLabel } from './measure';

export function sizeSections(
  sections: NodeSection[],
  measure: MeasureText,
): { width: number; height: number; sections: SectionBox[] } {
  let widestRowW = 0;
  let currentTop = 0;
  const sectionBoxes: SectionBox[] = [];

  for (const s of sections) {
    const fontStyle = {
      bold: s.weight === 'bold',
      italic: s.weight === 'italic',
    };

    // 1. Single-column wrapping
    let rows = s.rows;
    const isSingleCol = rows.every((r) => r.length <= 1);
    if (isSingleCol) {
      const wrappedRows: string[][] = [];
      for (const r of rows) {
        const text = r[0] ?? '';
        const w = measure(text, LAYOUT.sectionFontSize, fontStyle);
        if (w > LAYOUT.labelWrapWidth) {
          const lines = wrapLabel(text, LAYOUT.labelWrapWidth, measure);
          for (const line of lines) {
            wrappedRows.push([line]);
          }
        } else {
          wrappedRows.push(r);
        }
      }
      rows = wrappedRows;
    }

    // 2. Drop empty columns
    let maxCols = 0;
    for (const r of rows) {
      if (r.length > maxCols) maxCols = r.length;
    }

    const keptCols: number[] = [];
    for (let c = 0; c < maxCols; c++) {
      const allEmpty = rows.every((r) => (r[c] ?? '') === '');
      if (!allEmpty) {
        keptCols.push(c);
      }
    }

    const filteredRows: string[][] = rows.map((r) =>
      keptCols.map((c) => r[c] ?? ''),
    );

    // 3. Column widths
    const colCount = keptCols.length;
    const colW: number[] = [];
    for (let c = 0; c < colCount; c++) {
      let maxW = 0;
      for (const r of filteredRows) {
        const cell = r[c] ?? '';
        if (cell.length > 0) {
          const w = measure(cell, LAYOUT.sectionFontSize, fontStyle);
          if (w > maxW) maxW = w;
        }
      }
      colW.push(maxW);
    }

    // colX and rowW
    let sumColW = 0;
    const colX: number[] = [];
    for (let c = 0; c < colCount; c++) {
      colX.push(LAYOUT.sectionPadX + sumColW + c * LAYOUT.sectionColGap);
      sumColW += colW[c];
    }

    const rowW =
      colCount > 0
        ? sumColW + (colCount - 1) * LAYOUT.sectionColGap
        : 0;
    if (rowW > widestRowW) {
      widestRowW = rowW;
    }

    // 4. Section height
    const height =
      filteredRows.length > 0
        ? filteredRows.length * LAYOUT.sectionLineH + 2 * LAYOUT.sectionPadY
        : LAYOUT.sectionMinH;

    sectionBoxes.push({
      rows: filteredRows,
      align: s.align,
      weight: s.weight,
      divider: s.divider,
      top: currentTop,
      height,
      colX,
    });

    currentTop += height;
  }

  const width = Math.max(LAYOUT.minNodeW, widestRowW + 2 * LAYOUT.sectionPadX);
  const height = currentTop;

  return { width, height, sections: sectionBoxes };
}
