/**
 * 閱讀理解解析 — 前端上載 → 後端 Node.js Tesseract OCR → 純 JS 考點擴寫
 * OCR 在 server/readingOcr.js 執行；前端不再載入 tesseract.js
 */

import { parseReadingPageFromOcr } from './readingPageParser';
import { normalizeReadingPayload } from './readingSchema';
import {
  applyDualTrackEngine,
  buildBlurryUploadPayload,
  READING_BLUR_ERROR_CODE,
} from './readingDualTrackEngine';
import { splitPastedPages } from './readingTextQuality';
import { advancedSanitizeOcrText, assertCleanArticleLines } from './readingAdvancedTextSanitizer';
import { generateQuestionsFromOcr } from './generateQuestionsFromOcr';
import {
  analyzeReadingImageWithVision,
  analyzeReadingImagesStitchedWithVision,
} from './readingVisionClient';

function buildParsedFromServerResponse(data = {}, fileName = '校本閱讀', meta = {}) {
  const rawText = data.rawText ?? '';
  const rawLines = data.articleLines ?? data.passageLines ?? [];
  const { cleanArticleLines } = advancedSanitizeOcrText(rawText || rawLines.join('\n'));
  const articleLines = assertCleanArticleLines(
    cleanArticleLines.length >= 2 ? cleanArticleLines : rawLines,
  );
  const questions = Array.isArray(data.questions) ? data.questions : [];

  const dual = applyDualTrackEngine(
    {
      articleTitle: data.articleTitle ?? fileName,
      articleLines,
      contentTrack: data.contentTrack,
      coreKeywords: data.coreKeywords ?? [],
      questions,
    },
    { rawLines: rawLines, rawText: rawText || articleLines.join('\n') },
  );

  return {
    articleTitle: dual.articleTitle ?? data.articleTitle ?? fileName,
    articleLines: dual.articleLines,
    passageTitle: dual.articleTitle ?? data.articleTitle ?? fileName,
    passageLines: dual.articleLines,
    questions,
    qualityOk: Boolean(data.qualityOk ?? (dual.articleLines.length >= 2 && questions.length >= 3)),
    qualityReason: data.qualityReason ?? 'server_ocr',
    fromVision: false,
    questionsFromAi: false,
    contentTrack: data.contentTrack ?? dual.contentTrack,
    coreKeywords: data.coreKeywords ?? dual.coreKeywords ?? [],
    expandedBy: data.expandedBy ?? 'server_ocr',
    rawFragments: dual.articleLines,
    rawText: data.rawText ?? '',
    ocrSource: data.ocrSource ?? 'server-node',
    ...meta,
  };
}

function buildExtractedFromPastedLines(lines = [], fileName = '貼上文章') {
  const normalized = normalizeReadingPayload({
    articleTitle: fileName,
    articleLines: lines,
    questions: [],
  });
  const rawText = normalized.articleLines.join('\n');
  const sortedLines = normalized.articleLines.map((text, index) => ({
    text: text.replace(/\s+/g, ''),
    confidence: 100,
    bbox: { y0: index * 20, x0: 0, x1: 0, y1: 0 },
  }));
  const parsed = parseReadingPageFromOcr(sortedLines, rawText);
  const merged = normalizeReadingPayload({
    articleTitle: fileName,
    articleLines: parsed.passageLines.length >= 2 ? parsed.passageLines : normalized.articleLines,
    questions: parsed.questions ?? [],
  });
  const generated = generateQuestionsFromOcr(rawText);
  const qualityOk = merged.articleLines.length >= 2;

  return {
    fileName,
    lines: merged.articleLines,
    parsed: {
      ...parsed,
      articleTitle: merged.articleTitle,
      articleLines: merged.articleLines,
      passageTitle: merged.articleTitle,
      passageLines: merged.articleLines,
      questions: generated.questions.length >= 3 ? generated.questions : (parsed.questions ?? []),
      qualityOk,
      qualityReason: qualityOk ? 'pasted_text' : 'passage_too_short',
      fromVision: false,
      questionsFromAi: false,
      contentTrack: generated.contentTrack,
    },
    rawText,
    source: 'pasted',
    qualityOk,
    qualityReason: qualityOk ? 'pasted_text' : 'passage_too_short',
  };
}

/** 單張圖片 — 後端 OCR */
export async function extractReadingPageFromImage(previewUrl, onProgress, fileName) {
  if (!previewUrl) {
    return {
      lines: [],
      parsed: { articleLines: [], passageLines: [], questions: [], qualityOk: false, qualityReason: 'no_preview' },
      rawText: '',
      source: 'no-preview',
    };
  }

  onProgress?.(0.05);
  const data = await analyzeReadingImageWithVision({
    imageDataUrl: previewUrl,
    fileName: fileName ?? '校本閱讀',
    onProgress,
  });
  onProgress?.(1);

  const parsed = buildParsedFromServerResponse(data, fileName ?? '校本閱讀');

  return {
    lines: parsed.articleLines,
    parsed,
    rawText: parsed.rawText || parsed.articleLines.join('\n'),
    source: 'server-ocr',
  };
}

/** 多張圖片 — 後端 OCR 合併 */
export async function extractReadingStitchedPagesOcr(uploadItems = [], onProgress, onStitchPage) {
  onProgress?.(0.05);
  const data = await analyzeReadingImagesStitchedWithVision({
    images: uploadItems,
    onProgress,
    onStitchPage,
  });
  onProgress?.(1);

  const label = uploadItems.map((item) => item.fileName).filter(Boolean).join(' + ')
    || `多頁 OCR（${uploadItems.length} 張）`;

  const parsed = buildParsedFromServerResponse(data, label, {
    stitched: true,
    imageCount: uploadItems.length,
  });

  return {
    fileName: label,
    lines: parsed.articleLines,
    parsed,
    rawText: parsed.rawText || parsed.articleLines.join('\n'),
    source: 'server-ocr-stitch',
    qualityOk: parsed.qualityOk,
    qualityReason: parsed.qualityReason,
    passageTitle: parsed.articleTitle,
    articleTitle: parsed.articleTitle,
    stitched: true,
    imageCount: uploadItems.length,
    questionsFromAi: false,
  };
}

/** 閱讀上載模態 — 多圖或單圖走後端 OCR */
export async function parseReadingUploadItems(uploadItems = [], {
  onProgress,
  onStitchPage,
  steps = [],
  pastedPassageText = '',
} = {}) {
  const extractedPassages = [];
  const pastedPages = pastedPassageText.trim() ? splitPastedPages(pastedPassageText) : [];
  const items = uploadItems.length
    ? uploadItems
    : [{ fileName: '貼上文章', previewUrl: null, mimeType: 'text/plain', source: 'paste' }];
  const total = items.length || 1;

  const imageItems = items.filter((item) => {
    const isPdf = item.mimeType === 'application/pdf'
      || item.fileName?.toLowerCase().endsWith('.pdf');
    return item.previewUrl && !isPdf;
  });

  if (imageItems.length >= 2 && !pastedPassageText.trim()) {
    onProgress?.(0, 0);
    const stitched = await extractReadingStitchedPagesOcr(
      imageItems,
      (ratio, stepIndex) => onProgress?.(ratio, stepIndex ?? 1),
      onStitchPage,
    );

    if (stitched?.parsed?.qualityReason === READING_BLUR_ERROR_CODE) {
      const err = new Error(buildBlurryUploadPayload().userMessage);
      err.code = READING_BLUR_ERROR_CODE;
      throw err;
    }

    extractedPassages.push({
      fileName: stitched.fileName,
      lines: stitched.lines,
      parsed: stitched.parsed,
      rawText: stitched.rawText,
      source: stitched.source,
      qualityOk: stitched.qualityOk,
      qualityReason: stitched.parsed?.qualityReason,
      stitched: true,
      imageCount: imageItems.length,
    });
    onProgress?.(1, Math.max(0, steps.length - 1));
    return {
      extractedPassages,
      stitched: true,
      questionsFromAi: false,
    };
  }

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const baseProgress = i / total;
    const stepIndex = steps.length
      ? Math.min(steps.length - 1, Math.floor(baseProgress * steps.length))
      : 0;

    onProgress?.(baseProgress, stepIndex);

    const pastedLines = pastedPages[i] ?? pastedPages[0];
    if (pastedLines?.length >= 2) {
      extractedPassages.push(buildExtractedFromPastedLines(
        pastedLines,
        item.fileName ?? `材料${i + 1}`,
      ));
      continue;
    }

    const isPdf = item.mimeType === 'application/pdf'
      || item.fileName?.toLowerCase().endsWith('.pdf');

    if (isPdf || !item.previewUrl) {
      extractedPassages.push({
        fileName: item.fileName ?? `材料${i + 1}`,
        lines: [],
        parsed: {
          articleLines: [],
          passageLines: [],
          questions: [],
          qualityOk: false,
          qualityReason: isPdf ? 'pdf_unsupported' : 'no_preview',
        },
        rawText: '',
        source: isPdf ? 'pdf-unsupported' : 'no-preview',
        qualityOk: false,
      });
      continue;
    }

    const page = await extractReadingPageFromImage(
      item.previewUrl,
      (ocrRatio) => onProgress?.(baseProgress + (ocrRatio * 0.85) / total, stepIndex),
      item.fileName ?? `材料${i + 1}`,
    );

    extractedPassages.push({
      fileName: item.fileName ?? `材料${i + 1}`,
      lines: page.lines,
      parsed: page.parsed,
      rawText: page.rawText,
      source: page.source ?? 'server-ocr',
      qualityOk: page.parsed?.qualityOk,
      qualityReason: page.parsed?.qualityReason,
    });
  }

  onProgress?.(1, Math.max(0, steps.length - 1));
  return { extractedPassages };
}
