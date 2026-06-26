/**
 * 前端 Tesseract.js OCR 封裝（僅在瀏覽器運行，不在 Node 後端使用）
 *
 * 性能優化（v2）：
 * · 全域 Singleton Worker — 應用程式初始化時僅建立一次，後續上載直接 recognize
 * · cacheMethod: 'readwrite' — chi_tra 語言包下載一次後永久快取於瀏覽器 IndexedDB
 * · Canvas 灰度化 + Otsu 二值化 — 過濾手機拍照陰影，提升 OCR 準確度
 */

import { createWorker, PSM } from 'tesseract.js';

/** 香港繁體中文語言包 */
export const OCR_LANG = 'chi_tra';

/** Tesseract Worker 腳本（與 package.json 中 tesseract.js@7 對齊） */
const TESSERACT_VERSION = '7.0.0';
const WORKER_PATH = `https://cdn.jsdelivr.net/npm/tesseract.js@v${TESSERACT_VERSION}/dist/worker.min.js`;

/** 繁體中文訓練資料 CDN */
const LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0';

/** Worker 選項 — readwrite 快取確保 chi_tra 僅下載一次 */
const WORKER_OPTIONS = {
  workerPath: WORKER_PATH,
  langPath: LANG_PATH,
  cacheMethod: 'readwrite',
  gzip: false,
};

/** 模組是否已通過自檢 */
let engineReady = false;

/** Singleton Worker 實例 — 整個 SPA 生命週期共用 */
let singletonWorker = null;

/** Worker 初始化 Promise — 防止並發重複建立 */
let workerInitPromise = null;

/**
 * 取得（或建立）全域 Singleton Tesseract Worker
 * @returns {Promise<import('tesseract.js').Worker>}
 */
async function getSingletonWorker(onProgress) {
  if (singletonWorker) return singletonWorker;

  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      if (typeof window === 'undefined') {
        throw new Error('Tesseract OCR 僅能在瀏覽器前端運行');
      }

      const worker = await createWorker(OCR_LANG, 1, {
        ...WORKER_OPTIONS,
        logger: (message) => {
          if (typeof onProgress !== 'function') return;
          if (message.status === 'recognizing text') {
            onProgress(message.progress ?? 0);
          }
          if (message.status === 'loading tesseract core') {
            onProgress(0.02);
          }
          if (message.status === 'initializing tesseract') {
            onProgress(0.05);
          }
          if (message.status === 'loading language traineddata') {
            onProgress(0.08 + (message.progress ?? 0) * 0.12);
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
      });

      singletonWorker = worker;
      engineReady = true;
      return worker;
    })();
  }

  return workerInitPromise;
}

/**
 * 預載 OCR 引擎 — 應用程式初始化 / 模態開啟時呼叫
 * 僅首次會下載 chi_tra；之後從瀏覽器快取瞬間就緒
 * @returns {Promise<boolean>}
 */
export async function preloadTesseractEngine() {
  if (engineReady && singletonWorker) return true;

  try {
    await getSingletonWorker();
    return true;
  } catch (err) {
    workerInitPromise = null;
    singletonWorker = null;
    engineReady = false;

    const msg = String(err?.message ?? err);
    if (/cannot find module|failed to fetch|import/i.test(msg)) {
      const wrapped = new Error(
        '無法載入 tesseract.js 模組。請在專案根目錄執行 npm install tesseract.js，然後重新整理頁面。',
      );
      wrapped.code = 'tesseract_module_not_found';
      wrapped.cause = err;
      throw wrapped;
    }
    throw err;
  }
}

/** Otsu 自動閾值 — 將灰度直方圖分成前景/背景兩類 */
function computeOtsuThreshold(histogram, totalPixels) {
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t += 1) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) ** 2;

    if (varBetween > maxVar) {
      maxVar = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * 純 JS 像素操作 — 灰度化 + Otsu 高對比二值化
 * 輸出「黑字白底」標準 OCR 格式，過濾室內陰影與色偏
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
function grayscaleAndBinarize(imageData) {
  const { data, width, height } = imageData;
  const histogram = new Array(256).fill(0);
  const gray = new Uint8Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const g = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    gray[p] = g;
    histogram[g] += 1;
  }

  const threshold = computeOtsuThreshold(histogram, width * height);

  /** 取四角平均亮度判斷背景明暗 — 統一輸出黑字白底 */
  const cornerIdx = [
    0,
    width - 1,
    (height - 1) * width,
    (height - 1) * width + (width - 1),
  ];
  const cornerAvg = cornerIdx.reduce((s, idx) => s + gray[idx], 0) / cornerIdx.length;
  const lightBackground = cornerAvg >= threshold;

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const isForeground = lightBackground ? gray[p] < threshold : gray[p] > threshold;
    const v = isForeground ? 0 : 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }

  return imageData;
}

/**
 * 圖片前置去噪增強 — 隱藏 Canvas 灰度化 + 二值化 + 放大
 * @param {string} previewUrl — data URL 或 blob URL
 * @returns {Promise<string>}
 */
export async function preprocessImageForOcr(previewUrl) {
  if (!previewUrl || typeof document === 'undefined') return previewUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const longEdge = Math.max(img.width, img.height, 1);
      const scale = Math.min(4, Math.max(2.5, 2400 / longEdge));

      /** 隱藏 Canvas — 不插入 DOM，僅供像素運算 */
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.putImageData(grayscaleAndBinarize(imageData), 0, 0);
      } catch {
        /** canvas tainted — 跳過二值化，仍可使用原圖 */
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(previewUrl);
    img.src = previewUrl;
  });
}

/**
 * 將 Tesseract 回傳的 words 依 Y 座標合併為行
 * @param {Array} words
 * @returns {Array<{ text, confidence, bbox }>}
 */
export function groupWordsIntoLines(words = []) {
  if (!words.length) return [];

  const sorted = [...words]
    .filter((word) => (word.text ?? '').trim())
    .sort((a, b) => (a.bbox?.y0 ?? 0) - (b.bbox?.y0 ?? 0) || (a.bbox?.x0 ?? 0) - (b.bbox?.x0 ?? 0));

  const lines = [];
  let current = null;
  const yThreshold = 18;

  sorted.forEach((word) => {
    const y0 = word.bbox?.y0 ?? 0;
    if (!current || Math.abs(y0 - current.y0) > yThreshold) {
      if (current) {
        lines.push({
          text: current.text,
          confidence: current.conf / current.count,
          bbox: { y0: current.y0, x0: 0, x1: 0, y1: 0 },
        });
      }
      current = { text: word.text, conf: word.confidence ?? 0, count: 1, y0 };
    } else {
      current.text += word.text;
      current.conf += word.confidence ?? 0;
      current.count += 1;
    }
  });

  if (current) {
    lines.push({
      text: current.text,
      confidence: current.conf / current.count,
      bbox: { y0: current.y0, x0: 0, x1: 0, y1: 0 },
    });
  }

  return lines;
}

/**
 * 從 Tesseract 結果擷取行級文字
 * @param {object} data — result.data
 * @returns {Array<{ text, confidence, bbox }>}
 */
export function buildOcrLinesFromResult(data = {}) {
  const fromLines = (data.lines ?? [])
    .map((line) => ({
      text: line.text ?? '',
      confidence: line.confidence ?? 0,
      bbox: line.bbox ?? { y0: 0, x0: 0, x1: 0, y1: 0 },
    }))
    .filter((line) => line.text.trim().length >= 2);

  if (fromLines.length >= 2) return fromLines;

  const fromWords = groupWordsIntoLines(data.words ?? []);
  if (fromWords.length >= 1) return fromWords;

  /** v7 預設僅 text — 以換行切割兜底 */
  const fromText = String(data.text ?? '')
    .split('\n')
    .map((text, index) => ({
      text: text.trim(),
      confidence: 0,
      bbox: { y0: index * 20, x0: 0, x1: 0, y1: 0 },
    }))
    .filter((line) => line.text.length >= 2);

  if (fromText.length >= 1) return fromText;

  return fromLines;
}

/**
 * 詞表圖片 OCR — 瀏覽器備援（雲端 500 時使用）
 * @returns {Promise<string>}
 */
export async function recognizeVocabImageToText(previewUrl, onProgress) {
  const { rawText } = await recognizeImageToText(previewUrl, onProgress);
  return String(rawText ?? '').trim();
}

/**
 * 對單張考卷圖片執行 OCR — 複用 Singleton Worker（不再每次 initialize）
 * @param {string} previewUrl — 圖片 data URL
 * @param {(ratio: number) => void} [onProgress] — 0~1 進度回調
 * @returns {Promise<{ rawText: string, ocrLines: Array }>}
 */
export async function recognizeImageToText(previewUrl, onProgress) {
  await preloadTesseractEngine();

  /** ① Canvas 去噪增強 */
  const enhancedUrl = await preprocessImageForOcr(previewUrl);

  try {
    /** ② 複用已就緒的 Singleton Worker */
    const worker = await getSingletonWorker(onProgress);
    const result = await worker.recognize(enhancedUrl, {}, {
      text: true,
      blocks: true,
    });

    const rawText = result.data?.text ?? '';
    const ocrLines = buildOcrLinesFromResult(result.data ?? {});
    return { rawText, ocrLines };
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (/cannot find module|failed to fetch|import/i.test(msg)) {
      const wrapped = new Error(
        '本機 OCR 引擎載入失敗。請確認已執行 npm install tesseract.js，並重新整理頁面後再試。',
      );
      wrapped.code = 'tesseract_module_not_found';
      wrapped.cause = err;
      throw wrapped;
    }
    throw err;
  }
}

/** 查詢 Singleton Worker 是否已就緒（供 UI 顯示「已解鎖本地加速」） */
export function isTesseractEngineReady() {
  return engineReady && Boolean(singletonWorker);
}
