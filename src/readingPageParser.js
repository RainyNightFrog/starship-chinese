/**
 * 閱讀理解頁面解析 — 分離「文章段落」與「試題選項」，過濾 OCR 雜訊
 */

import {
  chineseCharRatio,
  cleanReadingLine,
  isExamMetadataLine,
  isGarbageOption,
  isNoiseLine,
  isQuestionFragmentLine,
  isValidPassageLine,
  isWorksheetQuestionLine,
  isWorksheetSectionStart,
  sanitizeArticleLines,
  truncateLineBeforeWorksheet,
} from './readingTextQuality';

const OPTION_RE = /^[A-DＡ-Ｄa-d][\.．、\)）]\s*/;
const QUESTION_NUM_RE = /^(?:Q|q)?[1-9１-９][\.．、\)）]\s*/;

function cleanLineText(text = '') {
  return cleanReadingLine(text);
}

function stripOptionPrefix(text) {
  return cleanLineText(text).replace(OPTION_RE, '').trim();
}

function stripQuestionPrefix(text) {
  return cleanLineText(text)
    .replace(QUESTION_NUM_RE, '')
    .replace(/^第[一二三四五六七八九十]+題[：:]?/, '')
    .trim();
}

export function isOptionLine(text = '') {
  const line = cleanLineText(text);
  if (!OPTION_RE.test(line)) return false;
  const body = stripOptionPrefix(line);
  return body.length >= 2;
}

export function isQuestionLine(text = '') {
  const line = cleanLineText(text);
  if (isOptionLine(line)) return false;
  if (isWorksheetQuestionLine(line) || isWorksheetSectionStart(line)) return true;
  if (/[？?]$/.test(line) && /根據|下列|本文|作者|為什麼|什麼|哪一|哪項|是否|怎樣|如何|試解釋|解釋|說明|愛吃|舉辦/.test(line)) {
    return true;
  }
  if (QUESTION_NUM_RE.test(line) && line.length >= 12 && /根據|下列|本文|作者|為什麼|什麼|哪一|哪項|是否|怎樣|如何|愛吃|舉辦/.test(line)) {
    return true;
  }
  return false;
}

export function isInstructionLine(text = '') {
  const line = cleanLineText(text);
  if (!line) return true;
  if (isExamMetadataLine(line)) return true;
  if (/^第[一二三四五六七八九十\d]+行[：:]\s*$/.test(line)) return true;
  return line.length <= 3;
}

function cleanPassageLine(text = '') {
  return truncateLineBeforeWorksheet(
    cleanLineText(text).replace(/^第[一二三四五六七八九十\d]+行[：:]?/, ''),
  );
}

function scorePassageLine(text = '', confidence = 0) {
  const line = cleanPassageLine(text);
  if (!isValidPassageLine(line)) return 0;
  if (isNoiseLine(line) || isOptionLine(line) || isQuestionLine(line) || isInstructionLine(line)) return 0;

  const ratio = chineseCharRatio(line);
  let score = ratio * 50 + Math.min(line.length, 36);
  if (confidence > 0) score += Math.min(confidence, 95) * 0.2;
  if (/[，。；：、]/.test(line)) score += 6;
  return score;
}

export function sanitizeWorksheetQuestions(questions = []) {
  return questions.filter((item) => {
    const stem = cleanLineText(item.question);
    if (stem.length < 6 || isQuestionFragmentLine(stem)) return false;
    const goodOptions = (item.options ?? []).filter((opt) => !isGarbageOption(opt));
    return goodOptions.length >= 3;
  }).map((item) => ({
    ...item,
    options: item.options.filter((opt) => !isGarbageOption(opt)).slice(0, 4),
  }));
}

function finalizeQuestion(entry) {
  const options = entry.options.filter((opt) => opt && !isGarbageOption(opt)).slice(0, 4);
  if (options.length < 3) return null;
  while (options.length < 4) options.push('（請對照紙本）');
  return {
    question: entry.question,
    options,
    correctIndex: 0,
    explanation: '此題來自上載紙本，請對照原文及紙本答案核對。',
    fromWorksheet: true,
  };
}

function findQuestionSectionStart(sortedLines = []) {
  const idx = sortedLines.findIndex((item) => isQuestionLine(item.text) || isOptionLine(item.text));
  if (idx <= 0) return sortedLines.length;
  return idx;
}

function parseQuestionBlocks(sortedLines = []) {
  const questions = [];
  let current = null;

  sortedLines.forEach(({ text }) => {
    const line = cleanLineText(text);
    if (!line) return;

    if (isOptionLine(line)) {
      if (!current) current = { question: '', options: [] };
      current.options.push(stripOptionPrefix(line));
      return;
    }

    if (isQuestionLine(line)) {
      if (current?.options.length >= 2) {
        const finalized = finalizeQuestion(current);
        if (finalized) questions.push(finalized);
      }
      current = { question: stripQuestionPrefix(line), options: [] };
      return;
    }

    if (current && current.options.length === 0 && line.length >= 6 && !isInstructionLine(line)) {
      current.question = `${current.question}${line}`;
    }
  });

  if (current?.options.length >= 2) {
    const finalized = finalizeQuestion(current);
    if (finalized) questions.push(finalized);
  }
  return sanitizeWorksheetQuestions(questions).slice(0, 6);
}

function extractPassageLines(sortedLines = [], { relaxed = false } = {}) {
  const end = findQuestionSectionStart(sortedLines);
  const minScore = relaxed ? 12 : 18;

  const candidates = sortedLines
    .slice(0, end)
    .map((item) => ({
      text: cleanPassageLine(item.text),
      score: scorePassageLine(item.text, item.confidence ?? 0),
      y0: item.bbox?.y0 ?? 0,
    }))
    .filter((item) => item.text && item.score >= minScore);

  if (!candidates.length && relaxed) {
    return sortedLines
      .slice(0, end)
      .map((item) => cleanPassageLine(item.text))
      .filter((line) => isValidPassageLine(line))
      .slice(0, 10);
  }

  const orderMap = new Map(candidates.map((item) => [item.text, item.y0]));
  return [...new Set(candidates.map((item) => item.text))]
    .sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0))
    .slice(0, 10);
}

export function assessReadingParse({ passageLines = [], questions = [] }) {
  const validPassage = passageLines.filter(isValidPassageLine);
  const validQuestions = sanitizeWorksheetQuestions(questions);

  if (validQuestions.length >= 1 && validPassage.length >= 2) {
    return { ok: true, reason: 'worksheet', passageLines: validPassage, questions: validQuestions };
  }

  if (validPassage.length >= 2) {
    const avgRatio = validPassage.reduce((sum, line) => sum + chineseCharRatio(line), 0) / validPassage.length;
    if (avgRatio >= 0.55) {
      return { ok: true, reason: 'passage_only', passageLines: validPassage, questions: validQuestions };
    }
    return { ok: false, reason: 'passage_garbled', passageLines: validPassage, questions: validQuestions };
  }

  if (validPassage.length >= 1 && validQuestions.length >= 1) {
    return { ok: false, reason: 'passage_too_short', passageLines: validPassage, questions: validQuestions };
  }

  return { ok: false, reason: 'passage_too_short', passageLines: validPassage, questions: validQuestions };
}

function buildSortedLinesFromRawText(rawText = '') {
  return rawText
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .map((text, index) => ({
      text: cleanLineText(text),
      confidence: 45,
      bbox: { y0: index * 20, x0: 0, x1: 0, y1: 0 },
    }))
    .filter((item) => item.text.length >= 2);
}

/** 由 Tesseract 行級結果解析閱讀頁 */
export function parseReadingPageFromOcr(ocrLines = [], rawText = '') {
  let sortedLines = [...ocrLines]
    .map((item) => ({
      text: cleanLineText(item.text ?? ''),
      confidence: item.confidence ?? 0,
      bbox: item.bbox ?? { y0: 0 },
    }))
    .filter((item) => item.text.length >= 2)
    .sort((a, b) => (a.bbox.y0 ?? 0) - (b.bbox.y0 ?? 0));

  if (!sortedLines.length && rawText) {
    sortedLines = buildSortedLinesFromRawText(rawText);
  }

  let passageLines = extractPassageLines(sortedLines);
  const questionStart = findQuestionSectionStart(sortedLines);
  const questions = parseQuestionBlocks(sortedLines.slice(questionStart));

  if (!questions.length && rawText) {
    questions.push(...parseQuestionBlocks(buildSortedLinesFromRawText(rawText)));
  }

  let quality = assessReadingParse({ passageLines, questions });

  if (!quality.ok) {
    passageLines = extractPassageLines(sortedLines, { relaxed: true });
    quality = assessReadingParse({ passageLines, questions });
  }

  const cleanedPassage = sanitizeArticleLines(
    quality.passageLines ?? passageLines.filter(isValidPassageLine),
  );

  return {
    articleTitle: null,
    articleLines: cleanedPassage,
    passageLines: cleanedPassage,
    questions: quality.questions ?? sanitizeWorksheetQuestions(questions),
    qualityOk: quality.ok && cleanedPassage.length >= 2,
    qualityReason: quality.reason,
  };
}

function parseQuestionsFromRawText(rawText = '') {
  return parseQuestionBlocks(buildSortedLinesFromRawText(rawText));
}

export { parseQuestionsFromRawText };
