import { resolveAzureVoice } from './azureVoices';
import {
  buildCacheKey,
  getCachedBlob,
  saveCachedBlob,
  warmSpeechCache,
} from './speechCache';
import {
  getAzureSpeechRate,
  getSpeechRateTag,
  isMaleSpeechVoice,
  MALE_PLAYBACK_RATE,
} from './speechRate';

const API_BASE = import.meta.env.VITE_SPEECH_API_URL || '/api/speech';

let azureAvailable = null;

/**
 * 進行中的 Azure 請求（同 Key 去重）
 * 防止「安慰」等詞在快取未寫入前被連點，觸發多次計費請求
 * @type {Map<string, Promise<Blob>>}
 */
const inflightRequests = new Map();

/** 檢查 Azure 後端是否就緒 */
export async function checkAzureSpeechHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      azureAvailable = false;
      return false;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      azureAvailable = false;
      return false;
    }
    const data = await res.json();
    azureAvailable = Boolean(data.ok);
    return azureAvailable;
  } catch {
    azureAvailable = false;
    return false;
  }
}

export function isAzureSpeechEnabled() {
  return azureAvailable !== false;
}

export { warmSpeechCache };

/**
 * 清除所有進行中的請求引用（元件卸載時呼叫，防記憶體洩漏）
 */
export function clearInflightSpeechRequests() {
  inflightRequests.clear();
}

/**
 * 向 Azure 後端請求合成 MP3 — 快取優先（Cache-First）
 *
 * 流程：
 * 1. 以「字詞 + 語音引擎 + 語速」組 Key，查本地快取
 * 2. 命中 → 直接回傳 Blob，零 Azure 請求
 * 3. 未命中 → 向 /api/speech/synthesize 請求，並非阻塞寫入 IndexedDB
 *
 * @param {object} params
 * @param {string} params.text - 要合成的文字（如「安慰」「啟發」）
 * @param {string} params.lang - 語言代碼 zh-HK / zh-CN / en-US
 * @param {string} [params.voice] - Azure 語音名稱
 * @param {boolean} [params.isSEN]
 * @param {string} [params.engineKey]
 * @param {AbortSignal} [params.signal] - 取消進行中的網路請求
 * @returns {Promise<{ blob: Blob, voiceName: string, fromCache: boolean }>}
 */
export async function fetchAzureSpeechBlob({
  text,
  lang,
  voice,
  isSEN = false,
  engineKey = 'auto',
  signal,
}) {
  const trimmedText = (text || '').trim();
  if (!trimmedText) {
    throw new Error('缺少合成文字');
  }

  const voiceName = voice || resolveAzureVoice(lang, engineKey);
  const rateKey = engineKey && engineKey !== 'auto' ? engineKey : voiceName;
  const rate = getAzureSpeechRate(lang, isSEN, rateKey);
  const rateTag = getSpeechRateTag(lang, isSEN, rateKey);
  const playbackRate = isMaleSpeechVoice(rateKey) ? MALE_PLAYBACK_RATE : 1;
  const cacheKey = buildCacheKey({ text: trimmedText, voice: voiceName, rateTag });

  // ── 步驟 1：本地快取命中 → 100% 阻截 Azure ──
  try {
    const cached = await getCachedBlob(cacheKey);
    if (cached) {
      return {
        blob: cached, voiceName, fromCache: true, cacheKey, synthesisRate: rate, playbackRate,
      };
    }
  } catch (err) {
    console.warn('[AzureSpeech] 讀取快取失敗，改走雲端:', err?.message);
  }

  // ── 步驟 2：同 Key 進行中請求去重 ──
  if (inflightRequests.has(cacheKey)) {
    try {
      const blob = await inflightRequests.get(cacheKey);
      return {
        blob, voiceName, fromCache: false, cacheKey, deduped: true, synthesisRate: rate, playbackRate,
      };
    } catch (err) {
      inflightRequests.delete(cacheKey);
      throw err;
    }
  }

  // ── 步驟 3：雲端合成 + 非阻塞寫入快取 ──
  const fetchPromise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const mergedSignal = signal
      ? (() => {
          signal.addEventListener('abort', () => controller.abort());
          return controller.signal;
        })()
      : controller.signal;

    try {
      const res = await fetch(`${API_BASE}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedText, voice: voiceName, rate }),
        signal: mergedSignal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Azure TTS 失敗 (${res.status})`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error('語音 API 回應異常（非音檔）');
      }

      const blob = await res.blob();
      saveCachedBlob(cacheKey, blob).catch(() => {});
      return blob;
    } finally {
      clearTimeout(timeout);
    }
  })();

  inflightRequests.set(cacheKey, fetchPromise);

  try {
    const blob = await fetchPromise;
    return { blob, voiceName, fromCache: false, cacheKey, synthesisRate: rate, playbackRate };
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

/**
 * 播放 Audio Blob — 含 object URL 清理，防止記憶體洩漏
 * @returns {{ stop: () => void }}
 */
export function playAudioBlob(blob, { onStart, onEnd, onError, playbackRate = 1 } = {}) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.playbackRate = Math.min(1.2, Math.max(0.5, playbackRate));
  let ended = false;

  const cleanup = () => {
    URL.revokeObjectURL(url);
    audio.onplay = null;
    audio.onended = null;
    audio.onerror = null;
  };

  audio.onplay = () => onStart?.();
  audio.onended = () => {
    if (ended) return;
    ended = true;
    cleanup();
    onEnd?.();
  };
  audio.onerror = () => {
    if (ended) return;
    ended = true;
    cleanup();
    onError?.(new Error('音檔播放失敗'));
  };

  audio.play().catch((e) => {
    if (ended) return;
    ended = true;
    cleanup();
    onError?.(e);
  });

  return {
    stop: () => {
      if (ended) return;
      ended = true;
      audio.pause();
      audio.currentTime = 0;
      cleanup();
    },
  };
}

/**
 * @deprecated 已改為按需播放 — 請勿在初始化或載入詞表時呼叫，以免消耗 Azure 字數
 */
export async function prefetchSpeech(items, { isSEN = false, signal } = {}) {
  if (import.meta.env.DEV) {
    console.warn('[AzureSpeech] prefetchSpeech 已停用，請改用點擊 🔊 按需觸發');
  }
  return Promise.resolve();
}
