/**
 * 上載紀錄管理 — 移除圖片、清除全部、依剩餘圖片重新生成
 */

import { createDefaultParentConfig } from './mockData';
import { applyExamPaperUpload } from './examPaperGenerator';
import { applyVocabListUpload } from './vocabListGenerator';
import { applyReadingPaperUpload, parseReadingUploadItems } from './readingPaperGenerator';
import { clearTrackBCache } from './readingTrackBCache';
import { buildUploadSummaryName } from './uploadMetaUtils';
import { clearUploadedPreviewWords } from './prestudyDictationBridge';

export function buildUploadMetaFromImages(images = []) {
  return {
    seed: Date.now(),
    fileCount: images.length,
    fileName: buildUploadSummaryName(images),
    files: images,
    images,
    source: images.length === 1 ? images[0]?.source : 'batch',
    mimeType: images[0]?.mimeType ?? null,
  };
}

/** 清除所有 AI 上載紀錄與生成內容，恢復預設題庫 */
export function clearAllUploads(config) {
  clearTrackBCache();
  clearUploadedPreviewWords();
  const defaults = createDefaultParentConfig();
  return {
    ...config,
    aiAnalysis: null,
    uploadLabel: defaults.uploadLabel,
    assignedContent: {
      ...config.assignedContent,
      vocabByTask: defaults.assignedContent.vocabByTask,
      vocabList: defaults.assignedContent.vocabList,
      quiz: defaults.assignedContent.quiz,
      quizBank: [],
      sspa: defaults.assignedContent.sspa,
      sspaBank: [],
      sentence: defaults.assignedContent.sentence,
      sentenceBank: [],
      reading: defaults.assignedContent.reading,
      readingBank: [],
      readingExtractedPassages: [],
      aiUploadSession: null,
      vocabUploadSession: null,
      readingUploadSession: null,
      uploadImages: [],
      uploadImageCount: 0,
    },
  };
}

/** 依目前仍有效的上載類型，用剩餘圖片重新生成內容 */
async function regenerateFromRemainingImages(config, remainingImages, { wrongWordReminders = [] } = {}) {
  if (!remainingImages.length) return clearAllUploads(config);

  const meta = buildUploadMetaFromImages(remainingImages);
  const ac = config.assignedContent ?? {};
  let next = config;

  if (ac.readingUploadSession) {
    const storedPassages = ac.readingExtractedPassages ?? [];
    const passageByName = new Map(storedPassages.map((item) => [item.fileName, item]));
    meta.extractedPassages = remainingImages.map((img, index) => (
      passageByName.get(img.fileName)
      ?? storedPassages[index]
      ?? { fileName: img.fileName, lines: [], rawText: '', source: 'missing' }
    ));

    const missingOcr = meta.extractedPassages.some((item) => !item.qualityOk && !item.parsed?.qualityOk);
    if (missingOcr) {
      const ocrMeta = await parseReadingUploadItems(remainingImages);
      meta.extractedPassages = ocrMeta.extractedPassages;
    }

    next = applyReadingPaperUpload(next, meta).config;
  }
  if (ac.aiUploadSession) {
    next = applyExamPaperUpload(next, meta).config;
  }
  if (ac.vocabUploadSession) {
    next = applyVocabListUpload(next, meta, wrongWordReminders).config;
  }

  if (!ac.readingUploadSession && !ac.aiUploadSession && !ac.vocabUploadSession) {
    next = {
      ...next,
      assignedContent: {
        ...next.assignedContent,
        uploadImages: remainingImages,
        uploadImageCount: remainingImages.length,
      },
    };
  }

  return next;
}

/** 移除單張已上載圖片，並依剩餘圖片更新生成內容 */
export async function removeUploadImage(config, imageId, options = {}) {
  const ac = config.assignedContent ?? {};
  const remaining = (ac.uploadImages ?? []).filter((img) => img.id !== imageId);
  const remainingPassages = (ac.readingExtractedPassages ?? []).filter((_, index) => {
    const img = ac.uploadImages?.[index];
    return img && img.id !== imageId;
  });
  const nextConfig = {
    ...config,
    assignedContent: {
      ...ac,
      readingExtractedPassages: remainingPassages,
    },
  };
  return regenerateFromRemainingImages(nextConfig, remaining, options);
}
