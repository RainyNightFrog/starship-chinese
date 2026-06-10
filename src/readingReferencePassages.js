/**
 * 固定閱讀參考文章 — 供單元測驗（附文出題）與閱讀理解題庫共用
 */

import { READING_PASSAGE_PACKS } from './readingBuiltinPool.js';

/** 由內建題庫文章包自動生成（與 READING_POOL 同步） */
export const READING_REFERENCE_PASSAGES = Object.fromEntries(
  READING_PASSAGE_PACKS.map((pack) => [
    pack.passageId,
    {
      passageId: pack.passageId,
      passageTitle: pack.passageTitle,
      genre: pack.genre,
      passage: [...pack.passage],
    },
  ]),
);

/** @param {string} passageId */
export function getReadingReferencePassage(passageId) {
  return READING_REFERENCE_PASSAGES[passageId] ?? null;
}
