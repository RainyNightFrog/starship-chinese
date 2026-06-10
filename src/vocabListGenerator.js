/**
 * 詞表 AI 解析與程序化詞彙生成
 */

import { DICTATION_VOCAB_POOL, PRESTUDY_VOCAB_POOL } from './mockDatabase';
import { cloneVocab, mergeWrongWordsIntoDictation } from './vocabService';
import { getUploadImageCount, mergeUploadImagesIntoContent } from './uploadMetaUtils';

export const VOCAB_PARSE_STEPS = [
  { text: '正在掃描默書單版面...', progress: 10 },
  { text: 'OCR 擷取詞語列表...', progress: 25 },
  { text: '辨識部首與字形結構...', progress: 40 },
  { text: '匹配粵語 / 普通話讀音標籤...', progress: 55 },
  { text: '偵測校本重點：成語與易混字...', progress: 68 },
  { text: '分配默書特訓詞表（10 詞）...', progress: 80 },
  { text: '分配課文預習詞表（15 詞）...', progress: 90 },
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

export function generateVocabPack(meta = {}) {
  const seed = meta.seed ?? Date.now();
  const imageCount = getUploadImageCount(meta);
  const dictTarget = Math.min(10 + (imageCount - 1) * 5, 40);
  const preTarget = Math.min(15 + (imageCount - 1) * 8, 55);
  const master = mergeVocabPools(DICTATION_VOCAB_POOL, PRESTUDY_VOCAB_POOL);
  const shuffled = shuffleWithSeed(master, seed);

  const prestudyList = shuffled.slice(0, Math.min(preTarget, shuffled.length)).map((v, i) => ({
    ...v,
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
  const pack = generateVocabPack({ ...uploadMeta, seed });

  let dictation = cloneVocab(pack.dictationList);
  if (wrongWordEntries.length) {
    dictation = mergeWrongWordsIntoDictation(dictation, wrongWordEntries);
  }

  const prestudy = cloneVocab(pack.prestudyList);

  return {
    config: {
      ...currentConfig,
      activeTask: 'dictation',
      uploadLabel: pack.label,
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
      ...pack,
      dictationCount: dictation.length,
      prestudyCount: prestudy.length,
    },
  };
}

export const VOCAB_UPLOAD_MODAL_CONFIG = {
  titleId: 'vocab-upload-title',
  title: '📷 上載新詞表',
  subtitle: 'Upload Word List · AI OCR 詞彙提取',
  intro: '請上載默書單、範文詞表照片或 PDF（可一次選多張，最多 12 張）。AI 將依圖片數量提取更多詞彙，同步至「默書特訓」與「課文預習」。',
  borderClass: 'border-emerald-500/60',
  previewAlt: '默書單預覽',
  capturePrefix: '默書單拍照',
  parseSteps: VOCAB_PARSE_STEPS,
  parsingLabel: 'AI 詞彙辨識引擎運轉中…',
  doneTitle: '校本詞表已同步至學生端！',
  doneHint: '請在上方工作區開始「默書特訓」或「課文預習」· 圖片越多，詞彙越多',
};
