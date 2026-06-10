/**
 * 課文預習 ↔ 默書特訓 — 跨板塊詞彙數據橋接
 * ─────────────────────────────────────────────
 * · 預習端：從中央共享 GLOBAL_SHARED_IDIOMS 隨機抽 15 詞，完成後寫入 localStorage
 * · 默書端：讀取快取，100% 鎖定剛溫習詞語並隨機聽寫順序
 */

import { getGlobalSharedIdioms, shuffleGlobalIdiomPool } from './globalSharedPool.js';
import { fisherYatesShuffle } from './questionEngineCore.js';
import { applyVocabDecomposition } from './vocabDecomposition.js';
import { withHints, getVocabHintEn } from './vocabHints.js';

/** 最近一次溫習完成的詞語（純文字陣列） */
export const STUDIED_WORDS_STORAGE_KEY = 'starship_last_studied_words';

/** 本次預習 session 的 15 詞（避免刷新重新洗牌） */
const PRESTUDY_SESSION_KEY = 'starship_prestudy_idiom_session';

export const PRESTUDY_IDIOM_COUNT = 15;

function stripHintPrefix(hint) {
  return String(hint ?? '').replace(/^提示：/, '').trim();
}

/** 成語池項目 → 課文預習詞卡格式（預習階段可顯示正確語意） */
export function idiomItemToVocabItem(item) {
  const correctIdx = Number(item.correctAnswerIndex ?? 0);
  const meaning = item.options[correctIdx] ?? '';
  return withHints(applyVocabDecomposition({
    id: item.id,
    tc: item.word,
    sc: item.word,
    hintTc: meaning,
    hintSc: meaning,
    hint: stripHintPrefix(item.hint),
    en: item.en ?? '',
    source: item.source ?? 'starship_global_idioms',
    idiomWord: item.word,
    isCommunityShared: Boolean(item.isCommunityShared),
    sharedPoolId: item.sharedPoolId ?? `idiom:${item.word}`,
  }));
}

/** 從中央共享 GLOBAL_SHARED_IDIOMS 建立本次預習 15 詞（session 內固定） */
export function getPrestudyIdiomVocabList(count = PRESTUDY_IDIOM_COUNT) {
  try {
    const cached = sessionStorage.getItem(PRESTUDY_SESSION_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) return parsed;
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

function vocabItemWordKey(item) {
  return String(item?.idiomWord || item?.tc || item?.word || '').trim();
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

/** 預習完成 — 存入剛溫習的詞語純文字陣列 */
export function saveStudiedWords(vocabItems) {
  const studiedWords = (vocabItems ?? [])
    .map((item) => item?.idiomWord || item?.tc || item?.word)
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
    return parsed.map(String).filter(Boolean);
  } catch {
    return null;
  }
}

/** 由純文字陣列還原詞卡，並 Fisher-Yates 隨機聽寫順序 */
export function buildDictationListFromStudiedWords(words) {
  const byWord = new Map(getGlobalSharedIdioms().map((item) => [item.word, item]));

  const items = words.map((word, index) => {
    const idiom = byWord.get(word);
    if (idiom) return idiomItemToVocabItem(idiom);
    return withHints({
      id: `linked-dict-${index}`,
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
