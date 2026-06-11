/**
 * 詞表專用 Tesseract OCR — Worker + 前處理（格子字表 / 成語頁）
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preprocessVocabDataUrl } from './vocabImagePrep.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let Tesseract;
try {
  Tesseract = require(path.join(__dirname, '..', 'node_modules', 'tesseract.js'));
} catch {
  try {
    Tesseract = require('tesseract.js');
  } catch {
    Tesseract = null;
  }
}

const OCR_LANG = 'chi_tra';

let vocabWorkerPromise = null;

async function getVocabWorker() {
  if (!Tesseract?.createWorker) return null;
  if (!vocabWorkerPromise) {
    vocabWorkerPromise = (async () => {
      const worker = await Tesseract.createWorker(OCR_LANG);
      await worker.setParameters({
        tessedit_pageseg_mode: '11',
        user_defined_dpi: '300',
        preserve_interword_spaces: '1',
      });
      return worker;
    })();
  }
  return vocabWorkerPromise;
}

/** 詞表圖片 OCR — 前處理 + sparse text 模式 */
export async function recognizeVocabWorksheetDataUrl(imageDataUrl) {
  if (!Tesseract?.createWorker) {
    throw new Error('後端找不到 tesseract.js');
  }
  if (!imageDataUrl || !/^data:image\//i.test(imageDataUrl)) {
    throw new Error('需要有效的圖片 data URL');
  }

  const processedUrl = await preprocessVocabDataUrl(imageDataUrl);
  const worker = await getVocabWorker();

  const { data } = await worker.recognize(processedUrl);

  return String(data?.text ?? '').trim();
}

export function isVocabOcrConfigured() {
  return Boolean(Tesseract?.createWorker);
}

/** POST /api/reading/vocab-vision */
export async function readingVocabOcrHandler(req, res) {
  try {
    if (!isVocabOcrConfigured()) {
      res.status(503).json({
        ok: false,
        code: 'tesseract_module_not_found',
        userMessage: '後端找不到 tesseract.js，請執行 npm install 後重啟伺服器。',
      });
      return;
    }

    const { imageDataUrl, fileName } = req.body ?? {};
    if (!imageDataUrl) {
      res.status(400).json({ error: '缺少 imageDataUrl' });
      return;
    }

    console.log(`[Vocab OCR] 詞表辨識：${fileName ?? '未命名'}`);
    const rawText = await recognizeVocabWorksheetDataUrl(imageDataUrl);

    if (rawText.replace(/\s/g, '').length < 2) {
      res.status(422).json({
        ok: false,
        code: 'image_too_blurry',
        userMessage: '圖片太模糊，無法辨識詞語。請開燈重新拍照，或直接貼上詞表文字。',
        rawText,
      });
      return;
    }

    console.log(`[Vocab OCR] 完成 — ${rawText.replace(/\s/g, '').length} 字`);
    res.json({
      ok: true,
      rawText,
      fileName: fileName ?? null,
      provider: 'tesseract-vocab',
    });
  } catch (err) {
    console.error('[Vocab OCR] 失敗:', err?.message);
    res.status(500).json({
      ok: false,
      error: err?.message || '詞表 OCR 失敗',
      userMessage: err?.message || '詞表 OCR 失敗，請重試或改用貼上文字。',
    });
  }
}
