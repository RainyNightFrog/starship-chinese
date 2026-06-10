/**
 * 閱讀理解 — 後端 Node.js Tesseract OCR 服務
 *
 * 【架構說明】
 * - 家長手機上載圖片 → 前端 POST 至本機 Speech API (:3001)
 * - 本檔案以 Tesseract.recognize 辨識繁體中文（chi_tra）
 * - 辨識後呼叫 generateQuestionsFromOcr 動態產出 3–5 道選擇題
 * - 已完全移除 Ollama / localhost:11434 依賴
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateQuestionsFromOcr, denoiseOcrText, normalizeQuestionsArray } from './generateQuestionsFromOcr.js';

/** 圖片太模糊時的錯誤碼（與前端一致） */
const READING_BLUR_ERROR_CODE = 'image_too_blurry';
const READING_BLUR_USER_MESSAGE = '圖片太模糊了，請開燈重新拍照，或者直接使用「貼上文章文字」功能喔！';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** 載入 tesseract.js — 優先 server/node_modules，其次專案根目錄 node_modules */
let Tesseract;
try {
  Tesseract = require(path.join(__dirname, 'node_modules/tesseract.js'));
} catch {
  try {
    Tesseract = require('tesseract.js');
  } catch (loadErr) {
    console.error('[Reading OCR] 無法載入 tesseract.js:', loadErr?.message);
    console.error('[Reading OCR] 請在專案根目錄執行: npm install tesseract.js');
    Tesseract = null;
  }
}

/** 香港繁體中文 OCR 語言包 */
const OCR_LANG = 'chi_tra';

function normalizeQuestionsArrayLocal(raw) {
  return normalizeQuestionsArray(raw);
}

/** 檢查 Tesseract 模組是否可用 */
export function isReadingOcrConfigured() {
  return Boolean(Tesseract?.recognize);
}

/** 單張圖片 OCR — 包裝在 try-catch 內 */
export async function recognizeImageDataUrl(imageDataUrl, onLog) {
  if (!Tesseract?.recognize) {
    const err = new Error('後端找不到 tesseract.js 模組，請執行 npm install tesseract.js');
    err.code = 'tesseract_module_not_found';
    throw err;
  }

  if (!imageDataUrl || !/^data:image\//i.test(imageDataUrl)) {
    throw new Error('需要有效的圖片 data URL');
  }

  try {
    const result = await Tesseract.recognize(imageDataUrl, OCR_LANG, {
      logger: (message) => {
        if (typeof onLog === 'function') onLog(message);
      },
    });
    return denoiseOcrText(result?.data?.text ?? '');
  } catch (err) {
    console.error('[Reading OCR] Tesseract.recognize 失敗:', err?.message);
    const wrapped = new Error(`OCR 辨識失敗：${err?.message || '未知錯誤'}`);
    wrapped.code = 'ocr_recognize_failed';
    wrapped.cause = err;
    throw wrapped;
  }
}

/**
 * OCR 文字 → 標準 parsedData（含 articleLines + questions 陣列）
 * @param {string} ocrText
 * @param {object} meta
 */
export function buildParsedDataFromOcrText(ocrText = '', meta = {}) {
  const cleaned = denoiseOcrText(ocrText);

  /** 完全無文字才視為模糊；極短文本由智能擴寫兜底 */
  if (cleaned.replace(/\s/g, '').length < 2) {
    return {
      ok: false,
      code: READING_BLUR_ERROR_CODE,
      userMessage: READING_BLUR_USER_MESSAGE,
      articleTitle: '',
      articleLines: [],
      passageLines: [],
      questions: [],
      qualityOk: false,
      qualityReason: READING_BLUR_ERROR_CODE,
      ...meta,
    };
  }

  let generated;
  try {
    generated = generateQuestionsFromOcr(cleaned, { seed: Date.now() });
  } catch (genErr) {
    console.error('[Reading OCR] generateQuestionsFromOcr 失敗，重試智能擴寫:', genErr?.message);
    generated = generateQuestionsFromOcr('校園 困難 堅持 溫習', { seed: Date.now() });
  }

  const questions = normalizeQuestionsArrayLocal(generated.questions);
  const articleLines = Array.isArray(generated.articleLines) && generated.articleLines.length >= 2
    ? generated.articleLines
    : generated.articleLines ?? [];

  return {
    ok: questions.length >= 3 && articleLines.length >= 2,
    articleTitle: generated.articleTitle || '校本閱讀',
    articleLines,
    passageLines: articleLines,
    passageTitle: generated.articleTitle || '校本閱讀',
    questions,
    qualityOk: articleLines.length >= 2 && questions.length >= 3,
    qualityReason: 'server_ocr',
    contentTrack: generated.contentTrack ?? 'A',
    coreKeywords: generated.coreKeywords ?? [],
    fromVision: false,
    questionsFromAi: false,
    provider: 'tesseract-node',
    ocrSource: generated.source ?? 'server-ocr',
    rawText: cleaned,
    ...meta,
  };
}

/** 多張圖片依序 OCR 後合併 */
export async function ocrMultipleImages(images = []) {
  const texts = [];
  for (let i = 0; i < images.length; i += 1) {
    const url = images[i]?.imageDataUrl ?? images[i]?.previewUrl;
    const text = await recognizeImageDataUrl(url);
    if (text.trim()) texts.push(text.trim());
  }
  return texts.join('\n\n');
}

/** GET /api/reading/health */
export async function readingOcrHealthHandler(_req, res) {
  try {
    const ready = isReadingOcrConfigured();
    res.json({
      ok: ready,
      provider: ready ? 'tesseract-node' : null,
      model: OCR_LANG,
      local: true,
      message: ready
        ? '後端 Node.js Tesseract OCR 已就緒'
        : '後端缺少 tesseract.js，請執行 npm install tesseract.js',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message });
  }
}

/** POST /api/reading/vision — 單張圖片 OCR（保留舊路由名稱以兼容前端） */
export async function readingOcrSingleHandler(req, res) {
  try {
    if (!isReadingOcrConfigured()) {
      res.status(503).json({
        ok: false,
        code: 'tesseract_module_not_found',
        userMessage: '後端找不到 tesseract.js，請在專案根目錄執行 npm install tesseract.js 後重啟伺服器。',
      });
      return;
    }

    const { imageDataUrl, fileName } = req.body ?? {};
    if (!imageDataUrl) {
      res.status(400).json({ error: '缺少 imageDataUrl' });
      return;
    }

    console.log(`[Reading OCR] 單圖辨識開始：${fileName ?? '未命名'}`);
    const ocrText = await recognizeImageDataUrl(imageDataUrl);
    const parsedData = buildParsedDataFromOcrText(ocrText, { fileName: fileName ?? null });

    if (!parsedData.ok) {
      res.status(422).json(parsedData);
      return;
    }

    console.log(`[Reading OCR] 單圖完成 — 正文 ${parsedData.articleLines.length} 行 · 題目 ${parsedData.questions.length} 道`);
    res.json({ ...parsedData, fileName: fileName ?? null });
  } catch (err) {
    console.error('[Reading OCR] 單圖失敗:', err?.message);
    res.status(500).json({
      ok: false,
      error: err?.message || 'OCR 辨識失敗',
      userMessage: err?.message || 'OCR 辨識失敗，請重試或改用較清晰的圖片。',
      code: err?.code ?? 'ocr_recognize_failed',
    });
  }
}

/** POST /api/reading/vision-stitch — 多張圖片 OCR 合併（保留舊路由名稱） */
export async function readingOcrStitchHandler(req, res) {
  try {
    if (!isReadingOcrConfigured()) {
      res.status(503).json({
        ok: false,
        code: 'tesseract_module_not_found',
        userMessage: '後端找不到 tesseract.js，請在專案根目錄執行 npm install tesseract.js 後重啟伺服器。',
      });
      return;
    }

    const { images = [] } = req.body ?? {};
    if (!Array.isArray(images) || images.length < 1) {
      res.status(400).json({ error: '缺少 images 陣列' });
      return;
    }

    const normalized = images.map((item, order) => ({
      order,
      fileName: item.fileName ?? `第${order + 1}頁`,
      imageDataUrl: item.imageDataUrl ?? item.previewUrl,
    }));

    normalized.forEach((img) => {
      if (!img.imageDataUrl || !/^data:image\//i.test(img.imageDataUrl)) {
        throw new Error(`第 ${img.order + 1} 張圖片缺少有效的 data URL`);
      }
    });

    console.log(`[Reading OCR] 多圖辨識開始：${normalized.length} 張`);
    const mergedText = await ocrMultipleImages(normalized);
    const label = normalized.map((i) => i.fileName).join(' + ');
    const parsedData = buildParsedDataFromOcrText(mergedText, {
      stitched: true,
      imageCount: normalized.length,
      fileName: label,
    });

    if (!parsedData.ok) {
      res.status(422).json(parsedData);
      return;
    }

    console.log(`[Reading OCR] 多圖完成 — 正文 ${parsedData.articleLines.length} 行 · 題目 ${parsedData.questions.length} 道`);
    res.json({
      ...parsedData,
      stitched: true,
      imageCount: normalized.length,
    });
  } catch (err) {
    console.error('[Reading OCR] 多圖失敗:', err?.message);
    res.status(500).json({
      ok: false,
      error: err?.message || '多圖 OCR 辨識失敗',
      userMessage: err?.message || '多圖 OCR 辨識失敗，請重試。',
      code: err?.code ?? 'ocr_recognize_failed',
    });
  }
}

/** 啟動時自檢 */
export function logReadingOcrStatus() {
  if (isReadingOcrConfigured()) {
    console.log(`[Reading OCR] Node.js Tesseract 已就緒 ✓ (${OCR_LANG})`);
  } else {
    console.log('[Reading OCR] ✗ 未找到 tesseract.js — 請執行 npm install tesseract.js');
  }
}
