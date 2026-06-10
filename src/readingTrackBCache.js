/**
 * 軌道 B 本地快取 — 以 coreKeywords 組合為 Key，存入 sessionStorage
 *
 * 用途：同一零碎考卷在刷新 / 切換頁面後秒級還原，避免重複呼叫 Vision API。
 * 生命週期：分頁關閉即清除；單筆最長 30 分鐘。
 */

const STORAGE_KEY = 'xinghang_reading_track_b_v1';
const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 24;

/** 將核心詞排序後串接，作為穩定快取 Key */
export function buildTrackBCacheKey(coreKeywords = []) {
  const words = (Array.isArray(coreKeywords) ? coreKeywords : [])
    .map((w) => String(w ?? '').trim())
    .filter((w) => w.length >= 2);
  if (!words.length) return '';
  return [...new Set(words)].sort().join('|');
}

function readStore() {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* 容量滿時略過，不影響主流程 */
  }
}

function pruneStore(store) {
  const now = Date.now();
  const entries = Object.entries(store)
    .filter(([, v]) => v?.cachedAt && now - v.cachedAt < TTL_MS)
    .sort((a, b) => (b[1].cachedAt ?? 0) - (a[1].cachedAt ?? 0))
    .slice(0, MAX_ENTRIES);
  return Object.fromEntries(entries);
}

/**
 * 讀取軌道 B 快取
 * @returns {{ articleTitle, articleLines, coreKeywords, questions, expandedBy, contentTrack } | null}
 */
export function readTrackBCache(cacheKey) {
  if (!cacheKey) return null;
  const store = readStore();
  const hit = store[cacheKey];
  if (!hit?.cachedAt || Date.now() - hit.cachedAt > TTL_MS) return null;
  if (!hit.articleLines?.length || hit.articleLines.length < 2) return null;
  if (!hit.questions?.length) return null;
  return hit;
}

/**
 * 寫入軌道 B 快取（文章 + 3 道邏輯鎖定題）
 */
export function writeTrackBCache(cacheKey, payload = {}) {
  if (!cacheKey || !payload.articleLines?.length) return;
  if (!payload.questions?.length) return;

  const store = pruneStore(readStore());
  store[cacheKey] = {
    articleTitle: payload.articleTitle ?? '校本閱讀',
    articleLines: payload.articleLines,
    coreKeywords: payload.coreKeywords ?? [],
    questions: payload.questions,
    expandedBy: payload.expandedBy ?? 'programmatic',
    contentTrack: 'B',
    cachedAt: Date.now(),
  };
  writeStore(store);
}

/** 清除全部軌道 B 快取（上載清除時可選呼叫） */
export function clearTrackBCache() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
