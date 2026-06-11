/**
 * 前端 Tesseract.js OCR 封裝（僅在瀏覽器運行，不在 Node 後端使用）
 *
 * 崩潰原因修復說明：
 * - 舊版 readingOcrService.js 使用動態 import('tesseract.js') 並取 default，
 *   在 Vite 打包後常出現「Cannot find module 'tesseract.js'」。
 * - 本檔案改為頂部靜態 ESM 引用，由 Vite 正確預打包。
 */

import { recognize as tesseractRecognize } from 'tesseract.js';

/** 香港繁體中文語言包 */
export const OCR_LANG = 'chi_tra';

/** Tesseract Worker 腳本（與 package.json 中 tesseract.js@7 對齊） */
const TESSERACT_VERSION = '7.0.0';
const WORKER_PATH = `https://cdn.jsdelivr.net/npm/tesseract.js@v${TESSERACT_VERSION}/dist/worker.min.js`;

/** 繁體中文訓練資料 CDN */
const LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0';

/** 模組是否已通過自檢 */
let engineReady = false;
let warmupPromise = null;

/**
 * 預載 OCR 引擎（AiUploadModal 開啟時呼叫，避免首次辨識才載入而卡住）
 * @returns {Promise<boolean>}
 */
export async function preloadTesseractEngine() {
  if (engineReady) return true;
  if (typeof window === 'undefined') {
    throw new Error('Tesseract OCR 僅能在瀏覽器前端運行');
  }
  if (typeof tesseractRecognize !== 'function') {
    const err = new Error(
      '無法載入 tesseract.js 模組。請在專案根目錄執行 npm install tesseract.js，然後重新整理頁面。',
    );
    err.code = 'tesseract_module_not_found';
    throw err;
  }

  if (!warmupPromise) {
    warmupPromise = (async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 2, 2);
      const tiny = canvas.toDataURL('image/png');
      await tesseractRecognize(tiny, OCR_LANG, {
        workerPath: WORKER_PATH,
        langPath: LANG_PATH,
      });
      engineReady = true;
    })();
  }

  await warmupPromise;
  return true;
}

/**
 * 圖片預處理：提高對比度與解析度，改善考卷 OCR 準確度
 * @param {string} previewUrl — data URL 或 blob URL
 * @returns {Promise<string>}
 */
export async function preprocessImageForOcr(previewUrl) {
  if (!previewUrl || typeof document === 'undefined') return previewUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(3, Math.max(2, 1800 / Math.max(img.width, img.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.filter = 'contrast(1.4) brightness(1.1) grayscale(1)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
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
 * 對單張考卷圖片執行 OCR（核心入口，等同 Tesseract.recognize(image, 'chi_tra')）
 * @param {string} previewUrl — 圖片 data URL
 * @param {(ratio: number) => void} [onProgress] — 0~1 進度回調
 * @returns {Promise<{ rawText: string, ocrLines: Array }>}
 */
export async function recognizeImageToText(previewUrl, onProgress) {
  await preloadTesseractEngine();

  const enhancedUrl = await preprocessImageForOcr(previewUrl);

  try {
    const result = await tesseractRecognize(enhancedUrl, OCR_LANG, {
      workerPath: WORKER_PATH,
      langPath: LANG_PATH,
      logger: (message) => {
        if (message.status === 'recognizing text' && typeof onProgress === 'function') {
          onProgress(message.progress ?? 0);
        }
        if (message.status === 'loading tesseract core' && typeof onProgress === 'function') {
          onProgress(0.02);
        }
        if (message.status === 'initializing tesseract' && typeof onProgress === 'function') {
          onProgress(0.05);
        }
        if (message.status === 'loading language traineddata' && typeof onProgress === 'function') {
          onProgress(0.08 + (message.progress ?? 0) * 0.12);
        }
      },
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
