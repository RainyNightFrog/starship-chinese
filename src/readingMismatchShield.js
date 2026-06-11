/**
 * 閱讀理解 — 文章與題目邏輯鎖定 + 前端 Mismatch Shield
 *
 * Vision 動態出題（fromVisionDynamic）不得替換為程序化題目；
 * 若脫節則直接剔除，迫使家長重新上載或重試 API。
 */

import { cleanReadingLine } from './readingTextQuality.js';
import { validateQuestionGrounding, validateQuestionArticleMatch, validateOptionsTopicMatch } from './readingSchema.js';
import { sanitizeReadingBankItem } from './readingDisplayGuard.js';

function stripPassagePrefix(line = '') {
  return cleanReadingLine(line).replace(/^第[一二三四五六七八九十\d]+行[：:]?/, '');
}

export { validateQuestionArticleMatch } from './readingSchema.js';

/**
 * 驗證 readingBank 單題
 */
export function validateAndRepairReadingEntry(entry = {}) {
  if (!entry?.passage?.length || !entry?.question) {
    return { ok: false, entry: null, repaired: false };
  }

  const articleLines = entry.passage.map(stripPassagePrefix);
  const schemaQ = {
    questionText: entry.question.replace(/^Q\d\.\s*/, ''),
    options: entry.options ?? [],
    correctAnswerIndex: entry.correctIndex ?? 0,
  };

  const topicResult = validateOptionsTopicMatch(schemaQ.options ?? [], articleLines);
  if (!topicResult.ok) {
    return { ok: false, entry: null, repaired: false };
  }

  /** 後端 OCR / 上載模板題 — 跳過逐字 grounding，但仍須通過主題一致性 */
  if (entry.isAiGenerated || entry.fromVisionDynamic) {
    return { ok: true, entry: sanitizeReadingBankItem(entry), repaired: false };
  }

  const groundingOk = validateQuestionGrounding(schemaQ, articleLines);
  const matchResult = validateQuestionArticleMatch(schemaQ.questionText, articleLines);

  if (groundingOk && matchResult.ok) {
    return { ok: true, entry: sanitizeReadingBankItem(entry), repaired: false };
  }

  return { ok: false, entry: null, repaired: false };
}

/** 批量驗證 readingBank（useQuestionEngine 渲染前） */
export function shieldReadingBank(bank = []) {
  return bank
    .map((item) => validateAndRepairReadingEntry(item))
    .filter((r) => r.ok && r.entry)
    .map((r) => r.entry);
}
