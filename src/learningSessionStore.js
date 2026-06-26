/**
 * 學習 session 記錄 — localStorage 持久化
 * 供家長端成績趨勢圖、AI 歸因分析使用
 */

import { notifyAnalyticsChanged } from './analyticsSync.js';

const STORAGE_KEY = 'xinghang_learning_sessions';
const MAX_SESSIONS = 120;

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    /* ignore */
  }
}

/** 香港日期鍵 YYYY-MM-DD */
export function getSessionDateKey(iso = new Date().toISOString()) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
}

/**
 * 記錄一組練習完成（或單題提交）
 * @param {object} entry
 */
export function recordLearningSession(entry = {}) {
  const sessions = loadSessions();
  const session = {
    id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: entry.taskId ?? 'unknown',
    questionsAttempted: entry.questionsAttempted ?? 1,
    questionsCorrect: entry.questionsCorrect ?? 0,
    durationMs: entry.durationMs ?? 0,
    wrongOptionIds: entry.wrongOptionIds ?? [],
    wrongOptionLabels: entry.wrongOptionLabels ?? [],
    questionId: entry.questionId ?? null,
    uploadScope: entry.uploadScope ?? null,
    hesitationMs: entry.hesitationMs ?? entry.durationMs ?? 0,
    isCorrect: Boolean(entry.isCorrect),
    completedAt: new Date().toISOString(),
    dateKey: getSessionDateKey(),
  };
  sessions.unshift(session);
  saveSessions(sessions);
  notifyAnalyticsChanged('learning_session');
  return session;
}

export function loadAllSessions() {
  return loadSessions();
}

/** 近 N 日每日正確率趨勢（供圖表） */
export function getAccuracyTrend(days = 7) {
  const sessions = loadSessions();
  const buckets = new Map();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getSessionDateKey(d.toISOString());
    buckets.set(key, { dateKey: key, attempted: 0, correct: 0, sessions: 0 });
  }

  sessions.forEach((s) => {
    const bucket = buckets.get(s.dateKey);
    if (!bucket) return;
    bucket.attempted += s.questionsAttempted ?? 1;
    bucket.correct += s.questionsCorrect ?? (s.isCorrect ? 1 : 0);
    bucket.sessions += 1;
  });

  return [...buckets.values()].map((b) => ({
    ...b,
    accuracy: b.attempted > 0 ? Math.round((b.correct / b.attempted) * 100) : null,
    label: b.dateKey.slice(5),
  }));
}

/** 依科目統計今日完成進度 */
export function getTodayProgressByTask() {
  const today = getSessionDateKey();
  const sessions = loadSessions().filter((s) => s.dateKey === today);
  const byTask = {};

  sessions.forEach((s) => {
    if (!byTask[s.taskId]) {
      byTask[s.taskId] = { taskId: s.taskId, attempted: 0, correct: 0 };
    }
    byTask[s.taskId].attempted += s.questionsAttempted ?? 1;
    byTask[s.taskId].correct += s.questionsCorrect ?? (s.isCorrect ? 1 : 0);
  });

  return Object.values(byTask).map((t) => ({
    ...t,
    accuracy: t.attempted > 0 ? Math.round((t.correct / t.attempted) * 100) : 0,
  }));
}

/** 格式化毫秒為「X 分 Y 秒」 */
export function formatDurationMs(ms = 0) {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min} 分 ${sec} 秒`;
  return `${sec} 秒`;
}
