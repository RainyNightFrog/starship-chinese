/**
 * 詞表 AI 解析與程序化詞彙生成
 * ─────────────────────────────
 * 上載 ➔ OCR 提取純詞彙清單 ➔ localStorage（starship_preview_words / starship_last_studied_words）
 * ➔ 課文預習 + 默書特訓（不走閱讀理解出題）
 */

import { cloneVocab, mergeWrongWordsIntoDictation } from './vocabService';
import { DICTATION_VOCAB_POOL, PRESTUDY_VOCAB_POOL } from './mockDatabase';
import { getUploadImageCount, mergeUploadImagesIntoContent } from './uploadMetaUtils';
import { parseVocabUploadItems } from './vocabOcrService';
import {
  saveUploadedPreviewWords,
  toPrestudyCardList,
  PRESTUDY_IDIOM_COUNT,
} from './prestudyDictationBridge';
import { resolveCustomVocabFromInput } from './customVocabMatcher';

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
  let matchedQuestions = uploadMeta.matchedQuestions ?? [];

  if (uploadMeta.extractedNewWords?.length || uploadMeta.matchedQuestions?.length) {
    /** 精準配對：以家長 OCR/貼上詞語為準，禁止 random 盲抽 */
    if (!matchedQuestions.length) {
      matchedQuestions = uploadMeta.matchedQuestions?.length
        ? uploadMeta.matchedQuestions
        : resolveCustomVocabFromInput(
          uploadMeta.customWordsInput ?? uploadMeta.extractedNewWords,
          { source: uploadMeta.source ?? 'vocab_upload' },
        ).matchedQuestions;
    }
    prestudy = toPrestudyCardList(matchedQuestions);
    dictation = cloneVocab(prestudy);
    if (wrongWordEntries.length) {
      dictation = mergeWrongWordsIntoDictation(dictation, wrongWordEntries);
    }
    saveUploadedPreviewWords(matchedQuestions);
    label = `精準詞表 · ${uploadMeta.fileName ?? '校本默書單'}（${prestudy.length} 詞 · 100% 對接）`;
  } else if (uploadMeta.customWordsInput?.length) {
    const resolved = resolveCustomVocabFromInput(uploadMeta.customWordsInput, {
      source: 'parent_custom_input',
    });
    matchedQuestions = resolved.matchedQuestions;
    prestudy = toPrestudyCardList(matchedQuestions);
    dictation = cloneVocab(prestudy);
    saveUploadedPreviewWords(matchedQuestions);
    label = `自訂詞表 · ${prestudy.length} 詞（精準配對）`;
  } else {
    /** 無 OCR 結果時仍走精準配對（mock 池僅作詞語來源，不 random 渲染） */
    const pack = generateVocabPack({ ...uploadMeta, seed });
    const words = pack.prestudyList.map((v) => v.tc ?? v.word).filter(Boolean);
    const resolved = resolveCustomVocabFromInput(words, { source: 'vocab_pack_seed' });
    matchedQuestions = resolved.matchedQuestions;
    prestudy = toPrestudyCardList(matchedQuestions);
    dictation = cloneVocab(prestudy);
    if (wrongWordEntries.length) {
      dictation = mergeWrongWordsIntoDictation(dictation, wrongWordEntries);
    }
    saveUploadedPreviewWords(matchedQuestions);
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
        matchedQuestions,
        customWordsInput: uploadMeta.customWordsInput ?? matchedQuestions.map((q) => q.word),
      }, uploadMeta),
    },
    pack: {
      prestudyList: prestudy,
      dictationList: dictation,
      matchedQuestions,
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
  galleryMultiLabel: ' · 將逐頁 OCR 合併全部詞語',
  galleryMultiSubLabel: '請確認縮圖順序（1→2→…），再開始詞彙提取',
  gallerySingleSubLabel: '可繼續添加，或開始詞彙提取',
  pasteSuggestLabel: '✨ 建議：直接貼上詞表文字（比拍照 OCR 更準）',
  pastePlaceholder: '每行一個詞語，例如：\n恍然大悟\n並肩作戰\n扣人心弦\n...\n\n（多頁可用 --- 分隔）',
  emptyGalleryHint: '尚未添加圖片，請選擇檔案、拍照，或貼上詞表文字',
  doneMultiSummary: (n) => `已從 ${n} 張默書單提取詞語，同步至課文預習與默書特訓`,
  doneSingleSummary: (n) => `共解析 ${n} 張圖片`,
  parseButtonLabel: '🧠 開始提取詞彙',
};
