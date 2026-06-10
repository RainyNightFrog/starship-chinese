/**
 * Azure TTS 音訊本地快取層
 *
 * 策略：記憶體 Map（同分頁即時重播） + IndexedDB（跨分頁／跨次登入持久化）
 * Key 格式：{字詞文字}|{語音引擎}|{語速標籤}
 * 例：「安慰|zh-HK-HiuGaaiNeural|zh-HK-100」
 *
 * 設計原則：快取讀寫失敗絕不阻斷播放；寫入採非阻塞 fire-and-forget。
 */

const DB_NAME = 'xinghang_azure_speech';
const STORE = 'audio';
const DB_VERSION = 1;
/** 最多保留條目數，超出時刪除最舊的 Key（FIFO） */
const MAX_ENTRIES = 400;

let dbPromise = null;

/** 同分頁 Session 記憶體快取 — 避免重複讀 IndexedDB */
const memoryCache = new Map();

/**
 * 開啟 IndexedDB（單例 Promise，避免重複 open）
 * @returns {Promise<IDBDatabase|null>}
 */
function openDB() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn('[SpeechCache] IndexedDB 開啟失敗，將僅使用記憶體快取');
        resolve(null);
      };
    });
  }
  return dbPromise;
}

/**
 * 預熱 IndexedDB — 可在 useSpeech 掛載時呼叫，減少首次播放延遲
 */
export async function warmSpeechCache() {
  try {
    await openDB();
  } catch {
    /* 預熱失敗不影響主流程 */
  }
}

/**
 * 組合快取 Key：字詞 + 語音引擎 + 語速（確保換引擎／語速時重新合成）
 * @param {{ text: string, voice: string, rateTag: string }} params
 */
export function buildCacheKey({ text, voice, rateTag }) {
  const normalizedText = (text || '').trim();
  return `${normalizedText}|${voice}|${rateTag}`;
}

/** 從記憶體快取讀取 */
export function getMemoryCached(key) {
  return memoryCache.get(key) ?? null;
}

/** 寫入記憶體快取 */
export function setMemoryCached(key, blob) {
  if (key && blob instanceof Blob) {
    memoryCache.set(key, blob);
  }
}

/**
 * 從 IndexedDB 讀取 Audio Blob
 * @returns {Promise<Blob|null>}
 */
export async function getIndexedCached(key) {
  try {
    const db = await openDB();
    if (!db) return null;
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** 超出上限時刪除最舊條目 */
async function trimCache(db) {
  try {
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        const keys = req.result;
        if (keys.length <= MAX_ENTRIES) {
          resolve();
          return;
        }
        const toDelete = keys.slice(0, keys.length - MAX_ENTRIES);
        toDelete.forEach((k) => store.delete(k));
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch {
    /* trim 失敗可忽略 */
  }
}

/**
 * 寫入 IndexedDB（內部用，錯誤靜默處理）
 * @returns {Promise<boolean>} 是否寫入成功
 */
async function setIndexedCached(key, blob) {
  try {
    const db = await openDB();
    if (!db) return false;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await trimCache(db);
    return true;
  } catch (err) {
    console.warn('[SpeechCache] IndexedDB 寫入失敗（不影響播放）:', err?.message);
    return false;
  }
}

/**
 * 雙層讀取：記憶體 → IndexedDB → 回填記憶體
 * 命中時 100% 阻截 Azure 請求
 * @returns {Promise<Blob|null>}
 */
export async function getCachedBlob(key) {
  if (!key) return null;

  const mem = getMemoryCached(key);
  if (mem) return mem;

  const idb = await getIndexedCached(key);
  if (idb) {
    setMemoryCached(key, idb);
    return idb;
  }

  return null;
}

/**
 * 非阻塞寫入快取 — 播放與寫入並行，寫入失敗不 throw
 * @returns {Promise<void>}
 */
export async function saveCachedBlob(key, blob) {
  if (!key || !(blob instanceof Blob)) return;

  setMemoryCached(key, blob);

  try {
    await setIndexedCached(key, blob);
  } catch {
    /* 已在 setIndexedCached 內記錄，此處雙重保險 */
  }
}

/** 查詢快取是否已有指定 Key（供除錯／UI 顯示） */
export async function hasCachedBlob(key) {
  const hit = await getCachedBlob(key);
  return Boolean(hit);
}

/** 取得快取統計（記憶體條目數） */
export function getMemoryCacheSize() {
  return memoryCache.size;
}
