/**
 * 閱讀理解解析 — 後端 Node.js Tesseract OCR，雲端 API 不可用時改走瀏覽器 OCR 備援
 */

import { parseReadingPageFromOcr } from './readingPageParser';
import { normalizeReadingPayload } from './readingSchema';
import {
  applyDualTrackEngine,
  buildBlurryUploadPayload,
  READING_BLUR_ERROR_CODE,
  READING_BACKEND_UNAVAILABLE_CODE,
} from './readingDualTrackEngine';
import { splitPastedPages } from './readingTextQuality';
import { advancedSanitizeOcrText, assertCleanArticleLines } from './readingAdvancedTextSanitizer';
import { shouldRedirectToVocabUpload } from './vocabOcrParser';
import { generateQuestionsFromOcr } from './generateQuestionsFromOcr';
import {
  analyzeReadingImageWithVision,
  analyzeReadingImagesStitchedWithVision,
  checkReadingVisionAvailable,
} from './readingVisionClient';
import { shouldPreferBrowserOcr } from './ocrRuntimeStrategy.js';

function isBackendOcrFailure(err) {
  const code = err?.code;
  if (code === READING_BACKEND_UNAVAILABLE_CODE || code === 'tesseract_module_not_found') {
    return true;
  }
  const msg = String(err?.message ?? err ?? '');
  return /failed to fetch|networkerror|load failed|後端未連接|後端 OCR API/i.test(msg);
}

function buildParsedFromBrowserOcr(rawText, ocrLines = [], fileName = '校本閱讀', meta = {}) {
  const pageParsed = parseReadingPageFromOcr(ocrLines, rawText);
  const generated = generateQuestionsFromOcr(rawText);
  const { cleanArticleLines } = advancedSanitizeOcrText(rawText);
  const articleLines = assertCleanArticleLines(
    cleanArticleLines.length >= 2 ? cleanArticleLines : pageParsed.passageLines,
  );
  const questions = generated.questions.length >= 3
    ? generated.questions
    : (pageParsed.questions ?? []);

  return buildParsedFromServerResponse({
    rawText,
    articleLines,
    articleTitle: fileName,
    questions,
    qualityOk: articleLines.length >= 2 && questions.length >= 3,
    qualityReason: 'browser_ocr',
    ocrSource: 'browser-tesseract',
    contentTrack: generated.contentTrack,
    coreKeywords: generated.coreKeywords,
    expandedBy: generated.source,
  }, fileName, { ...meta, ocrSource: 'browser-tesseract' });
}

async function extractReadingPageFromImageBrowser(previewUrl, onProgress, fileName) {
  const { recognizeImageToText } = await import('./tesseractOcr');
  const { rawText, ocrLines } = await recognizeImageToText(previewUrl, onProgress);

  if (shouldRedirectToVocabUpload(rawText)) {
    const err = new Error('偵測到默書詞表／詞彙清單，請改用「📷 上載新詞表」，詞彙將同步至課文預習與默書特訓（不會變成閱讀理解題）。');
    err.code = 'vocab_worksheet_misroute';
    throw err;
  }

  const parsed = buildParsedFromBrowserOcr(rawText, ocrLines, fileName ?? '校本閱讀');
  return {
    lines: parsed.articleLines,
    parsed,
    rawText: parsed.rawText || parsed.articleLines.join('\n'),
    source: 'browser-ocr',
  };
}

/** 預載 OCR 引擎 — Vercel／手機直接用本機 Tesseract，桌面 dev 可試雲端 */
export async function preloadReadingOcrEngine() {
  if (shouldPreferBrowserOcr()) {
    try {
      const { preloadTesseractEngine } = await import('./tesseractOcr');
      await preloadTesseractEngine();
      return { mode: 'browser', ready: true };
    } catch {
      return { mode: null, ready: false };
    }
  }

  const backendOk = await checkReadingVisionAvailable(true);
  if (backendOk) {
    import('./tesseractOcr')
      .then(({ preloadTesseractEngine }) => preloadTesseractEngine())
      .catch(() => {});
    return { mode: 'backend', ready: true };
  }

  try {
    const { preloadTesseractEngine } = await import('./tesseractOcr');
    await preloadTesseractEngine();
    return { mode: 'browser', ready: true };
  } catch {
    return { mode: null, ready: false };
  }
}

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
  const pastedRaw = lines.join('\n');
  if (shouldRedirectToVocabUpload(pastedRaw)) {
    const err = new Error('偵測到默書詞表／詞彙清單，請改用「📷 上載新詞表」，詞彙將同步至課文預習與默書特訓（不會變成閱讀理解題）。');
    err.code = 'vocab_worksheet_misroute';
    throw err;
  }

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

/** 單張圖片 — 後端 OCR，失敗時改走瀏覽器 OCR */
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

  if (shouldPreferBrowserOcr()) {
    return extractReadingPageFromImageBrowser(previewUrl, onProgress, fileName);
  }

  try {
    const data = await analyzeReadingImageWithVision({
      imageDataUrl: previewUrl,
      fileName: fileName ?? '校本閱讀',
      onProgress,
    });
    onProgress?.(1);

    const rawText = data.rawText ?? data.articleLines?.join('\n') ?? '';
    if (shouldRedirectToVocabUpload(rawText)) {
      const err = new Error('偵測到默書詞表／詞彙清單，請改用「📷 上載新詞表」，詞彙將同步至課文預習與默書特訓（不會變成閱讀理解題）。');
      err.code = 'vocab_worksheet_misroute';
      throw err;
    }

    const parsed = buildParsedFromServerResponse(data, fileName ?? '校本閱讀');
    return {
      lines: parsed.articleLines,
      parsed,
      rawText: parsed.rawText || parsed.articleLines.join('\n'),
      source: 'server-ocr',
    };
  } catch (err) {
    if (!isBackendOcrFailure(err)) throw err;
  }

  return extractReadingPageFromImageBrowser(previewUrl, onProgress, fileName);
}

/** 多張圖片 — 後端 OCR 合併，失敗時改走瀏覽器逐頁 OCR */
export async function extractReadingStitchedPagesOcr(uploadItems = [], onProgress, onStitchPage) {
  onProgress?.(0.05);

  if (shouldPreferBrowserOcr()) {
    const total = uploadItems.length;
    const mergedTexts = [];
    for (let i = 0; i < total; i += 1) {
      onStitchPage?.(i + 1, total);
      const item = uploadItems[i];
      const page = await extractReadingPageFromImageBrowser(
        item.previewUrl,
        (ratio) => onProgress?.(0.05 + ((i + ratio) / total) * 0.9),
        item.fileName ?? `第${i + 1}頁`,
      );
      if (page.rawText?.trim()) mergedTexts.push(page.rawText.trim());
    }
    onProgress?.(1);
    onStitchPage?.(total, total);
    const mergedText = mergedTexts.join('\n\n');
    const label = uploadItems.map((item) => item.fileName).filter(Boolean).join(' + ')
      || `多頁 OCR（${uploadItems.length} 張）`;
    const parsed = buildParsedFromBrowserOcr(mergedText, [], label, {
      stitched: true,
      imageCount: uploadItems.length,
    });
    return {
      fileName: label,
      lines: parsed.articleLines,
      parsed,
      rawText: parsed.rawText || parsed.articleLines.join('\n'),
      source: 'browser-ocr-stitch',
      qualityOk: parsed.qualityOk,
      qualityReason: parsed.qualityReason,
      passageTitle: parsed.articleTitle,
      articleTitle: parsed.articleTitle,
      stitched: true,
      imageCount: uploadItems.length,
      questionsFromAi: false,
    };
  }

  try {
    const data = await analyzeReadingImagesStitchedWithVision({
      images: uploadItems,
      onProgress,
      onStitchPage,
    });
    onProgress?.(1);

    const rawText = data.rawText ?? data.articleLines?.join('\n') ?? '';
    if (shouldRedirectToVocabUpload(rawText)) {
      const err = new Error('偵測到默書詞表／詞彙清單，請改用「📷 上載新詞表」，詞彙將同步至課文預習與默書特訓（不會變成閱讀理解題）。');
      err.code = 'vocab_worksheet_misroute';
      throw err;
    }

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
  } catch (err) {
    if (!isBackendOcrFailure(err)) throw err;
  }

  const total = uploadItems.length;
  const mergedTexts = [];

  for (let i = 0; i < total; i += 1) {
    onStitchPage?.(i + 1, total);
    const item = uploadItems[i];
    const page = await extractReadingPageFromImageBrowser(
      item.previewUrl,
      (ratio) => onProgress?.(0.05 + ((i + ratio) / total) * 0.9),
      item.fileName ?? `第${i + 1}頁`,
    );
    if (page.rawText?.trim()) mergedTexts.push(page.rawText.trim());
  }

  onProgress?.(1);
  onStitchPage?.(total, total);

  const mergedText = mergedTexts.join('\n\n');
  const label = uploadItems.map((item) => item.fileName).filter(Boolean).join(' + ')
    || `多頁 OCR（${uploadItems.length} 張）`;
  const parsed = buildParsedFromBrowserOcr(mergedText, [], label, {
    stitched: true,
    imageCount: uploadItems.length,
  });

  return {
    fileName: label,
    lines: parsed.articleLines,
    parsed,
    rawText: parsed.rawText || parsed.articleLines.join('\n'),
    source: 'browser-ocr-stitch',
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
      (ocrRatio) => onProgress?.(baseProgress + (ocrRatio * 0.98) / total, stepIndex),
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
