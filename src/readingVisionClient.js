/**
 * 閱讀理解 OCR — 前端呼叫後端 Node.js Tesseract API
 * 路由：POST /api/reading/vision · POST /api/reading/vision-stitch
 */

import {
  READING_BLUR_ERROR_CODE,
  READING_BACKEND_UNAVAILABLE_CODE,
  READING_BACKEND_UNAVAILABLE_MESSAGE,
} from './readingDualTrackEngine';

let ocrAvailableCache = null;
let resolvedApiBase = null;

function getReadingApiBase() {
  const speechUrl = import.meta.env.VITE_SPEECH_API_URL?.trim();
  if (speechUrl) {
    return speechUrl.replace(/\/api\/speech\/?$/, '');
  }
  return resolvedApiBase ?? '';
}

const OCR_HEALTH_PATH = '/api/reading/health';
/** 略長於 Vercel serverless maxDuration(60)，逾時後改走瀏覽器 OCR 備援 */
const OCR_FETCH_TIMEOUT_MS = 65000;

async function fetchHealthCheck() {
  const bases = [
    import.meta.env.VITE_SPEECH_API_URL?.trim()
      ? import.meta.env.VITE_SPEECH_API_URL.trim().replace(/\/api\/speech\/?$/, '')
      : null,
    '',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ].filter((v, i, arr) => v != null && arr.indexOf(v) === i);

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${OCR_HEALTH_PATH}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) continue;
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          resolvedApiBase = base;
          return { ok: true, data };
        }
      }
    } catch {
      /* 嘗試下一個 base */
    }
  }
  resolvedApiBase = null;
  return { ok: false, data: null };
}

function throwBackendUnavailable(cause) {
  const err = new Error(READING_BACKEND_UNAVAILABLE_MESSAGE);
  err.code = READING_BACKEND_UNAVAILABLE_CODE;
  err.cause = cause;
  throw err;
}

async function fetchOcrApi(path, options) {
  if (!resolvedApiBase) {
    await fetchHealthCheck();
  }
  const bases = [
    resolvedApiBase ?? '',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ].filter((v, i, arr) => v != null && arr.indexOf(v) === i);

  let lastErr;
  for (const base of bases) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OCR_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${base}${path}`, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 413) {
        const err = new Error('圖片總大小超過伺服器上限。請減少一次上載張數，或改用「貼上文字」備援。');
        err.code = 'payload_too_large';
        throw err;
      }
      resolvedApiBase = base;
      return res;
    } catch (netErr) {
      clearTimeout(timer);
      if (netErr?.code === 'payload_too_large') throw netErr;
      if (netErr?.name === 'AbortError') {
        lastErr = new Error('OCR 請求逾時');
      } else {
        lastErr = netErr;
      }
    }
  }
  ocrAvailableCache = null;
  resolvedApiBase = null;
  throwBackendUnavailable(lastErr);
}

function throwOcrError(data, status) {
  const message = data.userMessage
    || data.error
    || `後端 OCR API 錯誤 (${status})`;

  const err = new Error(message);

  if (data.code === READING_BLUR_ERROR_CODE) {
    err.code = READING_BLUR_ERROR_CODE;
  } else if (data.code === 'tesseract_module_not_found') {
    err.code = 'tesseract_module_not_found';
  } else if (data.code === READING_BACKEND_UNAVAILABLE_CODE) {
    err.code = READING_BACKEND_UNAVAILABLE_CODE;
  } else if (status === 503 || status === 502) {
    err.code = READING_BACKEND_UNAVAILABLE_CODE;
    err.message = READING_BACKEND_UNAVAILABLE_MESSAGE;
  }

  throw err;
}

async function parseOcrResponse(res, { allowPartial = false } = {}) {
  const data = await res.json().catch(() => ({}));
  const rawText = String(data.rawText ?? data.articleLines?.join('\n') ?? '').trim();

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throwBackendUnavailable(new Error(`HTTP ${res.status}`));
    }
    if (allowPartial && rawText.length >= 2 && data.code !== READING_BLUR_ERROR_CODE) {
      return { ...data, rawText, ok: true, vocabOcrBypass: true };
    }
    throwOcrError(data, res.status);
  }

  if (data.code === READING_BLUR_ERROR_CODE) {
    throwOcrError(data, 422);
  }

  /** 詞表 OCR：閱讀理解品質未達標仍可能有 rawText */
  if (allowPartial && data.ok === false && rawText.length >= 2) {
    return { ...data, rawText, vocabOcrBypass: true };
  }

  if (data.ok === false) {
    throwOcrError(data, 422);
  }

  /** 防呆：questions 必須是物件陣列，不可為字串 */
  if (typeof data.questions === 'string') {
    data.questions = [];
  }

  return data;
}

export async function checkReadingVisionAvailable(force = false) {
  if (!force && ocrAvailableCache !== null) return ocrAvailableCache;
  const result = await fetchHealthCheck();
  ocrAvailableCache = result.ok;
  return ocrAvailableCache;
}

/** 單張圖片 — 後端 OCR */
export async function analyzeReadingImageWithVision({ imageDataUrl, fileName, onProgress }) {
  onProgress?.(0.15);

  const res = await fetchOcrApi('/api/reading/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageDataUrl, fileName }),
  });

  onProgress?.(0.85);
  const data = await parseOcrResponse(res);
  onProgress?.(1);
  return data;
}

/** 詞表上載 — 專用 OCR（前處理 + sparse text，不走閱讀理解品質檢查） */
export async function recognizeVocabImageText({ imageDataUrl, fileName, onProgress }) {
  onProgress?.(0.15);

  const res = await fetchOcrApi('/api/reading/vocab-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageDataUrl, fileName }),
  });

  onProgress?.(0.85);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throwBackendUnavailable(new Error(`HTTP ${res.status}`));
    }
    if (data.rawText?.trim()) {
      onProgress?.(1);
      return String(data.rawText).trim();
    }
    throwOcrError(data, res.status);
  }

  onProgress?.(1);
  return String(data.rawText ?? '').trim();
}

/** 多張圖片 — 後端 OCR 合併 */
export async function analyzeReadingImagesStitchedWithVision({
  images = [],
  onProgress,
  onStitchPage,
} = {}) {
  const payload = images.map((item, order) => ({
    order,
    fileName: item.fileName ?? `第${order + 1}頁`,
    imageDataUrl: item.previewUrl ?? item.imageDataUrl,
  }));

  const total = payload.length;
  onStitchPage?.(1, total);
  onProgress?.(0.08);

  const res = await fetchOcrApi('/api/reading/vision-stitch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: payload }),
  });

  onStitchPage?.(total, total);
  onProgress?.(0.92);

  const data = await parseOcrResponse(res);
  onProgress?.(1);
  return data;
}
