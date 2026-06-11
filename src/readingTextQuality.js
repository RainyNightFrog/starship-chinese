/** 閱讀 OCR / 貼上文字 — 品質判斷與清理 */

import { stripOptionLetterPrefix } from './readingOptionPrefixCleaner.js';
import { repairReadingOcrText, stripWorksheetWatermarks } from './readingOcrRepair.js';
import { READING_MAX_ARTICLE_LINES } from './readingConstants.js';

export { repairReadingOcrText, hasSuspiciousOcrArtifacts, stripWorksheetWatermarks } from './readingOcrRepair.js';

export function chineseCharRatio(text = '') {
  if (!text.length) return 0;
  const chinese = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  return chinese / text.length;
}

export function cleanReadingLine(text = '') {
  return repairReadingOcrText(String(text)).replace(/\s+/g, '').trim();
}

/** 剝除 OCR 常見填空記號，如 ()、(的/地)、①② */
export function stripOcrFillInBlanks(text = '') {
  return repairReadingOcrText(String(text))
    .replace(/\(\s*\)\s*\([^)]{0,12}\)/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\([^)]{0,6}[\/／][^)]{0,6}\)/g, '')
    .trim();
}

/** 閱讀正文行標準化（指引剝除 + 試題截斷 + 填空清理） */
export function normalizePassageLine(text = '') {
  return stripOcrFillInBlanks(truncateLineBeforeWorksheet(text));
}

/** 該行是否在試題區被截斷（不含填空記號清理） */
export function wasLineCutAtWorksheet(raw = '') {
  const rawBody = stripReadingInstructionPrefix(raw);
  const truncated = cleanReadingLine(truncateLineBeforeWorksheet(raw));
  return rawBody.length > truncated.length + 6;
}

/** 閱讀指引前綴（常與正文黏在同一行，需剝除） */
const READING_INSTRUCTION_PREFIX = [
  /^閱讀下面的文字[，,]?然後回答問題[。.]?/,
  /^閱讀以下(?:的)?(?:文章|文字|材料|內容)[，,：:]?/,
  /^請閱讀以下(?:文章|文字|材料)?[，,：:]?/,
  /^閱讀以下材料[，,：:]?/,
  /^根據以下(?:文章|材料)[，,：:]?/,
  /^閱讀理解[：:]?/,
];

/** 紙本試題區開始標記 — 遇見即截斷，不再當正文 */
const WORKSHEET_SECTION_MARKERS = [
  /根據文章內容[，,]?回答第/,
  /根據文章[，,]?回答/,
  /在.{0,6}(?:中|裏|裡)?(?:國|語)?出適當的答案/,
  /\(第?\s*\d+\s*%\)/,
  /\(第?\s*\d+\s*分\)/,
  /^\d+[\.．、]\s*根據/,
  /^\d+[\.．、]\s*在/,
  /^\d+[\.．、]\s*從第/,
  /^\d+[\.．、]\s*和/,
  /^\d+[\.．、]\s*下列/,
  /從第[一二三四五六七八九十\d]+段中找出/,
  /填在第\d+題/,
  /選出適當的答案/,
  /從文中找出/,
  /從文章找出/,
  /填在下列句子/,
  /適當的詞語/,
];

/** 行內試題起始（用於切斷敘事與題目黏連） */
const INLINE_WORKSHEET_SPLIT = /(?=根據文章內容)|(?=從文中找出)|(?=從文章找出)|(?=\d+[\.．、]\s*(?:根據|和|在|從|下列|上|下))|(?=\(第?\s*\d+\s*%\))|(?=回答第[一二三四五六七八九十\d]+[-–—]?\d*題)/;

/** 考卷雜訊：校名、大題指引、分數欄、OCR 亂碼等 */
const NOISE_LINE_PATTERNS = [
  /嗇色園|主辦|可信學校|學校$|小學$|中學$|幼稚園|學校名稱/,
  /第[一二三四五六七八九十\d]+頁|^P\.?\s*\d+|^Page\s*\d+/i,
  /試卷[一二三四五六七八九十\d]+|試卷二|試卷一/,
  /得分|滿分|總分|\/\s*\d+\s*分|分\s*$/,
  /錯別字|辨正|改錯|填在橫線|根據.{0,6}填|在橫線上/,
  /^第[一二三四五六七八九十\d]+[题題大題]/,
  /^[一二三四五六七八九十\d]+[\.\．、]\s*(錯別字|語文|中文|閱讀|寫作|聆聽)/,
  /姓名|班別|學號|滿分|總分|分鐘|時間：|修@|@[0-9]|\.{4,}/,
  /^閱讀以下|^閱讀下面的文字|^閱讀理解|^請閱讀|^根據以下|^閱讀材料/,
  /根據文章內容[，,]?回答/,
  /在.{0,6}出適當的答案/,
  /\(第?\s*\d+\s*%\)/,
  /^[A-DＡ-Ｄa-d][\.．、\)）]\s*[\u4e00-\u9fff]{0,4}$/,
  /^(?:Q|q)?[1-9１-９][\.．、\)）]\s*[A-Za-z]{0,6}$/,
  /^[A-Za-z][A-Za-z\s]{2,}[A-Za-z]$/,
  /^[A-Za-z]{2,}\s+[A-Za-z]{1,3}(\s+[A-Za-z]{1,3})*$/,
  /ReDE|LgECZ|Ri\s*tX|tX\s*Xa/i,
  /^[A-Za-z0-9\-_]{4,}$/,
  /^選項\s*\d/,
  /未能辨識|待重新上載/,
  /更多練習.*(?:www\.|beasmart|免費下載)/i,
  /www\.[a-zA-Z0-9.-]+\.[a-z]{2,}/i,
  // 其他大題雜訊（非閱讀正文框）
  /^四[、\.．]/,
  /句義辨析/,
  /面對這壯麗的景色/,
  /這名服務生態度/,
  /^五[、\.．]\s*寫作/,
  /^六[、\.．]/,
  /四頁之[一二三四]/,
  /試卷四頁/,
];

/** 紙本試題行（非閱讀正文） */
export function isWorksheetQuestionLine(text = '') {
  const line = cleanReadingLine(text);
  if (!line) return false;
  if (WORKSHEET_SECTION_MARKERS.some((p) => p.test(line))) return true;
  if (/^[1-9１-９][\.．、]/.test(line) && /甚麼|哪[裏里裡]|誰|為何|為什麼|怎樣|如何|找出|填|舉辦|愛吃/.test(line)) {
    return true;
  }
  if (/愛吃甚麼|在哪[裏里裡]舉辦|生日會在哪/.test(line) && /[？?]/.test(line) && line.length < 40) {
    return true;
  }
  if (/^[1-9１-９][\.．、].*邀請卡/.test(line) && /[？?]/.test(line)) {
    return true;
  }
  if (/從文中找出|從文章找出|填在下列|橫線上|適當的詞語/.test(line)) {
    return true;
  }
  return false;
}

/** 是否為試題區起始（整段截斷）— 大題標題如「一、閱讀理解(30%)」不算 */
export function isWorksheetSectionStart(text = '') {
  const line = cleanReadingLine(text);
  if (!line) return false;
  if (/^[一二三四五六七八九十][、\.．]/.test(line)) return false;
  if (/根據文章內容[，,]?回答第/.test(line)) return true;
  if (/^\d+[\.．、]\s*(?:根據|和|在|從|下列)/.test(line)) return true;
  if (/\(\s*\d+\s*%\s*\)/.test(line) && /根據|回答|選出|填在/.test(line)) return true;
  return WORKSHEET_SECTION_MARKERS.some((p) => p.test(line))
    && /根據|回答|選出|適當的答案|填在第/.test(line);
}

/** 剝除行首閱讀指引（如「閱讀下面的文字,然後回答問題。」） */
export function stripReadingInstructionPrefix(text = '') {
  let line = cleanReadingLine(text);
  for (const pattern of READING_INSTRUCTION_PREFIX) {
    line = line.replace(pattern, '');
  }
  return line.trim();
}

/** 若一行混有正文與試題，只保留正文部分 */
export function truncateLineBeforeWorksheet(line = '') {
  let text = stripReadingInstructionPrefix(line);
  if (!text) return '';

  const splitParts = text.split(INLINE_WORKSHEET_SPLIT).map((p) => cleanReadingLine(p)).filter(Boolean);
  if (splitParts.length > 1) {
    const storyPart = splitParts[0];
    if (storyPart.length >= 8 && !isWorksheetQuestionLine(storyPart)) return storyPart;
  }

  for (const pattern of WORKSHEET_SECTION_MARKERS) {
    const match = text.match(pattern);
    if (match && match.index != null && match.index >= 8) {
      text = text.slice(0, match.index).trim();
      break;
    }
  }

  return text;
}

/** 題幹碎片，不是文章內容 */
export function isQuestionFragmentLine(text = '') {
  const line = cleanReadingLine(text);
  if (!line) return true;
  if (isWorksheetQuestionLine(line)) return true;
  if (/[？?]$/.test(line) && /根據|下列|本文|作者|哪一|哪項|是否|為什麼|怎樣|試解釋|解釋下面/.test(line)) {
    return true;
  }
  return /^(?:根據第|從第|下列哪|哪一項|上面一句|下面一句|上一句|下一句|主要寫|主要說)/.test(line)
    && line.length < 48;
}

export function isExamMetadataLine(text = '') {
  const line = cleanReadingLine(text);
  if (!line) return true;
  return NOISE_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

export function isNoiseLine(text = '') {
  const line = cleanReadingLine(text);
  if (!line) return true;
  if (isExamMetadataLine(line)) return true;
  if (isWorksheetQuestionLine(line)) return true;
  if (isQuestionFragmentLine(line)) return true;
  if (/^[A-DＡ-Ｄ][\.．、]/.test(line)) return true;
  if (/^(?:Q|q)?[1-9１-９][\.．、\)）]/.test(line) && line.length < 20) return true;
  if (chineseCharRatio(line) < 0.45) return true;
  if (/[A-Za-z]{2,}/.test(line) && chineseCharRatio(line) < 0.65) return true;
  return false;
}

/** 選項是否含原卷題號／選項前綴殘留 */
export function hasExamOptionArtifact(text = '') {
  const line = cleanReadingLine(stripOptionLetterPrefix(text));
  if (!line) return true;
  return /^[一二三四五六七八九十][、\.．]/.test(line)
    || /^\d+[\.．、]/.test(line)
    || /^[0-9０-９]+[\.．、]/.test(line)
    || /^[A-Da-dＡ-Ｄ]\s*[\.．、,，)）]/i.test(line)
    || /^(?:Q|q)[1-9１-９][\.．、]/.test(line)
    || /\(\s*\d+\s*%\s*\)/.test(line);
}

export function isGarbageOption(text = '') {
  const line = cleanReadingLine(stripOptionLetterPrefix(text));
  if (line.length < 2) return true;
  if (hasExamOptionArtifact(line)) return true;
  if (isNoiseLine(line)) return true;
  if (isWorksheetQuestionLine(line)) return true;
  if (/未能辨識|選項\s*\d|（選項\s*\d）/.test(line)) return true;
  if (/閱讀下面的文字|根據文章內容|回答第[一二三四五六七八九十\d]+|選出適當的答案|在.{0,6}出適當的答案/.test(line)) {
    return true;
  }
  const ratio = chineseCharRatio(line);
  if (ratio < 0.55) return true;
  if (/[A-Za-z]{3,}/.test(line) && ratio < 0.8) return true;
  if (/[<>@#$%^&*]{2,}/.test(line)) return true;
  return false;
}

/** 在標點處截斷，避免「大蛋糕」變「大蛋」 */
export function trimAtPhraseBoundary(text = '', max = 32) {
  const line = cleanReadingLine(text);
  if (line.length <= max) return line;
  const cut = line.slice(0, max);
  const lastPause = Math.max(
    cut.lastIndexOf('，'),
    cut.lastIndexOf('。'),
    cut.lastIndexOf('；'),
    cut.lastIndexOf('、'),
    cut.lastIndexOf('：'),
  );
  if (lastPause >= 10) return cut.slice(0, lastPause + (cut[lastPause] === '。' ? 1 : 0));
  return `${cut}…`;
}

/** 清洗單個閱讀選項（剝除 A. / 1. 前綴，拒絕試題碎片） */
export function sanitizeReadingOption(text = '') {
  let line = stripOptionLetterPrefix(String(text ?? ''));
  line = line.replace(/^\d+[\.．、]\s*/, '').replace(/^[0-9０-９]+[\.．、]\s*/, '');
  line = trimAtPhraseBoundary(normalizePassageLine(line), 42);
  if (!line || line.length < 4 || isGarbageOption(line)) return '';
  return line;
}

/** 可否作為選項（排除半截句、試題殘留） */
export function isValidOptionCandidate(text = '', correct = '') {
  const line = sanitizeReadingOption(text);
  if (!line || line.length < 6) return false;
  if (line === correct) return false;
  if (correct && (correct.includes(line) || line.includes(correct))) return false;
  if (/和爺爺|愛吃甚麼|在哪[裏里裡]舉辦/.test(line)) return false;
  return true;
}

export function isValidPassageLine(text = '') {
  const line = cleanReadingLine(stripWorksheetWatermarks(text));
  if (line.length < 8) return false;
  if (isNoiseLine(line)) return false;
  if (/^[A-DＡ-Ｄ][\.．、]/.test(line)) return false;
  if (chineseCharRatio(line) < 0.5) return false;
  return true;
}

/** 遇「其他大題」標記時截斷 — 只保留閱讀正文 */
const FOREIGN_SECTION_START = [
  /^四[、\.．]\s*句義/,
  /^四[、\.．]\s*$/,
  /句義辨析/,
  /^五[、\.．]/,
  /^六[、\.．]/,
  /面對這壯麗的景色/,
  /這名服務生態度/,
  /^1[\.．、]\s*面對這壯麗/,
  /^2[\.．、]\s*這名服務生/,
];

export function truncateAtForeignSection(lines = []) {
  const kept = [];
  for (const raw of lines) {
    const line = cleanReadingLine(raw).replace(/^第[一二三四五六七八九十\d]+行[：:]?/, '');
    if (!line) continue;
    if (FOREIGN_SECTION_START.some((p) => p.test(line))) break;
    if (/^[三四五六七八九十][、\.．]/.test(line) && !/閱讀|文章|材料/.test(line)) break;
    kept.push(line);
  }
  return kept;
}

/**
 * OCR 去噪 — 保留換行，只壓縮行內空白（避免整頁黏成一行）
 */
export function denoiseOcrTextPreserveLines(ocrText = '') {
  let text = repairReadingOcrText(String(ocrText ?? ''));
  text = text.replace(/\r/g, '\n');
  text = text.replace(/\(\s*\d+\s*分\s*\)/g, ' ');
  text = text.replace(/\d+\s*\/\s*\d+\s*分/g, ' ');
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 將 OCR 全文拆成候選行（支援無換行的長段落） */
function splitOcrTextToCandidateLines(rawText = '') {
  const text = denoiseOcrTextPreserveLines(rawText);
  if (!text) return [];

  if (text.includes('\n')) {
    return text.split(/\n+/).map((l) => cleanReadingLine(l)).filter((l) => l.length >= 2);
  }

  // 無換行：按句號 + 試題標記切分
  return text
    .split(/(?<=[。！？；;])|(?=根據文章內容)|(?=\d+[\.．、]\s*(?:根據|和|在|從|下列))/)
    .map((l) => truncateLineBeforeWorksheet(cleanReadingLine(l)))
    .filter((l) => l.length >= 6);
}

/**
 * 從 OCR 全文提取「閱讀正文」— 剝除標題指引、紙本試題、分數欄
 */
/** 考卷結構行（大題號 / 分數 / 阿拉伯題號 / A–D 選項） */
const EXAM_STRUCTURAL_LINE = [
  /^[一二三四五六七八九十][、\.．]/,
  /^[（(][一二三四五六七八九十][)）]/,
  /^\(\s*\d+\s*%\s*\)/,
  /\d+\s*分\s*\)/,
  /^\d+[\.．、]/,
  /^[0-9０-９]+[\.．、]/,
  /^[１-９][\.．、]/,
  /^[A-Da-dＡ-Ｄ]\s*[\.．、,，)）]/i,
  /^[A-Da-dＡ-Ｄ][\.．、]/i,
  /^(?:Q|q)[1-9１-９][\.．、]/,
  /^選項\s*[A-DＡ-Ｄ]/i,
];

export function isExamStructuralLine(raw = '') {
  const line = cleanReadingLine(raw);
  if (!line || line.length < 2) return true;
  if (EXAM_STRUCTURAL_LINE.some((p) => p.test(line))) return true;
  if (/\(\s*\d+\s*%\s*\)/.test(line) && /根據|回答|選出|填在/.test(line)) return true;
  if (/根據文章內容[，,]?回答第/.test(line) && line.length < 100) return true;
  return false;
}

export function extractPassageBodyFromOcrText(rawText = '') {
  const candidates = splitOcrTextToCandidateLines(rawText);
  const storyLines = [];
  let hitWorksheet = false;

  for (const raw of candidates) {
    if (hitWorksheet) break;

    if (isExamStructuralLine(raw)) {
      if (isWorksheetSectionStart(raw)) hitWorksheet = true;
      continue;
    }

    const rawBody = stripReadingInstructionPrefix(raw);
    const line = normalizePassageLine(raw);
    const wasTruncated = wasLineCutAtWorksheet(raw);

    if (!line || line.length < 6) {
      if (isWorksheetSectionStart(raw) || isWorksheetQuestionLine(rawBody)) hitWorksheet = true;
      continue;
    }

    if (isExamMetadataLine(line)) continue;

    if (isWorksheetQuestionLine(line) && !wasTruncated) {
      hitWorksheet = true;
      break;
    }

    if (!isValidPassageLine(line)) {
      if (wasTruncated || isWorksheetSectionStart(raw)) hitWorksheet = true;
      continue;
    }

    storyLines.push(line);
    if (wasTruncated || isWorksheetSectionStart(raw)) hitWorksheet = true;
  }

  return sanitizeArticleLines(storyLines);
}

/** 超長 OCR 行按句號拆成多行，避免整段說明文被截斷或誤丟 */
export function expandArticleLinesToSentences(lines = []) {
  const expanded = [];

  lines.forEach((raw) => {
    const line = normalizePassageLine(stripWorksheetWatermarks(raw));
    if (!line || line.length < 6) return;

    if (line.length <= 72) {
      expanded.push(line);
      return;
    }

    const parts = line
      .split(/(?<=[。！？；;])/)
      .map((s) => cleanReadingLine(s))
      .filter((s) => s.length >= 6);

    if (parts.length >= 2) {
      parts.forEach((p) => expanded.push(p));
    } else {
      expanded.push(line);
    }
  });

  return expanded;
}

/** 清洗 AI / OCR 擷取的文章行 */
export function sanitizeArticleLines(lines = []) {
  const stripped = expandArticleLinesToSentences(lines)
    .map((line) => normalizePassageLine(
      cleanReadingLine(line).replace(/^第[一二三四五六七八九十\d]+行[：:]?/, ''),
    ))
    .filter((line) => line.length >= 6);
  const truncated = truncateAtForeignSection(stripped);
  return truncated
    .filter((line) => isValidPassageLine(line) && !isWorksheetQuestionLine(line) && !isExamStructuralLine(line))
    .slice(0, READING_MAX_ARTICLE_LINES);
}

/** 將貼上文字切成段落行 */
export function splitPastedPassageText(text = '') {
  return text
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2 && isValidPassageLine(line));
}

/** 多頁貼上：用 --- 或 === 分隔各頁 */
export function splitPastedPages(text = '') {
  const parts = text
    .split(/\n(?:={3,}|-{3,})\n/)
    .map((part) => splitPastedPassageText(part))
    .filter((lines) => lines.length > 0);
  return parts.length ? parts : [splitPastedPassageText(text)];
}

/** 是否像閱讀理解文章（敘事／說明文），而非默書詞表 */
export function looksLikeReadingPassageContent(rawText = '') {
  const text = String(rawText ?? '').trim();
  if (!text) return false;

  if (/閱讀以下|閱讀下面的文字|根據文章|閱讀理解|請閱讀|根據以下/.test(text)) {
    return true;
  }

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const longLines = lines.filter((l) => {
    const han = (l.match(/[\u4e00-\u9fff]/g) || []).length;
    return han >= 12;
  });
  const sentenceEndings = (text.match(/[。！？；]/g) || []).length;
  const plainHan = text.replace(/[^\u4e00-\u9fff]/g, '');

  if (longLines.length >= 2) return true;
  if (sentenceEndings >= 2 && longLines.length >= 1) return true;
  if (plainHan.length >= 80 && sentenceEndings >= 1) return true;

  return false;
}
