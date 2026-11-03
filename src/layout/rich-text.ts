import type { FontStyle, MeasureText, TextRun } from '../core/types';

export function parseInlineMarkdown(
  text: string,
  inherited: FontStyle = { bold: false, italic: false },
): TextRun[] {
  const runs: TextRun[] = [];

  function addRun(t: string, bold: boolean, italic: boolean) {
    if (t === '') return;
    if (runs.length > 0) {
      const last = runs[runs.length - 1];
      if (last.bold === bold && last.italic === italic) {
        last.text += t;
        return;
      }
    }
    runs.push({ text: t, bold, italic });
  }

  let i = 0;
  while (i < text.length) {
    if (text.startsWith('***', i)) {
      const closeIdx = text.indexOf('***', i + 3);
      if (closeIdx > i + 3) {
        const inner = text.slice(i + 3, closeIdx);
        const sub = parseInlineMarkdown(inner, { bold: true, italic: true });
        for (const r of sub) {
          addRun(r.text, true, true);
        }
        i = closeIdx + 3;
        continue;
      }
    }

    if (text.startsWith('**', i)) {
      const closeIdx = text.indexOf('**', i + 2);
      if (closeIdx > i + 2) {
        const inner = text.slice(i + 2, closeIdx);
        const sub = parseInlineMarkdown(inner, { bold: true, italic: !!inherited.italic });
        for (const r of sub) {
          addRun(r.text, true, r.italic || !!inherited.italic);
        }
        i = closeIdx + 2;
        continue;
      }
    }

    if (text[i] === '*' && text[i + 1] !== '*') {
      const closeIdx = text.indexOf('*', i + 1);
      if (closeIdx > i + 1) {
        const inner = text.slice(i + 1, closeIdx);
        const sub = parseInlineMarkdown(inner, { bold: !!inherited.bold, italic: true });
        for (const r of sub) {
          addRun(r.text, r.bold || !!inherited.bold, true);
        }
        i = closeIdx + 1;
        continue;
      }
    }

    if (text[i] === '_' && text[i + 1] !== '_') {
      const closeIdx = text.indexOf('_', i + 1);
      if (closeIdx > i + 1) {
        const inner = text.slice(i + 1, closeIdx);
        const sub = parseInlineMarkdown(inner, { bold: !!inherited.bold, italic: true });
        for (const r of sub) {
          addRun(r.text, r.bold || !!inherited.bold, true);
        }
        i = closeIdx + 1;
        continue;
      }
    }

    addRun(text[i], !!inherited.bold, !!inherited.italic);
    i++;
  }

  return runs;
}

interface WordPart {
  text: string;
  bold: boolean;
  italic: boolean;
}

interface Word {
  parts: WordPart[];
  hasSpaceBefore: boolean;
  spaceStyle?: { bold: boolean; italic: boolean };
}

function runsToWords(runs: TextRun[]): Word[] {
  const words: Word[] = [];
  let currentParts: WordPart[] = [];
  let spacePending = false;
  let pendingSpaceStyle: { bold: boolean; italic: boolean } | undefined;

  for (const run of runs) {
    const text = run.text;
    let i = 0;
    while (i < text.length) {
      if (/\s/.test(text[i])) {
        if (currentParts.length > 0) {
          words.push({
            parts: currentParts,
            hasSpaceBefore: spacePending,
            spaceStyle: pendingSpaceStyle,
          });
          currentParts = [];
        }
        spacePending = true;
        pendingSpaceStyle = { bold: run.bold, italic: run.italic };
        while (i < text.length && /\s/.test(text[i])) i++;
      } else {
        let chunk = '';
        while (i < text.length && !/\s/.test(text[i])) {
          chunk += text[i];
          i++;
        }
        currentParts.push({ text: chunk, bold: run.bold, italic: run.italic });
      }
    }
  }
  if (currentParts.length > 0) {
    words.push({
      parts: currentParts,
      hasSpaceBefore: spacePending,
      spaceStyle: pendingSpaceStyle,
    });
  }
  return words;
}

function wordWidth(w: Word, fontSize: number, measure: MeasureText): number {
  let sum = 0;
  for (const p of w.parts) {
    sum += measure(p.text, fontSize, { bold: p.bold, italic: p.italic });
  }
  return sum;
}

function appendWordToLine(line: TextRun[], parts: WordPart[]): void {
  for (const part of parts) {
    if (line.length > 0) {
      const last = line[line.length - 1];
      if (last.bold === part.bold && last.italic === part.italic) {
        last.text += part.text;
        continue;
      }
    }
    line.push({ text: part.text, bold: part.bold, italic: part.italic });
  }
}

function splitRunsByNewline(runs: TextRun[]): TextRun[][] {
  const paragraphs: TextRun[][] = [[]];
  for (const run of runs) {
    const lines = run.text.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      if (idx > 0) {
        paragraphs.push([]);
      }
      if (lines[idx].length > 0) {
        paragraphs[paragraphs.length - 1].push({
          text: lines[idx],
          bold: run.bold,
          italic: run.italic,
        });
      }
    }
  }
  return paragraphs;
}

export function wrapRuns(
  runs: TextRun[],
  maxWidth: number,
  fontSize: number,
  measure: MeasureText,
): TextRun[][] {
  const paragraphs = splitRunsByNewline(runs);
  const resultLines: TextRun[][] = [];
  const spaceW = measure(' ', fontSize);

  for (const para of paragraphs) {
    const words = runsToWords(para);
    if (words.length === 0) {
      resultLines.push([]);
      continue;
    }

    let currentLine: TextRun[] = [];
    let currentLineWidth = 0;

    for (const word of words) {
      const wWidth = wordWidth(word, fontSize, measure);

      if (currentLine.length === 0) {
        appendWordToLine(currentLine, word.parts);
        currentLineWidth = wWidth;
      } else {
        const candidateWidth = currentLineWidth + spaceW + wWidth;
        if (candidateWidth <= maxWidth) {
          const style = word.spaceStyle ?? { bold: false, italic: false };
          const last = currentLine[currentLine.length - 1];
          if (last && last.bold === style.bold && last.italic === style.italic) {
            last.text += ' ';
          } else if (
            word.parts.length > 0 &&
            word.parts[0].bold === style.bold &&
            word.parts[0].italic === style.italic
          ) {
            word.parts[0].text = ` ${word.parts[0].text}`;
          } else {
            currentLine.push({ text: ' ', bold: style.bold, italic: style.italic });
          }
          appendWordToLine(currentLine, word.parts);
          currentLineWidth = candidateWidth;
        } else {
          resultLines.push(currentLine);
          currentLine = [];
          appendWordToLine(currentLine, word.parts);
          currentLineWidth = wWidth;
        }
      }
    }

    if (currentLine.length > 0) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
}
