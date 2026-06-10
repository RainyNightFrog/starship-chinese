/**
 * 閱讀理解 AI 解析與程序化題目生成（OCR 擷取 + 對應出題）
 */

import { clearTaskHistory } from './questionEngineCore';
import { getUploadImageCount, getDisplayFileLabel, mergeUploadImagesIntoContent } from './uploadMetaUtils';
import { buildOcrFallbackPack, buildReadingPackFromLines, buildReadingPackFromPage } from './readingQuestionBuilder';
import { mapToReadingBankEntry } from './readingSchema';
import { shieldReadingBank } from './readingMismatchShield';

export { parseReadingUploadItems } from './readingOcrService';

export const READING_PARSE_STEPS = [
  { text: 'AI 正在讀取考卷文字（伺服器安全辨識中）...', progress: 10 },
  { text: '連接本機 Node.js OCR 引擎...', progress: 22 },
  { text: 'Tesseract 逐頁辨識繁體中文（chi_tra）...', progress: 40 },
  { text: '清洗雜訊（校名、分數欄、無意義英文）...', progress: 55 },
  { text: '關鍵詞匹配與考點擴寫...', progress: 70 },
  { text: '動態樣版池隨機生成 3–5 道呈分試理解題...', progress: 85 },
  { text: '正在同步至學生端...', progress: 94 },
  { text: '✅ 閱讀理解已同步至學生端', progress: 100 },
];

function buildPackForImage(meta, imageIndex) {
  const files = meta.files ?? meta.images ?? [];
  const fileLabel = getDisplayFileLabel(files[imageIndex]?.fileName, imageIndex);
  const extracted = meta.extractedPassages?.[imageIndex];
  const parsed = extracted?.parsed;

  if (parsed?.articleLines?.length >= 2 || parsed?.passageLines?.length >= 2) {
    return buildReadingPackFromPage(parsed, fileLabel);
  }

  if (parsed?.qualityOk) {
    return buildReadingPackFromPage(parsed, fileLabel);
  }

  if (parsed?.passageLines?.length >= 1 || parsed?.questions?.length >= 1) {
    return buildReadingPackFromPage(parsed, fileLabel);
  }

  if (extracted?.lines?.length >= 1) {
    return buildReadingPackFromLines(extracted.lines, fileLabel);
  }

  return buildOcrFallbackPack(fileLabel, imageIndex, extracted?.qualityReason ?? parsed?.qualityReason);
}

/** 依上載生成閱讀題庫（多圖拼接 = 1 篇文章 × 3–5 題） */
export function generateReadingVariantPack(meta = {}) {
  const seed = meta.seed ?? Date.now();
  const imageCount = getUploadImageCount(meta);
  const isStitched = Boolean(meta.stitched || meta.extractedPassages?.[0]?.stitched);
  const passageCount = isStitched ? 1 : imageCount;
  const readingBank = [];

  for (let i = 0; i < passageCount; i += 1) {
    const pack = buildPackForImage(meta, i);

    pack.questions.forEach((question, qi) => {
      if (!question?.question || !question?.options?.length) return;
      readingBank.push(mapToReadingBankEntry({
        pack: { ...pack, questionsFromAi: pack.questionsFromAi },
        question,
        qi,
        seed,
        passageIndex: i,
        genre: pack.genre,
        ocrFailed: Boolean(pack.ocrFailed),
        passageQuestionTotal: pack.questions.length,
      }));
    });
  }

  const shieldedBank = shieldReadingBank(readingBank);

  return {
    readingBank: shieldedBank,
    passageTitle: shieldedBank[0]?.passageTitle ?? '校本閱讀',
    questionCount: shieldedBank.length,
    imageCount,
    passageCount,
    stitched: isStitched,
  };
}

/** 套用閱讀上載結果至 parentConfig */
export function applyReadingPaperUpload(currentConfig, uploadMeta = {}) {
  const seed = uploadMeta.seed ?? Date.now();
  const variants = generateReadingVariantPack({ ...uploadMeta, seed });
  const firstQuestion = variants.readingBank[0] ?? null;

  clearTaskHistory('reading');

  return {
    config: {
      ...currentConfig,
      activeTask: 'reading',
      uploadLabel: `AI 閱讀 · ${uploadMeta.fileName ?? '校本上載'}`,
      assignedContent: mergeUploadImagesIntoContent({
        ...currentConfig.assignedContent,
        readingUploadSession: seed,
        readingBank: variants.readingBank,
        readingExtractedPassages: uploadMeta.extractedPassages ?? [],
        reading: firstQuestion
          ? {
              passage: [...firstQuestion.passage],
              question: firstQuestion.question,
              options: [...firstQuestion.options],
              correctIndex: firstQuestion.correctIndex,
              hint: firstQuestion.hint,
            }
          : currentConfig.assignedContent?.reading,
      }, uploadMeta),
    },
    variants,
  };
}
