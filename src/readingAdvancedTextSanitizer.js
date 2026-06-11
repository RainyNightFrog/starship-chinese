/**
 * Advanced Text Sanitizer — OCR 考卷「正文 / 試題」結構隔離器
 * Tesseract 辨識整張考卷後，先剔除行政行、題號、分數、原卷選項，再出題。
 */

import {
  cleanReadingLine,
  denoiseOcrTextPreserveLines,
  stripReadingInstructionPrefix,
  normalizePassageLine,
  wasLineCutAtWorksheet,
  isWorksheetSectionStart,
  isExamStructuralLine,
  isExamMetadataLine,
  isWorksheetQuestionLine,
  isValidPassageLine,
  sanitizeArticleLines,
  truncateAtForeignSection,
  truncateLineBeforeWorksheet,
} from './readingTextQuality.js';

/** 無換行長段落：按句號／大題／題號／選項切分 */
function splitOcrIntoRows(text = '') {
  const rows = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (rows.length !== 1 || rows[0].length < 80) return rows;

  return rows[0]
    .split(
      /(?<=[。！？；;])|(?=[一二三四五六七八九十][、\.．])|(?=\d+[\.．、]\s*(?:根據|和|在|從|下列))|(?=根據文章內容)|(?=[A-DＡ-Ｄa-d][\.．、])/,
    )
    .map((l) => cleanReadingLine(l))
    .filter((l) => l.length >= 2);
}

/**
 * 整行是否應剔除（考卷結構 + 行政雜訊 + 原題）
 * 若行首為「閱讀下面的文字…」但後接故事正文，保留並交由 normalize 剝除指引。
 */
export function shouldDropOcrLine(raw = '') {
  const line = cleanReadingLine(raw);
  if (!line) return true;

  if (isExamStructuralLine(line)) return true;

  const storyBody = truncateLineBeforeWorksheet(stripReadingInstructionPrefix(raw));
  if (storyBody.length >= 10) {
    if (isWorksheetQuestionLine(storyBody)) return true;
    return false;
  }

  if (isExamMetadataLine(line)) return true;
  if (isWorksheetQuestionLine(line)) return true;

  const stripped = stripReadingInstructionPrefix(raw);
  if (stripped.length >= 10) return false;
  if (stripped !== line && isExamStructuralLine(stripped)) return true;

  return false;
}

/**
 * 前置文本去噪與結構隔離 — 主入口
 * @param {string} ocrText
 * @returns {{ cleanArticleLines: string[], rawLineCount: number, droppedCount: number, hitWorksheet: boolean }}
 */
export function advancedSanitizeOcrText(ocrText = '') {
  const text = denoiseOcrTextPreserveLines(ocrText);
  const rawRows = splitOcrIntoRows(text);

  const storyBuffer = [];
  let droppedCount = 0;
  let hitWorksheet = false;

  for (const raw of rawRows) {
    if (hitWorksheet) break;

    if (shouldDropOcrLine(raw)) {
      droppedCount += 1;
      if (isWorksheetSectionStart(raw)) hitWorksheet = true;
      continue;
    }

    const line = normalizePassageLine(raw);
    const wasCut = wasLineCutAtWorksheet(raw);

    if (!line || line.length < 6) {
      if (wasCut || isWorksheetSectionStart(raw)) {
        hitWorksheet = true;
        droppedCount += 1;
      }
      continue;
    }

    if (!isValidPassageLine(line)) {
      droppedCount += 1;
      if (wasCut || isWorksheetSectionStart(raw)) hitWorksheet = true;
      continue;
    }

    storyBuffer.push(line);
    if (wasCut || isWorksheetSectionStart(raw)) hitWorksheet = true;
  }

  return {
    cleanArticleLines: sanitizeArticleLines(truncateAtForeignSection(storyBuffer)),
    rawLineCount: rawRows.length,
    droppedCount,
    hitWorksheet,
  };
}

/** 傳入 UI 前最後一道防線 */
export function assertCleanArticleLines(lines = []) {
  return lines
    .map((line) => normalizePassageLine(line))
    .filter((line) => line.length >= 6 && isValidPassageLine(line) && !shouldDropOcrLine(line));
}
