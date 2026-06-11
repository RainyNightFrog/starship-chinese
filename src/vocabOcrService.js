/**
 * 詞表上載 OCR — 後端 Tesseract 辨識 → 純詞彙清單（不走閱讀理解出題）
 * 多張圖片採「逐頁 OCR」避免一次 POST 超過 body 上限（8+ 張默書單常見）
 */

import { recognizeVocabImageText } from './readingVisionClient.js';
import { parseVocabFromOcrText } from './vocabOcrParser.js';
import { PRESTUDY_IDIOM_COUNT } from './prestudyDictationBridge.js';

/** 詞表 OCR 去噪 — 不剝除「小學」等標題用字（閱讀理解 SCHOOL_NOISE 會誤傷詞表） */
function denoiseVocabOcrText(ocrText = '') {
  return String(ocrText ?? '')
    .replace(/\r/g, '\n')
    .replace(/\(\s*\d+\s*分\s*\)/g, ' ')
    .replace(/_{2,}|…{2,}|\.{4,}/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function resolveMaxWords(imageCount = 1) {
  /** 多頁字詞表：按頁提取，課文預習仍優先前 15 詞 */
  return Math.min(PRESTUDY_IDIOM_COUNT + Math.max(0, imageCount - 1) * 8, 48);
}

function assertMinVocabWords(matchedQuestions, imageCount = 1) {
  const min = imageCount >= 2 ? 5 : 3;
  if (matchedQuestions.length < min) {
    throw new Error(
      `只辨識到 ${matchedQuestions.length} 個詞語（至少需要 ${min} 個）。`
      + '建議直接貼上詞表文字（每行一詞），或重新拍照確保標題與詞語清晰。',
    );
  }
}

function packVocabOcrResult(matchedQuestions, extra = {}) {
  const customWordsInput = matchedQuestions.map((q) => q.word);
  return {
    extractedNewWords: matchedQuestions,
    matchedQuestions,
    customWordsInput,
    ...extra,
  };
}

async function ocrSingleImage(previewUrl, fileName, onProgress) {
  const rawText = await recognizeVocabImageText({
    imageDataUrl: previewUrl,
    fileName: fileName ?? '默書單',
    onProgress,
  });
  return denoiseVocabOcrText(rawText);
}

/** 多張詞表 — 逐頁 OCR 後合併文字（不一次上傳全部 base64） */
async function ocrMultipleImagesSequential(imageItems, onProgress, onStitchPage) {
  const texts = [];
  const total = imageItems.length;

  for (let i = 0; i < total; i += 1) {
    onStitchPage?.(i + 1, total);
    const base = i / total;
    const text = await ocrSingleImage(
      imageItems[i].previewUrl,
      imageItems[i].fileName ?? `第${i + 1}頁`,
      (ratio) => onProgress?.(base + (ratio / total) * 0.95),
    );
    if (text.trim()) texts.push(text.trim());
  }

  return texts.join('\n\n');
}

/**
 * 詞表上載模態 — 多圖或單圖 OCR，回傳 extractedNewWords（非閱讀理解題）
 */
export async function parseVocabUploadItems(uploadItems = [], {
  onProgress,
  onStitchPage,
  steps = [],
  pastedPassageText = '',
} = {}) {
  const pasted = pastedPassageText.trim();
  if (pasted) {
    onProgress?.(0.5, 1);
    const matchedQuestions = parseVocabFromOcrText(pasted, {
      maxWords: PRESTUDY_IDIOM_COUNT,
      minWords: 1,
    });
    onProgress?.(1, Math.max(0, steps.length - 1));
    return packVocabOcrResult(matchedQuestions, { rawText: pasted, source: 'pasted' });
  }

  const imageItems = uploadItems.filter((item) => {
    const isPdf = item.mimeType === 'application/pdf'
      || item.fileName?.toLowerCase().endsWith('.pdf');
    return item.previewUrl && !isPdf;
  });

  if (!imageItems.length) {
    throw new Error('請上載默書單或詞表圖片（PDF 請改用 JPG/PNG 拍照）。');
  }

  onProgress?.(0, 0);
  let rawText = '';

  if (imageItems.length >= 2) {
    rawText = await ocrMultipleImagesSequential(
      imageItems,
      (ratio, stepIndex) => onProgress?.(ratio, stepIndex ?? 1),
      onStitchPage,
    );
  } else {
    rawText = await ocrSingleImage(
      imageItems[0].previewUrl,
      imageItems[0].fileName,
      (ratio) => onProgress?.(ratio * 0.9, 1),
    );
  }

  if (!rawText.replace(/\s/g, '').length) {
    throw new Error('圖片太模糊，無法辨識詞語。請開燈重新拍照，或直接貼上詞表文字。');
  }

  onProgress?.(0.92, steps.length ? steps.length - 2 : 0);
  const matchedQuestions = parseVocabFromOcrText(rawText, {
    maxWords: resolveMaxWords(imageItems.length),
    imageCount: imageItems.length,
    minWords: imageItems.length >= 2 ? 5 : 3,
  });

  if (!matchedQuestions.length) {
    throw new Error('未能從圖片中提取詞語，請確認上載的是默書單或詞表，並確保文字清晰。');
  }

  assertMinVocabWords(matchedQuestions, imageItems.length);

  onProgress?.(1, Math.max(0, steps.length - 1));
  return packVocabOcrResult(matchedQuestions, {
    rawText,
    source: imageItems.length >= 2 ? 'server-ocr-sequential' : 'server-ocr',
    imageCount: imageItems.length,
  });
}
