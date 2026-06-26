/**
 * DynamicQuiz — 從 GLOBAL_SHARED 池 Fisher-Yates 動態抽題
 * ─────────────────────────────────────────────────────────
 * · 閱讀理解 / 單元測驗 / 呈分試 共用邏輯
 * · UGC 題目渲染「✨ 全港名校家長共享」徽章
 */

import React from 'react';
import { fisherYatesShuffle } from '../questionEngineCore.js';
import {
  getGlobalSharedIdioms,
  getGlobalSharedMethods,
  pickRandomSharedIdiomQuestions,
  pickDistinctSharedMethodQuestions,
  idiomPoolItemToQuestion,
} from '../globalSharedPool.js';
import { isPlayableVocabExamItem } from '../sharedIdiomQuality.js';
import ContributorHonorBadge from '../ContributorHonorBadge.jsx';
import { useContributorBadge } from '../useContributorBadge.js';

/**
 * 從中央共享池抽取 N 道可作答詞彙語意題（Fisher-Yates + 去重）
 * @param {number} count
 * @param {number} [seed]
 */
export function pickDynamicIdiomQuestions(count = 1, seed) {
  return pickRandomSharedIdiomQuestions(count, seed);
}

/**
 * 從中央共享手法池抽取 N 道互異 type 題（十大呈分試矩陣）
 * @param {number} count
 * @param {number} [seed]
 */
export function pickDynamicMethodQuestions(count = 3, seed) {
  return pickDistinctSharedMethodQuestions(count, seed, { requireDistinctType: true });
}

/**
 * 合併詞彙 + 手法動態題（供閱讀理解混合出題）
 */
export function buildDynamicQuizMix({ idiomCount = 2, methodCount = 1, seed } = {}) {
  const idioms = pickDynamicIdiomQuestions(idiomCount, seed);
  const methods = pickDynamicMethodQuestions(methodCount, seed != null ? seed + 17 : undefined);
  return fisherYatesShuffle([...idioms, ...methods]);
}

/** 是否為非基礎種子庫的 UGC / 共享題 */
export function isSharedPoolQuestion(item) {
  return Boolean(item?.isCommunityShared || item?.contributorLabel || item?.sharedPoolId);
}

/** 共享題徽章 — 固定文案 */
export function DynamicQuizSharedBadge({ item, isSEN = false, isNight = false }) {
  const hookBadge = useContributorBadge(item);
  const badge = hookBadge?.isCommunityShared
    ? hookBadge
    : (isSharedPoolQuestion(item)
      ? { isCommunityShared: true, helpedCount: 0, sharedPoolId: item?.sharedPoolId ?? item?.id }
      : null);

  if (!badge?.isCommunityShared) return null;

  return (
    <ContributorHonorBadge badge={badge} isSEN={isSEN} isNight={isNight} />
  );
}

/**
 * 將 GLOBAL_SHARED_IDIOMS  playable 項轉為標準四選一題（不含隨機盲抽）
 */
export function globalIdiomsToQuestionList(pool = getGlobalSharedIdioms()) {
  return pool
    .filter(isPlayableVocabExamItem)
    .map((item, index) => idiomPoolItemToQuestion(item, index));
}

/** 預覽用 — 共享池統計 */
export function getDynamicQuizPoolStats() {
  return {
    idioms: getGlobalSharedIdioms().length,
    methods: getGlobalSharedMethods().length,
    playableIdioms: getGlobalSharedIdioms().filter(isPlayableVocabExamItem).length,
  };
}

export default DynamicQuizSharedBadge;
