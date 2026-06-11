/**
 * 課文預習詞彙 — 儲存格式正規化與 UI 安全文字提取
 * 禁止將 JSON 物件或 `[{"id"...` 原始字串渲染到字卡
 */

import { toTraditionalVocabWord } from './vocabWordNormalize.js';

const JSON_BLOB_PATTERN = /^\s*[\[{]/;
const JSON_KEY_LEAK = /"id"\s*:|"options"\s*:|"correctAnswerIndex"/;

/** 是否像誤存入的 JSON 原始碼 */
export function looksLikeJsonLeak(text = '') {
  const s = String(text ?? '').trim();
  if (!s) return false;
  if (JSON_BLOB_PATTERN.test(s) && s.length > 24) return true;
  if (JSON_KEY_LEAK.test(s)) return true;
  return false;
}

/**
 * 將任意值轉為可顯示的純文字（絕不返回物件／陣列）
 */
export function sanitizeDisplayText(value, maxLen = 240) {
  if (value == null || value === '') return '';

  if (typeof value === 'object') {
    if (Array.isArray(value.options) && value.options.length) {
      const idx = Math.min(
        value.options.length - 1,
        Math.max(0, Number(value.correctAnswerIndex ?? 0)),
      );
      return sanitizeDisplayText(value.options[idx], maxLen);
    }
    if (typeof value.meaning === 'string') return sanitizeDisplayText(value.meaning, maxLen);
    if (typeof value.word === 'string') return sanitizeDisplayText(value.word, maxLen);
    if (typeof value.tc === 'string') return sanitizeDisplayText(value.tc, maxLen);
    return '';
  }

  let text = String(value).trim();
  if (!text) return '';

  if (looksLikeJsonLeak(text)) {
    try {
      const parsed = JSON.parse(text);
      return sanitizeDisplayText(parsed, maxLen);
    } catch {
      return '';
    }
  }

  return text.replace(/\s+/g, ' ').slice(0, maxLen);
}

function stripHintPrefix(hint) {
  return String(hint ?? '').replace(/^提示：/, '').trim();
}

/** 從任意來源物件提取繁體詞語（2–8 字） */
export function extractPreviewWord(item) {
  if (item == null) return '';

  if (typeof item === 'string') {
    const text = sanitizeDisplayText(item, 8).replace(/\s/g, '');
    return /^[\u4e00-\u9fff]{2,8}$/.test(text) ? toTraditionalVocabWord(text) : '';
  }

  if (typeof item !== 'object') return '';

  const candidates = [item.word, item.idiomWord, item.tc, item.sc];

  for (const c of candidates) {
    const text = sanitizeDisplayText(c, 8).replace(/\s/g, '');
    if (/^[\u4e00-\u9fff]{2,8}$/.test(text) && !looksLikeJsonLeak(text)) {
      return toTraditionalVocabWord(text);
    }
  }

  return '';
}

/** 從任意來源物件提取乾淨字義（含 options[correctAnswerIndex]） */
export function extractPreviewMeaning(item) {
  if (item == null) return '';

  if (typeof item === 'string') {
    if (looksLikeJsonLeak(item)) return '';
    return stripHintPrefix(sanitizeDisplayText(item));
  }

  if (typeof item !== 'object') return '';

  if (typeof item.meaning === 'string' && item.meaning.trim()) {
    const m = stripHintPrefix(sanitizeDisplayText(item.meaning));
    if (m && !looksLikeJsonLeak(m)) return m;
  }

  if (Array.isArray(item.options) && item.options.length) {
    const idx = Math.min(
      item.options.length - 1,
      Math.max(0, Number(item.correctAnswerIndex ?? 0)),
    );
    const fromOpt = stripHintPrefix(sanitizeDisplayText(item.options[idx]));
    if (fromOpt && !looksLikeJsonLeak(fromOpt)) return fromOpt;
  }

  const fallbacks = [item.hintTc, item.hintSc, item.hint, item.hintEn, item.en];
  for (const fb of fallbacks) {
    const m = stripHintPrefix(sanitizeDisplayText(fb));
    if (m && !looksLikeJsonLeak(m) && m.length >= 2) return m;
  }

  return '';
}

/** 字卡標題 — 固定綁定 item.word（絕不渲染 JSON 裸字串） */
export function resolveIdiomCardWord(item) {
  if (item == null) return '';

  if (typeof item === 'string') {
    if (looksLikeJsonLeak(item)) {
      try {
        const parsed = JSON.parse(item);
        return resolveIdiomCardWord(parsed);
      } catch {
        return '';
      }
    }
    const text = item.trim().replace(/\s/g, '');
    return /^[\u4e00-\u9fff]{2,8}$/.test(text) ? text : '';
  }

  if (typeof item !== 'object') return '';

  const word = String(item.word ?? '').trim().replace(/\s/g, '');
  if (word && /^[\u4e00-\u9fff]{2,8}$/.test(word) && !looksLikeJsonLeak(word)) {
    return word;
  }

  return extractPreviewWord(item);
}

/** 字卡解釋 — 固定綁定 options[correctAnswerIndex] 或 meaning */
export function resolveIdiomCardMeaning(item) {
  if (item == null) return '';

  if (typeof item === 'string') {
    if (looksLikeJsonLeak(item)) {
      try {
        return resolveIdiomCardMeaning(JSON.parse(item));
      } catch {
        return '';
      }
    }
    return stripHintPrefix(sanitizeDisplayText(item));
  }

  if (typeof item !== 'object') return '';

  if (Array.isArray(item.options) && item.options.length) {
    const idx = Math.min(
      item.options.length - 1,
      Math.max(0, Number(item.correctAnswerIndex ?? 0)),
    );
    const fromOpt = stripHintPrefix(String(item.options[idx] ?? '').trim());
    if (fromOpt && !looksLikeJsonLeak(fromOpt)) return fromOpt;
  }

  if (typeof item.meaning === 'string' && item.meaning.trim()) {
    const m = stripHintPrefix(sanitizeDisplayText(item.meaning));
    if (m && !looksLikeJsonLeak(m)) return m;
  }

  return extractPreviewMeaning(item);
}

/** 默書專用 — 安全解析 starship_last_studied_words 為純中文詞語陣列 */
export function parseStudiedWordsJson(raw) {
  if (raw == null || raw === '') return [];

  try {
    let parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (typeof entry === 'string') {
          if (looksLikeJsonLeak(entry)) {
            try {
              const obj = JSON.parse(entry);
              return resolveIdiomCardWord(obj);
            } catch {
              return '';
            }
          }
          return entry.trim().replace(/\s/g, '');
        }
        if (entry && typeof entry === 'object') {
          return resolveIdiomCardWord(entry);
        }
        return sanitizeDisplayText(entry, 8).replace(/\s/g, '');
      })
      .filter((w) => /^[\u4e00-\u9fff]{2,8}$/.test(w));
  } catch {
    return [];
  }
}

/**
 * 正規化為 starship_preview_words 標準格式（保留 options 供字卡直接綁定）
 */
export function normalizePreviewStorageItem(item, index = 0) {
  const word = extractPreviewWord(item);
  if (!word) return null;

  let meaning = extractPreviewMeaning(item);
  if (!meaning || meaning === word) {
    meaning = `校本詞語「${word}」— 請熟讀字形與讀音`;
  }

  const py = sanitizeDisplayText(item?.py ?? '', 48);
  const jp = sanitizeDisplayText(item?.jp ?? '', 48);
  const en = sanitizeDisplayText(item?.en ?? item?.hintEn ?? '', 120);

  return {
    word,
    meaning,
    tc: word,
    sc: sanitizeDisplayText(item?.sc ?? word, 8) || word,
    ...(py ? { py } : {}),
    ...(jp ? { jp } : {}),
    ...(en ? { en } : {}),
    id: item?.id ?? `preview-${word}-${index}`,
    source: item?.source ?? 'ocr_vocab_upload',
    ...(Array.isArray(item?.options) && item.options.length
      ? {
        options: item.options.map((opt) => sanitizeDisplayText(opt)),
        correctAnswerIndex: Number(item.correctAnswerIndex ?? 0),
      }
      : {}),
  };
}

/** 安全 JSON.parse — 支援雙重編碼與單物件 */
export function parsePreviewWordsJson(raw) {
  if (raw == null || raw === '') return [];

  try {
    let parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }

    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
    return [];
  } catch {
    return [];
  }
}

/** 解析 localStorage 原始值 → 標準 preview 陣列 */
export function parsePreviewWordsStorage(raw) {
  return parsePreviewWordsJson(raw)
    .map((item, index) => normalizePreviewStorageItem(item, index))
    .filter(Boolean);
}

/** 寫入 localStorage 的精簡格式（僅 word + meaning） */
export function toPreviewStoragePayload(items = []) {
  return items
    .map((item, index) => {
      const n = normalizePreviewStorageItem(item, index);
      return n ? { word: n.word, meaning: n.meaning } : null;
    })
    .filter(Boolean);
}

/** 字卡標題 — 供 React 渲染 */
export function getPrestudyCardWord(vocab, { language, studentType, getVocabChar } = {}) {
  const word = resolveIdiomCardWord(vocab);
  if (word) {
    if (getVocabChar) {
      return getVocabChar({ ...vocab, tc: word, word }, { language, studentType });
    }
    return word;
  }
  return '';
}

/** 字卡解釋 — 供 React 渲染（絕不含 JSON） */
export function getPrestudyCardMeaning(vocab) {
  const meaning = resolveIdiomCardMeaning(vocab);
  if (meaning) return meaning;
  const word = resolveIdiomCardWord(vocab);
  return word ? `校本詞語「${word}」— 請熟讀字形與讀音` : '請聽讀詞語，理解字義';
}
