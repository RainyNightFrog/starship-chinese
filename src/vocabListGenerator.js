/**
 * 詞表 AI 解析與程序化詞彙生成
 * ─────────────────────────────
 * 上載 ➔ OCR 提取純詞彙清單 ➔ localStorage（starship_preview_words / starship_last_studied_words）
 * ➔ 課文預習 + 默書特訓（不走閱讀理解出題）
 */

import { DICTATION_VOCAB_POOL, PRESTUDY_VOCAB_POOL } from './mockDatabase';
import { cloneVocab, mergeWrongWordsIntoDictation } from './vocabService';
import { getUploadImageCount, mergeUploadImagesIntoContent } from './uploadMetaUtils';
import { parseVocabUploadItems } from './vocabOcrService';
import {
  saveUploadedPreviewWords,
  PRESTUDY_IDIOM_COUNT,
} from './prestudyDictationBridge';

export { parseVocabUploadItems };

export const VOCAB_PARSE_STEPS = [
  { text: '正在掃描默書單版面...', progress: 10 },
  { text: 'OCR 擷取詞語列表...', progress: 25 },
  { text: '辨識部首與字形結構...', progress: 40 },
  { text: '匹配粵語 / 普通話讀音標籤...', progress: 55 },
  { text: '偵測校本重點：成語與易混字...', progress: 68 },
  { text: '打包課文預習詞表（15 詞）...', progress: 80 },
  { text: '同步至默書特訓快取...', progress: 90 },
  { text: '✅ 詞彙庫已同步至學生端', progress: 100 },
];

function shuffleWithSeed(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mergeVocabPools(...pools) {
  const seen = new Set();
  const out = [];
  pools.flat().forEach((v) => {
    if (seen.has(v.tc)) return;
    seen.add(v.tc);
    out.push({ ...v });
  });
  return out;
}

/** 無 OCR 結果時的兜底詞包（mock 池洗牌） */
export function generateVocabPack(meta = {}) {
  const seed = meta.seed ?? Date.now();
  const imageCount = getUploadImageCount(meta);
  const preTarget = Math.min(PRESTUDY_IDIOM_COUNT + (imageCount - 1) * 8, 55);
  const dictTarget = Math.min(10 + (imageCount - 1) * 5, 40);
  const master = mergeVocabPools(DICTATION_VOCAB_POOL, PRESTUDY_VOCAB_POOL);
  const shuffled = shuffleWithSeed(master, seed);

  const prestudyList = shuffled.slice(0, Math.min(preTarget, shuffled.length)).map((v, i) => ({
    ...v,
    word: v.tc,
    id: `ai-pre-${seed}-${i}`,
    isAiExtracted: true,
  }));

  const dictationList = shuffleWithSeed(prestudyList, seed + 1)
    .slice(0, Math.min(dictTarget, prestudyList.length))
    .map((v, i) => ({
      ...v,
      id: `ai-dict-${seed}-${i}`,
      isAiExtracted: true,
    }));

  return {
    prestudyList,
    dictationList,
    seed,
    imageCount,
    label: `AI 詞表 · ${meta.fileName ?? '校本默書單'}`,
  };
}

export function applyVocabListUpload(currentConfig, uploadMeta = {}, wrongWordEntries = []) {
  const seed = uploadMeta.seed ?? Date.now();

  let prestudy;
  let dictation;
  let label;

  if (uploadMeta.extractedNewWords?.length) {
    prestudy = cloneVocab(uploadMeta.extractedNewWords);
    dictation = cloneVocab(prestudy);
    if (wrongWordEntries.length) {
      dictation = mergeWrongWordsIntoDictation(dictation, wrongWordEntries);
    }
    saveUploadedPreviewWords(prestudy);
    label = `OCR 詞表 · ${uploadMeta.fileName ?? '校本默書單'}（${prestudy.length} 詞）`;
  } else {
    const pack = generateVocabPack({ ...uploadMeta, seed });
    dictation = cloneVocab(pack.dictationList);
    if (wrongWordEntries.length) {
      dictation = mergeWrongWordsIntoDictation(dictation, wrongWordEntries);
    }
    prestudy = cloneVocab(pack.prestudyList);
    saveUploadedPreviewWords(prestudy);
    label = pack.label;
  }

  return {
    config: {
      ...currentConfig,
      activeTask: 'prestudy',
      uploadLabel: label,
      assignedContent: mergeUploadImagesIntoContent({
        ...currentConfig.assignedContent,
        vocabByTask: {
          ...(currentConfig.assignedContent?.vocabByTask || {}),
          dictation,
          prestudy,
        },
        vocabList: cloneVocab(prestudy),
        vocabUploadSession: seed,
      }, uploadMeta),
    },
    pack: {
      prestudyList: prestudy,
      dictationList: dictation,
      seed,
      imageCount: uploadMeta.imageCount ?? uploadMeta.fileCount ?? 1,
      label,
      dictationCount: dictation.length,
      prestudyCount: prestudy.length,
    },
  };
}

export const VOCAB_UPLOAD_MODAL_CONFIG = {
  titleId: 'vocab-upload-title',
  title: '📷 上載新詞表',
  subtitle: 'Upload Word List · Tesseract OCR 詞彙提取',
  intro: '請上載默書單、範文詞表照片或 PDF（可一次選多張，最多 12 張）。Tesseract 將提取詞語清單，同步至「課文預習」與「默書特訓」——不會變成閱讀理解選擇題。',
  allowTextPaste: true,
  borderClass: 'border-emerald-500/60',
  previewAlt: '默書單預覽',
  capturePrefix: '默書單拍照',
  parseSteps: VOCAB_PARSE_STEPS,
  parseUploadItems: parseVocabUploadItems,
  useBackendOcr: true,
  parsingLabel: 'Tesseract 詞彙辨識引擎運轉中…',
  parsingSubLabelMulti: '伺服器正在逐頁 OCR 辨識詞表，請勿關閉視窗…',
  doneTitle: '校本詞表已同步至課文預習與默書特訓！',
  doneHint: '請切換至「課文預習」溫習新詞，完成後一鍵前往「默書特訓」聽寫',
};
