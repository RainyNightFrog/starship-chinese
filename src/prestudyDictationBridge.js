/**
 * 課文預習 ↔ 默書特訓 — 跨板塊詞彙數據橋接
 * ─────────────────────────────────────────────
 * · 預習端：從 IDIOM_EXAM_POOL 隨機抽 15 詞，完成後寫入 localStorage
 * · 默書端：讀取快取，100% 鎖定剛溫習詞語並隨機聽寫順序
 */

import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { fisherYatesShuffle } from './questionEngineCore.js';
import { applyVocabDecomposition } from './vocabDecomposition.js';

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
  return applyVocabDecomposition({
    id: item.id,
    tc: item.word,
    sc: item.word,
    hintTc: meaning,
    hintSc: meaning,
    hint: stripHintPrefix(item.hint),
    en: '',
    source: 'idiom_exam_pool',
    idiomWord: item.word,
  });
}

/** 從 IDIOM_EXAM_POOL 建立本次預習 15 詞（session 內固定） */
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

  const picked = fisherYatesShuffle([...IDIOM_EXAM_POOL]).slice(
    0,
    Math.min(count, IDIOM_EXAM_POOL.length),
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
  const byWord = new Map(IDIOM_EXAM_POOL.map((item) => [item.word, item]));

  const items = words.map((word, index) => {
    const idiom = byWord.get(word);
    if (idiom) return idiomItemToVocabItem(idiom);
    return {
      id: `linked-dict-${index}`,
      tc: word,
      sc: word,
      hintTc: word,
      hintSc: word,
      en: '',
      source: 'prestudy_linked',
      idiomWord: word,
    };
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
