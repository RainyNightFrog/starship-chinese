/**
 * 常錯字記錄 — localStorage 持久化，供下次溫習提醒
 */
import { notifyAnalyticsChanged } from './analyticsSync.js';

const STORAGE_KEY = 'xinghang_wrong_words';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    notifyAnalyticsChanged('wrong_word');
  } catch {
    /* 忽略儲存失敗 */
  }
}

/** 記錄一次答錯的字/詞 */
export function recordWrongWord({ tc, sc, context, relatedCorrect, taskId }) {
  if (!tc) return loadAllAsList();

  const all = loadAll();
  const key = tc;
  const prev = all[key] ?? { tc, sc: sc || tc, count: 0, contexts: [], lastWrong: null };

  all[key] = {
    ...prev,
    sc: sc || prev.sc || tc,
    count: prev.count + 1,
    lastWrong: new Date().toISOString(),
    lastContext: context,
    lastTaskId: taskId,
    relatedCorrect: relatedCorrect || prev.relatedCorrect,
    contexts: [...new Set([...(prev.contexts || []), context].filter(Boolean))].slice(-5),
  };

  saveAll(all);
  return loadAllAsList();
}

/** 取得常錯字列表（按次數降序） */
export function loadAllAsList() {
  return Object.values(loadAll()).sort((a, b) => b.count - a.count);
}

/** 需復習提醒的字（count >= minCount） */
export function getReviewReminders(minCount = 1) {
  return loadAllAsList().filter((w) => w.count >= minCount);
}

export function clearWrongWords() {
  saveAll({});
  return [];
}
