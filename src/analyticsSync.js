/**
 * 學生成績分析 — 跨模組即時同步事件
 * localStorage 寫入後廣播，LearningAnalyticsContext 訂閱並重算 snapshot
 */

export const ANALYTICS_CHANGED_EVENT = 'xinghang-analytics-changed';

/** 通知家長端圖表 / AI 報告立即重繪 */
export function notifyAnalyticsChanged(source = 'unknown') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ANALYTICS_CHANGED_EVENT, {
    detail: { source, at: Date.now() },
  }));
}

/** 訂閱分析資料變更 */
export function subscribeAnalyticsChanged(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (e) => handler(e.detail ?? {});
  window.addEventListener(ANALYTICS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(ANALYTICS_CHANGED_EVENT, listener);
}
