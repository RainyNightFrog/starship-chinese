/**
 * LearningAnalyticsContext — 學生答題 ➡️ 家長圖表 / AI 建議 全局監聽器
 *
 * 雙端閉環 + 即時更新：
 *  · 學生端提交答案 → recordQuestionAttempt → localStorage + 觸發報告重算
 *  · storage / 自訂事件 → 跨分頁、跨模組同步
 *  · 家長端面板展開時每 2 秒輪詢；背景每 8 秒兜底刷新
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loadAllSessions,
  recordLearningSession,
  getAccuracyTrend,
  getTodayProgressByTask,
} from '../learningSessionStore';
import { generateAIReport } from '../generateAIReport';
import {
  loadAllAsList as loadWrongAnswers,
  recordWrongAnswer,
  markAnswerMastered,
  wasPreviouslyWrong,
} from '../wrongAnswerStore';
import { loadAllAsList as loadWrongWords } from '../wrongWordStore';
import { subscribeAnalyticsChanged, notifyAnalyticsChanged } from '../analyticsSync.js';

const LearningAnalyticsContext = createContext(null);

/** 家長端面板展開時 — 較頻繁輪詢 */
const POLL_MS_PANEL_OPEN = 2000;
/** 面板收起時 — 背景兜底刷新 */
const POLL_MS_BACKGROUND = 8000;

export function LearningAnalyticsProvider({
  children,
  parentConfig,
  onWrongAnswerReviewsChange,
  studentName = '張同學',
  /** 家長端後台是否展開 — 展開時加速輪詢 */
  parentPanelOpen = false,
}) {
  const [tick, setTick] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
    setLastUpdatedAt(Date.now());
  }, []);

  /** 事件驅動 — localStorage 寫入、其他模組廣播 */
  useEffect(() => {
    const unsub = subscribeAnalyticsChanged(() => refresh());
    const onStorage = (e) => {
      const keys = [
        'xinghang_learning_sessions',
        'xinghang_wrong_answers',
        'xinghang_wrong_words',
      ];
      if (!e.key || keys.includes(e.key)) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  /** 定時輪詢 — 確保家長端長開面板時圖表持續同步 */
  useEffect(() => {
    const intervalMs = parentPanelOpen ? POLL_MS_PANEL_OPEN : POLL_MS_BACKGROUND;
    if (typeof document !== 'undefined' && document.hidden) return undefined;

    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [parentPanelOpen, refresh]);

  /** 分頁重新可見時立即刷新 */
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  /** 家長上載 / 指派變更時重算 AI 報告 */
  const parentConfigKey = useMemo(() => {
    const ac = parentConfig?.assignedContent ?? {};
    return [
      parentConfig?.uploadLabel,
      parentConfig?.activeTask,
      ac.quizBank?.length,
      ac.sspaBank?.length,
      ac.readingBank?.length,
      ac.vocabByTask?.dictation?.length,
      ac.vocabByTask?.prestudy?.length,
      ac.vocabUploadSession,
      ac.readingUploadSession,
      ac.aiUploadSession,
    ].join('|');
  }, [parentConfig]);

  useEffect(() => {
    refresh();
  }, [parentConfigKey, refresh]);

  /** 組裝給家長端的即時 snapshot */
  const snapshot = useMemo(() => {
    void tick;
    const learningSessions = loadAllSessions();
    const wrongAnswerReviews = loadWrongAnswers();
    const wrongWordReminders = loadWrongWords();
    const accuracyTrend = getAccuracyTrend(7);
    const todayByTask = getTodayProgressByTask();
    const aiAnalysis = generateAIReport({
      parentConfig,
      wrongAnswerReviews,
      wrongWordReminders,
      learningSessions,
      studentName,
    });

    return {
      learningSessions,
      wrongAnswerReviews,
      wrongWordReminders,
      accuracyTrend,
      todayByTask,
      aiAnalysis,
      lastUpdatedAt,
      sessionCount: learningSessions.length,
      todayAttempted: todayByTask.reduce((s, t) => s + t.attempted, 0),
    };
  }, [tick, parentConfig, studentName, lastUpdatedAt]);

  /**
   * 學生端單題提交 — 正確 / 錯誤均記錄
   */
  const recordQuestionAttempt = useCallback(({
    taskId,
    questionId,
    isCorrect,
    durationMs = 0,
    wrongOptionIndex,
    wrongOptionLabel,
    stem,
    wrongAnswer,
    correctAnswer,
    hint,
    uploadScope,
  }) => {
    recordLearningSession({
      taskId,
      questionId,
      questionsAttempted: 1,
      questionsCorrect: isCorrect ? 1 : 0,
      durationMs,
      hesitationMs: durationMs,
      isCorrect,
      wrongOptionIds: wrongOptionIndex != null ? [String(wrongOptionIndex)] : [],
      wrongOptionLabels: wrongOptionLabel ? [wrongOptionLabel] : [],
      uploadScope,
    });

    if (!isCorrect) {
      const list = recordWrongAnswer({
        taskId,
        questionId,
        stem,
        wrongAnswer,
        correctAnswer,
        hint,
        wrongOptionIndex,
        hesitationMs: durationMs,
        uploadScope,
        sourceType: uploadScope ? 'school' : 'ai_similar',
      });
      onWrongAnswerReviewsChange?.(list);
    } else if (wasPreviouslyWrong(taskId, questionId)) {
      const list = markAnswerMastered(taskId, questionId);
      onWrongAnswerReviewsChange?.(list);
    }

    refresh();
    notifyAnalyticsChanged('record_question');
  }, [onWrongAnswerReviewsChange, refresh]);

  /**
   * 默書 / 預習等非選擇題進度 — 完成一詞即記錄
   */
  const recordStudyProgress = useCallback(({
    taskId,
    questionId,
    stem,
    uploadScope,
    durationMs = 0,
  }) => {
    recordLearningSession({
      taskId,
      questionId,
      questionsAttempted: 1,
      questionsCorrect: 1,
      durationMs,
      hesitationMs: durationMs,
      isCorrect: true,
      uploadScope,
    });
    refresh();
    notifyAnalyticsChanged('study_progress');
  }, [refresh]);

  const value = useMemo(() => ({
    snapshot,
    refresh,
    recordQuestionAttempt,
    recordStudyProgress,
    lastUpdatedAt,
  }), [snapshot, refresh, recordQuestionAttempt, recordStudyProgress, lastUpdatedAt]);

  return (
    <LearningAnalyticsContext.Provider value={value}>
      {children}
    </LearningAnalyticsContext.Provider>
  );
}

export function useLearningAnalytics() {
  return useContext(LearningAnalyticsContext);
}
