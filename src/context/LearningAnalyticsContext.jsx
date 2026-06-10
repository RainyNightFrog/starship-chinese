/**
 * LearningAnalyticsContext — 學生答題 ➡️ 家長圖表 / AI 建議 全局監聽器
 *
 * 雙端閉環：
 *  · 學生端提交答案 → recordQuestionAttempt → localStorage + 觸發報告重算
 *  · 家長端 ParentAnalyticsPanel 訂閱 snapshot，圖表平滑重繪
 */

import React, {
  createContext,
  useCallback,
  useContext,
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

const LearningAnalyticsContext = createContext(null);

export function LearningAnalyticsProvider({
  children,
  parentConfig,
  onWrongAnswerReviewsChange,
  studentName = '張同學',
}) {
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

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
    };
  // parentConfig 引用變更時重算
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, parentConfig, studentName]);

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
  }, [onWrongAnswerReviewsChange, refresh]);

  const value = useMemo(() => ({
    snapshot,
    refresh,
    recordQuestionAttempt,
  }), [snapshot, refresh, recordQuestionAttempt]);

  return (
    <LearningAnalyticsContext.Provider value={value}>
      {children}
    </LearningAnalyticsContext.Provider>
  );
}

export function useLearningAnalytics() {
  return useContext(LearningAnalyticsContext);
}
