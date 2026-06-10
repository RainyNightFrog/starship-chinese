/**
 * useQuestionEngine — 大容量題庫抽題 Hook
 * ─────────────────────────────────────────
 * · Fisher-Yates 洗牌（questionEngineCore）
 * · localStorage 歷史去重（今日 completedQuestionIds）
 * · 題庫耗盡 → 自動清空快取、重新洗牌
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  buildShuffledDeck,
  markQuestionComplete,
  getCompletedIds,
  clearTaskHistory,
} from './questionEngineCore';
import { getPoolByTaskId } from './mockDatabase';
import { mergeWrongWordsIntoDictation } from './vocabService';
import { enrichVocabList } from './vocabHints';
import { sanitizeReadingBankItem } from './readingDisplayGuard';
import { shieldReadingBank } from './readingMismatchShield';

const VOCAB_TASKS = new Set(['dictation', 'prestudy']);

/** 合併家長上載詞表（OCR 提取）至默書/預習題池前端 */
function mergeVocabUpload(taskId, basePool, overrides = {}) {
  if (!overrides.vocabUploadSession) return basePool;
  const uploaded = overrides.vocabByTask?.[taskId];
  if (!uploaded?.length) return basePool;
  const ids = new Set(uploaded.map((v) => String(v.id)));
  return [
    ...uploaded.map((v) => ({ ...v })),
    ...basePool.filter((v) => !ids.has(String(v.id))),
  ];
}

/**
 * 僅在 quizBank 有題，或 quiz/sentence 標記 isAiGenerated 時注入
 */
function mergeAiOverrides(taskId, basePool, overrides = {}) {
  if (!overrides) return basePool;

  if (taskId === 'quiz') {
    const bank = overrides.quizBank?.length
      ? overrides.quizBank
      : overrides.quiz?.isAiGenerated
        ? [overrides.quiz]
        : [];
    if (!bank.length) return basePool;
    const ids = new Set(bank.map((q) => String(q.id)));
    return [...bank, ...basePool.filter((q) => !ids.has(String(q.id)))];
  }

  if (taskId === 'sentence') {
    const bank = overrides.sentenceBank?.length
      ? overrides.sentenceBank
      : overrides.sentence?.isAiGenerated
        ? [overrides.sentence]
        : [];
    if (!bank.length) return basePool;
    const ids = new Set(bank.map((q) => String(q.id)));
    return [...bank, ...basePool.filter((q) => !ids.has(String(q.id)))];
  }

  if (taskId === 'sspa') {
    const bank = overrides.sspaBank?.length
      ? overrides.sspaBank
      : overrides.sspa?.isAiGenerated
        ? [overrides.sspa]
        : [];
    if (!bank.length) return basePool;
    const ids = new Set(bank.map((q) => String(q.id)));
    return [...bank, ...basePool.filter((q) => !ids.has(String(q.id)))];
  }

  if (taskId === 'reading') {
    const rawBank = overrides.readingBank?.length ? overrides.readingBank : [];
    const bank = rawBank.length ? shieldReadingBank(rawBank) : [];
    if (overrides.readingUploadSession) {
      if (bank.length) {
        return bank.map((q) => sanitizeReadingBankItem({ ...q }));
      }
      /** 有上載紀錄但動態題庫為空 — 禁止回退內建題，避免文章與選項脫節 */
      return [];
    }
    if (!bank.length) return basePool;
    const ids = new Set(bank.map((q) => String(q.id)));
    const merged = [...bank, ...basePool.filter((q) => !ids.has(String(q.id)))];
    return merged.map((q) => sanitizeReadingBankItem({ ...q }));
  }

  return basePool;
}

/** 題池指紋 — 變更時同步重洗，避免科目切換仍用舊牌堆 */
function getPoolSignature(pool) {
  return pool.map((item) => String(item.id)).join('|');
}

/**
 * @param {string|null} taskId — 六大科目 id
 * @param {object} [options]
 * @param {Array} [options.wrongWordReminders] — 常錯字（默書合併）
 * @param {object} [options.aiOverrides] — assignedContent 中的 AI 覆蓋題
 */
export function useQuestionEngine(taskId, options = {}) {
  const { wrongWordReminders = [], aiOverrides = null } = options;

  const [index, setIndex] = useState(0);
  /** 本輪牌堆耗盡後遞增，觸發重新洗牌 */
  const [cycle, setCycle] = useState(0);
  /** 手動刷新牌堆 */
  const [refreshToken, setRefreshToken] = useState(0);

  /** 依科目組裝完整題池（含 AI 覆蓋 + 字義提示 enrichment） */
  const pool = useMemo(() => {
    if (!taskId) return [];

    let raw = mergeAiOverrides(taskId, getPoolByTaskId(taskId), aiOverrides);

    if (VOCAB_TASKS.has(taskId)) {
      raw = mergeVocabUpload(taskId, raw, aiOverrides);
      raw = enrichVocabList(raw.map((v) => ({ ...v })));
      if (taskId === 'dictation' && wrongWordReminders.length) {
        raw = mergeWrongWordsIntoDictation(raw, wrongWordReminders);
      }
    }

    return raw;
  }, [taskId, wrongWordReminders, aiOverrides, refreshToken]);

  const poolSignature = useMemo(() => getPoolSignature(pool), [pool]);

  /**
   * 同步計算洗牌結果（useMemo）
   * 科目 / 題池變更時同一幀即更新，避免 useEffect 延遲導致錯題型崩潰
   */
  const deckSnapshot = useMemo(() => {
    if (!taskId || !pool.length) {
      return {
        items: [],
        reshuffled: false,
        totalPool: 0,
        completedCount: taskId ? getCompletedIds(taskId).length : 0,
      };
    }
    const result = buildShuffledDeck(taskId, pool);
    return {
      items: result.items,
      reshuffled: result.reshuffled,
      totalPool: result.totalPool,
      completedCount: result.completedCount ?? getCompletedIds(taskId).length,
    };
  // cycle 僅在牌堆耗盡時遞增
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, poolSignature, refreshToken, cycle]);

  /** 題池或科目變更 → 重置游標（不同步觸發重洗，重洗已由 useMemo 處理） */
  useEffect(() => {
    setIndex(0);
    setCycle(0);
  }, [taskId, poolSignature, refreshToken]);

  /** 牌堆縮短後 index 越界 → 回到第一題，避免畫面卡在空狀態 */
  useEffect(() => {
    const len = deckSnapshot.items.length;
    if (len > 0 && index >= len) {
      setIndex(0);
    }
  }, [index, deckSnapshot.items.length]);

  /**
   * 題池有題但牌堆為空（今日全做完 / 快取異常）→ 清空歷史並強制重洗
   */
  useEffect(() => {
    if (!taskId || !pool.length || deckSnapshot.items.length > 0) return;
    clearTaskHistory(taskId);
    setCycle((c) => c + 1);
    setIndex(0);
  }, [taskId, pool.length, deckSnapshot.items.length]);

  const currentItem = deckSnapshot.items[index] ?? null;

  const completedCount = taskId ? getCompletedIds(taskId).length : 0;

  /** 標記當前（或指定）題目為今日已完成 */
  const markComplete = useCallback((questionId) => {
    const id = questionId ?? currentItem?.id;
    if (!taskId || !id) return;
    markQuestionComplete(taskId, String(id));
  }, [taskId, currentItem]);

  /**
   * 前進至下一題
   * · 牌堆內還有題 → index + 1
   * · 已是最後一題 → cycle + 1 觸發重新洗牌
   */
  const advanceToNext = useCallback(() => {
    if (!taskId) return;

    if (index < deckSnapshot.items.length - 1) {
      setIndex((i) => i + 1);
      return;
    }

    setCycle((c) => c + 1);
    setIndex(0);
  }, [taskId, index, deckSnapshot.items.length]);

  const refreshDeck = useCallback(() => {
    setRefreshToken((t) => t + 1);
  }, []);

  const rebuildDeck = useCallback(() => {
    setRefreshToken((t) => t + 1);
    setIndex(0);
    setCycle(0);
  }, []);

  const sessionProgress = {
    current: deckSnapshot.items.length ? Math.min(index + 1, deckSnapshot.items.length) : 0,
    total: deckSnapshot.items.length || deckSnapshot.totalPool || 1,
  };

  /**
   * 閱讀理解專用：同一篇文章內的「第 X/Y 題」進度
   * （上載試卷通常每篇 3 題，與牌堆洗牌順序無關）
   */
  const readingPassageProgress = useMemo(() => {
    if (taskId !== 'reading' || !currentItem) return null;
    const qNum = currentItem.questionNumberInPassage
      ?? Number(String(currentItem.id).match(/-q(\d+)$/)?.[1])
      ?? index + 1;
    const total = currentItem.passageQuestionTotal ?? 3;
    return { current: qNum, total };
  }, [taskId, currentItem, index]);

  const todayProgress = {
    completed: completedCount,
    total: deckSnapshot.totalPool,
    remaining: Math.max(0, deckSnapshot.totalPool - completedCount),
  };

  return {
    currentItem,
    deck: deckSnapshot.items,
    vocabDeck: deckSnapshot.items,
    pool,
    index,
    setIndex,
    markComplete,
    advanceToNext,
    refreshDeck,
    rebuildDeck,
    reshuffled: deckSnapshot.reshuffled,
    sessionProgress,
    readingPassageProgress,
    todayProgress,
    totalPool: deckSnapshot.totalPool,
    hasNext: index < deckSnapshot.items.length - 1,
    isEmpty: !deckSnapshot.items.length,
  };
}
