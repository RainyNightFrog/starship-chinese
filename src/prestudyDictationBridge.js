/**
 * 課文預習 ↔ 默書特訓 — 跨板塊詞彙數據橋接
 * ─────────────────────────────────────────────
 * · 預習端：從中央共享 GLOBAL_SHARED_IDIOMS 隨機抽 15 詞，完成後寫入 localStorage
 * · 默書端：讀取快取，100% 鎖定剛溫習詞語並隨機聽寫順序
 */

import { getGlobalSharedIdioms, shuffleGlobalIdiomPool } from './globalSharedPool.js';
import { fisherYatesShuffle } from './questionEngineCore.js';
import { applyVocabDecomposition } from './vocabDecomposition.js';
import { withHints, getVocabHintEn, enrichVocabList } from './vocabHints.js';
import { resolveCustomVocabFromInput } from './customVocabMatcher.js';
import {
  extractPreviewWord,
  extractPreviewMeaning,
  parsePreviewWordsJson,
  sanitizeDisplayText,
  normalizePreviewStorageItem,
} from './previewWordFormat.js';

export {
  getPrestudyCardWord,
  getPrestudyCardMeaning,
  normalizePreviewStorageItem,
  parsePreviewWordsStorage,
} from './previewWordFormat.js';

/** 最近一次溫習完成的詞語（純文字陣列）— 默書特訓直接讀取 */
export const STUDIED_WORDS_STORAGE_KEY = 'starship_last_studied_words';

/** 家長 OCR 上載的詞彙清單（含字卡、拼音、意思）— 課文預習優先讀取 */
export const PREVIEW_WORDS_STORAGE_KEY = 'starship_preview_words';

/** 本次預習 session 的 15 詞（避免刷新重新洗牌） */
const PRESTUDY_SESSION_KEY = 'starship_prestudy_idiom_session';

export const PRESTUDY_IDIOM_COUNT = 15;

function stripHintPrefix(hint) {
  return String(hint ?? '').replace(/^提示：/, '').trim();
}

function vocabItemWordKey(item) {
  return extractPreviewWord(item) || String(item?.idiomWord || item?.tc || '').trim();
}

/** 任意來源 → 課文預習字卡列表（統一正規化） */
export function toPrestudyCardList(rawItems = []) {
  if (!Array.isArray(rawItems) || !rawItems.length) return [];

  const cards = rawItems
    .map((item, index) => {
      const normalized = normalizePreviewStorageItem(item, index);
      if (!normalized) return null;
      return previewWordToVocabItem(normalized, index);
    })
    .filter(Boolean);

  return enrichVocabList(cards);
}

/** 標準化 OCR 上載詞彙 → 課文預習字卡格式 */
export function previewWordToVocabItem(item, index = 0) {
  const normalized = normalizePreviewStorageItem(item, index) ?? item;
  const word = extractPreviewWord(normalized);
  if (!word) return null;

  const meaning = extractPreviewMeaning(normalized) || normalized.meaning || `校本詞語：${word}`;

  return withHints(applyVocabDecomposition({
    id: normalized.id ?? `preview-${word}-${index}`,
    word,
    tc: normalized.tc ?? word,
    sc: normalized.sc ?? word,
    py: normalized.py ?? '',
    jp: normalized.jp ?? '',
    en: normalized.en ?? '',
    radical: normalized.radical,
    body: normalized.body,
    hintTc: meaning,
    hintSc: normalized.hintSc ?? meaning,
    meaning,
    source: normalized.source ?? 'ocr_vocab_upload',
    idiomWord: word,
    isAiExtracted: Boolean(normalized.isAiExtracted ?? item?.isAiExtracted),
  }));
}

/**
 * 家長 OCR 上載完成 — 寫入課文預習 + 默書專用 localStorage
 * starship_preview_words：完整詞彙清單（字卡、拼音、意思）
 * starship_last_studied_words：純文字陣列（默書 Web Speech 朗讀）
 */
export function saveUploadedPreviewWords(vocabItems = []) {
  if (!Array.isArray(vocabItems) || !vocabItems.length) return false;

  /** 若已是 IDIOM 配對物件（含 options），直接寫入；否則先精準配對 */
  const matchedQuestions = vocabItems[0]?.options?.length
    ? vocabItems
    : resolveCustomVocabFromInput(vocabItems).matchedQuestions;

  if (!matchedQuestions.length) return false;

  const cardList = toPrestudyCardList(matchedQuestions);

  try {
    localStorage.setItem(PREVIEW_WORDS_STORAGE_KEY, JSON.stringify(matchedQuestions));
    localStorage.setItem(
      STUDIED_WORDS_STORAGE_KEY,
      JSON.stringify(matchedQuestions.map((item) => extractPreviewWord(item) || item.word)),
    );
    sessionStorage.setItem(PRESTUDY_SESSION_KEY, JSON.stringify(cardList));
    try {
      window.dispatchEvent(new CustomEvent('starship-vocab-uploaded'));
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

/** 課文預習初始化 — 優先讀取家長剛上載的新詞（保留完整 IDIOM 配對物件） */
export function loadPreviewWords() {
  try {
    const raw = localStorage.getItem(PREVIEW_WORDS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = parsePreviewWordsJson(raw);
    if (!parsed.length) return null;

    return toPrestudyCardList(parsed);
  } catch {
    return null;
  }
}

/** 清除上載詞彙快取（可選） */
export function clearUploadedPreviewWords() {
  try {
    localStorage.removeItem(PREVIEW_WORDS_STORAGE_KEY);
    sessionStorage.removeItem(PRESTUDY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** 成語池項目 → 課文預習詞卡格式（預習階段可顯示正確語意） */
export function idiomItemToVocabItem(item) {
  const word = extractPreviewWord(item) || sanitizeDisplayText(item?.word ?? '', 8);
  const correctIdx = Number(item.correctAnswerIndex ?? 0);
  const meaning = extractPreviewMeaning(item)
    || stripHintPrefix(sanitizeDisplayText(item.options?.[correctIdx] ?? ''));
  return withHints(applyVocabDecomposition({
    id: item.id,
    word,
    tc: word,
    sc: word,
    hintTc: meaning,
    hintSc: meaning,
    meaning,
    hint: stripHintPrefix(item.hint),
    en: item.en ?? '',
    source: item.source ?? 'starship_global_idioms',
    idiomWord: word,
    isCommunityShared: Boolean(item.isCommunityShared),
    sharedPoolId: item.sharedPoolId ?? `idiom:${word}`,
  }));
}

/** 從中央共享 GLOBAL_SHARED_IDIOMS 建立本次預習 15 詞（session 內固定） */
export function getPrestudyIdiomVocabList(count = PRESTUDY_IDIOM_COUNT) {
  try {
    const cached = sessionStorage.getItem(PRESTUDY_SESSION_KEY);
    if (cached) {
      const parsed = parsePreviewWordsJson(cached);
      if (parsed.length) {
        const cards = toPrestudyCardList(parsed);
        if (cards.length) return cards;
      }
    }
  } catch {
    /* 快取損壞 → 重建 */
  }

  const pool = shuffleGlobalIdiomPool(Date.now());
  const picked = pool.slice(
    0,
    Math.min(count, pool.length),
  );
  const vocabList = picked.map(idiomItemToVocabItem);

  try {
    sessionStorage.setItem(PRESTUDY_SESSION_KEY, JSON.stringify(vocabList));
  } catch {
    /* ignore */
  }

  return vocabList;
}

/** 重置預習 session（可選：換一批新詞） */
export function resetPrestudyIdiomSession() {
  try {
    sessionStorage.removeItem(PRESTUDY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function persistPrestudySession(list) {
  try {
    sessionStorage.setItem(PRESTUDY_SESSION_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/**
 * 轉換單一預習詞語 — 太難或已讀過時換成池中另一詞
 * @returns {{ swapped: boolean, list: object[], oldId?: string, newItem?: object, reason?: string }}
 */
export function swapPrestudyVocab(vocabId, currentList, { persistSession = true } = {}) {
  if (!Array.isArray(currentList) || !currentList.length) {
    return { swapped: false, list: currentList ?? [], reason: 'empty' };
  }

  const index = currentList.findIndex((v) => String(v.id) === String(vocabId));
  if (index < 0) return { swapped: false, list: currentList, reason: 'not_found' };

  const usedWords = new Set(
    currentList.map(vocabItemWordKey).filter(Boolean),
  );

  const pool = shuffleGlobalIdiomPool(Date.now());
  const replacement = pool.find((item) => item?.word && !usedWords.has(item.word));
  if (!replacement) {
    return { swapped: false, list: currentList, reason: 'no_replacement' };
  }

  const oldItem = currentList[index];
  const newItem = idiomItemToVocabItem(replacement);
  const newList = [...currentList];
  newList[index] = newItem;

  if (persistSession) {
    persistPrestudySession(newList);
  }

  return {
    swapped: true,
    list: newList,
    oldId: String(oldItem.id),
    newItem,
  };
}

/** 預習完成 — 更新默書專用詞語純文字陣列（鎖定剛溫習詞語） */
export function saveStudiedWords(vocabItems) {
  const studiedWords = (vocabItems ?? [])
    .map((item) => vocabItemWordKey(item))
    .filter(Boolean);

  if (!studiedWords.length) return false;

  try {
    localStorage.setItem(STUDIED_WORDS_STORAGE_KEY, JSON.stringify(studiedWords));
    return true;
  } catch {
    return false;
  }
}

/** 默書端讀取 — 回傳詞語純文字陣列或 null */
export function loadStudiedWords() {
  try {
    const raw = localStorage.getItem(STUDIED_WORDS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return parsed
      .map((w) => sanitizeDisplayText(w, 8).replace(/\s/g, ''))
      .filter((w) => /^[\u4e00-\u9fff]{2,8}$/.test(w));
  } catch {
    return null;
  }
}

/** 由純文字陣列還原詞卡，並 Fisher-Yates 隨機聽寫順序 */
export function buildDictationListFromStudiedWords(words) {
  const byWord = new Map(getGlobalSharedIdioms().map((item) => [item.word, item]));

  try {
    const previewRaw = localStorage.getItem(PREVIEW_WORDS_STORAGE_KEY);
    if (previewRaw) {
      parsePreviewWordsJson(previewRaw).forEach((item) => {
        const word = extractPreviewWord(item);
        if (word && !byWord.has(word)) byWord.set(word, item);
      });
    }
  } catch {
    /* ignore */
  }

  const items = words.map((word, index) => {
    const idiom = byWord.get(word);
    if (idiom?.options) return idiomItemToVocabItem(idiom);
    if (idiom?.word || idiom?.tc) return previewWordToVocabItem(idiom, index);
    return withHints({
      id: `linked-dict-${index}`,
      word,
      tc: word,
      sc: word,
      hintTc: word,
      hintSc: word,
      hintEn: getVocabHintEn({ tc: word, sc: word }),
      en: '',
      source: 'prestudy_linked',
      idiomWord: word,
    });
  });

  return fisherYatesShuffle(items);
}

/** 默書輸入比對 — 去除空白後精準比對繁/簡 */
export function normalizeDictationInput(text) {
  return String(text ?? '').trim().replace(/\s+/g, '');
}

export function isDictationAnswerCorrect(input, expectedTc, expectedSc) {
  const normalized = normalizeDictationInput(input);
  if (!normalized) return false;
  const targets = [expectedTc, expectedSc].filter(Boolean).map(normalizeDictationInput);
  return targets.some((t) => t === normalized);
}
