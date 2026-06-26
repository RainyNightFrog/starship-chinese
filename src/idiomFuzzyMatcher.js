/**
 * IDIOM_EXAM_POOL 模糊配對引擎 — Fuse.js
 * ────────────────────────────────────────
 * · 容忍 OCR 錯字（如「賞心目」→「賞心悅目」）
 * · 供 syncAndExpandSharedPool、customVocabMatcher 共用
 * · threshold 0.4 = 允許約 40% 字元偏差
 */

import Fuse from 'fuse.js';
import { IDIOM_EXAM_POOL } from './idiomExamPool.js';

/** Fuse.js 容錯率 — 0 完全精準，1 完全寬鬆 */
export const IDIOM_FUSE_THRESHOLD = 0.4;

/** 詞語 → 完整題目（O(1) 精準查找） */
const POOL_BY_WORD = new Map(
  IDIOM_EXAM_POOL.map((item) => [item.word, item]),
);

let idiomFuseInstance = null;

/** 延遲建立 Fuse 索引 — 避免模組載入時阻塞主執行緒 */
function getIdiomFuse() {
  if (!idiomFuseInstance) {
    idiomFuseInstance = new Fuse(IDIOM_EXAM_POOL, {
      keys: ['word'],
      threshold: IDIOM_FUSE_THRESHOLD,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2,
      distance: 100,
    });
  }
  return idiomFuseInstance;
}

/**
 * 單一 OCR 詞語 → 黃金 30 題池最佳匹配
 * @param {string} ocrWord — OCR 辨識出的詞（可能含錯字）
 * @returns {{ item: object, score: number, matchedVia: 'exact'|'fuse' } | null}
 */
export function fuzzyMatchIdiomWord(ocrWord) {
  const word = String(ocrWord ?? '').trim().replace(/\s/g, '');
  if (!word || word.length < 2) return null;

  const exact = POOL_BY_WORD.get(word);
  if (exact) {
    return { item: exact, score: 0, matchedVia: 'exact' };
  }

  const results = getIdiomFuse().search(word);
  if (!results.length) return null;

  const best = results[0];
  const poolWord = best.item?.word;
  if (!poolWord) return null;

  /** 長度差距過大時拒絕（避免「目」誤配「賞心悅目」） */
  if (poolWord.length >= 3 && Math.abs(poolWord.length - word.length) > 1) {
    return null;
  }

  if ((best.score ?? 1) > IDIOM_FUSE_THRESHOLD) return null;

  return {
    item: best.item,
    score: best.score ?? 0,
    matchedVia: 'fuse',
  };
}

/**
 * 整段 OCR 正文 → 批量模糊撈出 IDIOM_EXAM_POOL 命中項
 * @param {string} ocrProcessedText — 去噪後 OCR 全文
 * @returns {Array<object>} — 去重後的標準題目物件（含 fuseScore）
 */
export function fuzzyMatchIdiomsFromText(ocrProcessedText = '') {
  const plain = String(ocrProcessedText).replace(/\s+/g, '');
  if (plain.length < 2) return [];

  const results = getIdiomFuse().search(plain);
  const seen = new Set();
  const matched = [];

  results.forEach((r) => {
    if ((r.score ?? 1) > IDIOM_FUSE_THRESHOLD) return;
    const word = r.item?.word;
    if (!word || seen.has(word)) return;
    seen.add(word);
    matched.push({
      ...r.item,
      fuseScore: r.score ?? 0,
      matchedVia: 'fuse_text',
    });
  });

  return matched;
}

/** 是否為黃金 30 題池內的標準詞（精準或模糊校正後） */
export function isPoolIdiomWord(word) {
  return POOL_BY_WORD.has(String(word ?? '').trim());
}

/** 取得池內標準詞（精準查找） */
export function getPoolIdiomItem(word) {
  return POOL_BY_WORD.get(String(word ?? '').trim()) ?? null;
}

export { POOL_BY_WORD, IDIOM_EXAM_POOL };
