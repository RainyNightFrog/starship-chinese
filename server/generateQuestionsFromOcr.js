/**
 * 後端 OCR 出題 — 轉發至前端動態引擎（與 src/ 共用邏輯，拔除美玲硬編碼）
 */

export { generateQuestionsFromOcr, denoiseOcrText } from '../src/generateQuestionsFromOcr.js';

/** 相容舊 API；不再使用固定美玲樣版 */
export const MEILING_TEMPLATE = {
  articleTitle: '校本閱讀',
  articleLines: [],
  questions: [],
};

/** 正規化 3–5 道選擇題物件陣列 */
export function normalizeQuestionsArray(raw) {
  if (typeof raw === 'string' || !Array.isArray(raw)) {
    return [];
  }
  const valid = raw
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: index + 1,
      questionText: String(item.questionText ?? item.question ?? '').trim(),
      options: (item.options ?? []).map(String).filter(Boolean).slice(0, 4),
      correctAnswerIndex: Math.min(3, Math.max(0, Number(item.correctAnswerIndex ?? item.correctIndex ?? 0))),
      hint: String(item.hint ?? item.explanation ?? '').trim(),
    }))
    .filter((q) => q.questionText.length >= 4 && q.options.length >= 4);

  return valid.slice(0, 5).map((q, i) => ({ ...q, id: i + 1 }));
}
