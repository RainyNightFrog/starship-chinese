/**
 * 閱讀理解 — 前端防亂碼正則過濾器（渲染前最後一道防線）
 *
 * 用途：
 *  · 家長上載完成後（ReadingUploadModal）
 *  · 題庫引擎注入學生端前（useQuestionEngine）
 *  · readingBank 映射時（readingSchema）
 *
 * 即使 OCR 偶發英文字母碎片，學生端左側文章面板也只顯示純淨中文。
 */

import {
  cleanReadingLine,
  isGarbageOption,
  isValidPassageLine,
  sanitizeArticleLines,
} from './readingTextQuality.js';
import { repairReadingOcrText } from './readingOcrRepair.js';
import { stripOptionLetterPrefix } from './readingOptionPrefixCleaner.js';

/** 連續無意義英文字母碎片（OCR 典型亂碼） */
const LATIN_GARBAGE_CHUNK = /[A-Za-z]{2,}(?:\s+[A-Za-z]{1,4}){0,4}/g;

/** 整行幾乎全是拉丁字母 → 直接�棄 */
const MOSTLY_LATIN_LINE = /^[\sA-Za-z0-9\-_.:;]{4,}$/;

/** 行內夾雜的 OCR 碎片（與中文脫節） */
const EMBEDDED_LATIN_GARBAGE = /\s*[A-Za-z]{2,}(?:\s+[A-Za-z]{1,3})+\s*/g;

/**
 * 修復單行：移除英文字母碎片，保留中文語意
 * @param {string} line — 可能含「第N行：」前綴的顯示行
 * @returns {string|null} — null 表示該行應整行過濾
 */
export function repairPassageDisplayLine(line = '') {
  const raw = String(line ?? '').trim();
  if (!raw) return null;

  const prefixMatch = raw.match(/^(第[一二三四五六七八九十\d]+行[：:])(.*)$/);
  const prefix = prefixMatch?.[1] ?? '';
  const body = prefixMatch?.[2] ?? raw;

  const cleanedBody = cleanReadingLine(repairReadingOcrText(body));
  if (!cleanedBody) return null;

  if (MOSTLY_LATIN_LINE.test(cleanedBody)) return null;

  let repaired = cleanedBody.replace(EMBEDDED_LATIN_GARBAGE, '');
  repaired = repaired.replace(LATIN_GARBAGE_CHUNK, (match) => {
    const latinRatio = match.replace(/\s/g, '').length / Math.max(match.length, 1);
    return latinRatio > 0.6 ? '' : match;
  });
  repaired = cleanReadingLine(repaired);

  if (!repaired || !isValidPassageLine(repaired)) return null;
  return prefix ? `${prefix}${repaired}` : repaired;
}

/**
 * 清洗左側文章面板用的 passage 陣列（含「第N行：」格式）
 * @param {string[]} passageLines
 * @returns {string[]}
 */
export function sanitizePassageForDisplay(passageLines = []) {
  return passageLines
    .map(repairPassageDisplayLine)
    .filter(Boolean);
}

/** 清洗選項文字，剔除亂碼項與重複字母前綴（A. / B、） */
export function sanitizeOptionsForDisplay(options = []) {
  const seen = new Set();
  return options
    .map((opt) => stripOptionLetterPrefix(String(opt ?? '').replace(LATIN_GARBAGE_CHUNK, '')))
    .map((opt) => cleanReadingLine(opt))
    .filter((opt) => opt.length >= 2 && !isGarbageOption(opt))
    .filter((opt) => {
      if (seen.has(opt)) return false;
      seen.add(opt);
      return true;
    });
}

/**
 * 清洗單條 readingBank 題目（學生端渲染前）
 * @param {object} item
 * @returns {object}
 */
export function sanitizeReadingBankItem(item = {}) {
  if (!item || !Array.isArray(item.passage)) return item;

  const passage = sanitizePassageForDisplay(item.passage);
  const options = sanitizeOptionsForDisplay(item.options ?? []);

  let correctIndex = Number(item.correctIndex) || 0;
  if (correctIndex >= options.length) correctIndex = 0;

  return {
    ...item,
    passage: passage.length >= 1 ? passage : item.passage,
    options: options.length >= 3 ? options : item.options,
    correctIndex,
  };
}

/** 批量清洗 readingBank */
export function sanitizeReadingBankItems(bank = []) {
  return bank.map(sanitizeReadingBankItem);
}

/**
 * 清洗上載解析結果（ReadingUploadModal 完成回調前）
 * @param {object} uploadMeta — AiUploadModal onComplete 回傳的 meta
 */
export function sanitizeReadingUploadMeta(uploadMeta = {}) {
  const extractedPassages = (uploadMeta.extractedPassages ?? []).map((entry) => {
    const lines = entry.lines ?? entry.parsed?.articleLines ?? entry.parsed?.passageLines ?? [];
    const cleaned = sanitizeArticleLines(lines);
    const aiQuestions = entry.parsed?.questionsFromAi ? (entry.parsed?.questions ?? []) : [];
    return {
      ...entry,
      lines: cleaned,
      parsed: entry.parsed
        ? {
          ...entry.parsed,
          articleLines: cleaned,
          passageLines: cleaned,
          questions: aiQuestions,
        }
        : entry.parsed,
    };
  });

  return { ...uploadMeta, extractedPassages };
}
