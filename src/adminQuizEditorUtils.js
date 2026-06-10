/**
 * Admin Quiz Editor — 題庫編輯器工具函式
 * 種子資料、localStorage 持久化、匯出 ADVANCED_QUESTION_POOL 程式碼
 */

import {
  ADVANCED_QUESTION_TEMPLATES,
  QUESTION_CATEGORIES,
} from './readingAdvancedQuestionPool.js';

export const STORAGE_KEY = 'xh-admin-quiz-pool-v1';

/** 題型分類中文標籤 */
export const CATEGORY_LABELS = {
  [QUESTION_CATEGORIES.MAIN_THEME]: '主旨深究題',
  [QUESTION_CATEGORIES.PARAGRAPH_LOGIC]: '段落邏輯／轉折題',
  [QUESTION_CATEGORIES.RHETORIC]: '修辭與表達手法',
  [QUESTION_CATEGORIES.VOCAB_INFERENCE]: '詞彙與深意推論',
  [QUESTION_CATEGORIES.WRITING_TECHNIQUE]: '寫作手法／結構功能（黃金題型）',
  language_knowledge: '語文知識（修辭／成語）',
  punctuation: '標點符號',
  reading_fixed: '固定閱讀理解（真題樣版）',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/** 模擬 build(ctx) 取得樣版預覽題幹 */
const MOCK_CTX = {
  lines: [
    '星期天是爺爺的生日，我們悄悄開了會商量驚喜。',
    '媽媽說會準備草莓蛋糕，我將畫邀請卡邀請親戚。',
    '雖然大家很忙，但爸爸佈置客廳，弟弟負責吹氣球。',
  ],
  keywords: ['爺爺', '生日', '驚喜', '家人'],
  anchors: [
    { lineIndex: 0, text: '星期天是爺爺的生日，我們悄悄開了會商量驚喜。' },
    { lineIndex: 1, text: '媽媽說會準備草莓蛋糕，我將畫邀請卡邀請親戚。' },
    { lineIndex: 2, text: '雖然大家很忙，但爸爸佈置客廳，弟弟負責吹氣球。' },
  ],
  rng: () => 0.42,
  randInt: (n) => Math.min(1, Math.max(0, n - 1)),
};

/** 從引擎樣版池建立可編輯種子 */
export function buildSeedFromEngineTemplates() {
  return ADVANCED_QUESTION_TEMPLATES.map((tpl) => {
    let built = null;
    try {
      built = tpl.build(MOCK_CTX);
    } catch {
      built = null;
    }

    const correct = built?.correct ?? '（請填寫正確答案）';
    const hasStructured = built?.structuredOptions?.length === 4;
    const hasFixed = built?.fixedOptions?.length === 4;
    const distractors = [
      '主角感到十分沮喪，不願面對現實',
      '記述了一段令人深思的經歷',
      '與文章基調相反，故意曲解作者',
    ];

    const options = hasStructured
      ? [...built.structuredOptions]
      : hasFixed
        ? [...built.fixedOptions]
        : [correct, ...distractors].slice(0, 4);
    while (options.length < 4) options.push(`干擾項 ${String.fromCharCode(65 + options.length)}`);

    const correctIdx = hasStructured
      ? (built.fixedCorrectIndex ?? 0)
      : hasFixed
        ? (built.fixedCorrectIndex ?? 0)
        : 0;

    return {
      id: tpl.id,
      category: tpl.category,
      questionText: built?.questionText ?? tpl.id,
      options,
      correctAnswerIndex: correctIdx,
      hint: built?.hint ?? '請對照原文理解文意。',
      trapProfile: built?.trapProfile ?? 'theme',
      source: 'engine',
    };
  });
}

export function createEmptyTemplate(index = 0) {
  const n = String(index + 1).padStart(3, '0');
  return {
    id: `custom_${n}`,
    category: QUESTION_CATEGORIES.MAIN_THEME,
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    hint: '',
    trapProfile: 'theme',
    source: 'custom',
  };
}

export function loadTemplatesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map(normalizeTemplate);
  } catch {
    return null;
  }
}

export function saveTemplatesToStorage(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function normalizeTemplate(raw = {}) {
  const options = Array.isArray(raw.options) ? [...raw.options] : ['', '', '', ''];
  while (options.length < 4) options.push('');
  return {
    id: String(raw.id ?? `custom_${Date.now()}`),
    category: raw.category ?? QUESTION_CATEGORIES.MAIN_THEME,
    questionText: String(raw.questionText ?? ''),
    options: options.slice(0, 4).map((o) => String(o ?? '')),
    correctAnswerIndex: Math.min(3, Math.max(0, Number(raw.correctAnswerIndex) || 0)),
    hint: String(raw.hint ?? ''),
    trapProfile: String(raw.trapProfile ?? 'theme'),
    source: raw.source ?? 'custom',
  };
}

/** 將編輯器題庫格式化為可貼上的 JS 模組 */
export function generatePoolExportCode(templates = []) {
  const stamp = new Date().toLocaleString('zh-HK', { hour12: false });
  const items = templates.map((t) => {
    const opts = t.options.map((o) => `      ${JSON.stringify(o)}`).join(',\n');
    return `  {
    id: ${JSON.stringify(t.id)},
    category: ${JSON.stringify(t.category)},
    questionText: ${JSON.stringify(t.questionText)},
    options: [
${opts}
    ],
    correctAnswerIndex: ${t.correctAnswerIndex},
    hint: ${JSON.stringify(t.hint ?? '')},
    trapProfile: ${JSON.stringify(t.trapProfile ?? 'theme')},
  }`;
  });

  return `/**
 * 呈分試閱讀理解 — 自訂題庫（Admin Quiz Editor 匯出）
 * 產生時間：${stamp}
 * ─────────────────────────────────────────
 * 使用方式：
 *   1. 在 Cursor 開啟 mockDatabase.js（或新建 readingCustomQuestionPool.js）
 *   2. 全選貼上覆蓋 ADVANCED_QUESTION_POOL 區塊
 *   3. 於 readingDynamicQuestionEngine.js 引入此池（若尚未接入）
 */
export const ADVANCED_QUESTION_POOL = [
${items.join(',\n')}
];
`;
}

/** 決定編輯器初始題庫：localStorage → mockDatabase → 引擎內建樣版 */
export function resolveInitialTemplates(storedPool = []) {
  if (Array.isArray(storedPool) && storedPool.length > 0) {
    return storedPool.map(normalizeTemplate);
  }
  return buildSeedFromEngineTemplates();
}

/**
 * 安全解析貼上的題庫代碼（ADVANCED_QUESTION_POOL 或 JSON 陣列）
 * @returns {{ ok: boolean, items: object[], error: string|null }}
 */
export function parseImportedPoolCode(rawText = '') {
  const trimmed = String(rawText ?? '').trim();
  if (!trimmed) {
    return { ok: false, items: [], error: '內容為空，請貼上題庫代碼。' };
  }

  try {
    // ① 純 JSON 陣列
    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return { ok: false, items: [], error: 'JSON 必須為陣列格式。' };
      }
      const items = parsed.map(normalizeTemplate).filter((t) => t.questionText || t.id);
      return items.length
        ? { ok: true, items, error: null }
        : { ok: false, items: [], error: '陣列為空或格式不正確。' };
    }

    // ② export const ADVANCED_QUESTION_POOL = [ ... ];
    const exportMatch = trimmed.match(
      /(?:export\s+)?(?:const|let|var)\s+ADVANCED_QUESTION_POOL\s*=\s*(\[[\s\S]*\])\s*;?/,
    );
    const arraySource = exportMatch?.[1]
      ?? trimmed.match(/^(\[[\s\S]*\])\s*;?$/)?.[1]
      ?? null;

    if (!arraySource) {
      return {
        ok: false,
        items: [],
        error: '找不到 ADVANCED_QUESTION_POOL 陣列。請貼上完整 export 區塊或 JSON 陣列。',
      };
    }

    // 使用 Function 解析 JS 物件字面量（比 eval 更安全，且有 try-catch 包裹）
    const parsedArray = new Function(`"use strict"; return (${arraySource});`)();
    if (!Array.isArray(parsedArray)) {
      return { ok: false, items: [], error: '解析結果不是陣列。' };
    }

    const items = parsedArray.map(normalizeTemplate).filter((t) => t.id);
    if (!items.length) {
      return { ok: false, items: [], error: '陣列為空，或每筆資料缺少 id。' };
    }
    return { ok: true, items, error: null };
  } catch (err) {
    return {
      ok: false,
      items: [],
      error: `解析失敗：${err?.message ?? '未知錯誤'}。請檢查引號、逗號與括號是否成對。`,
    };
  }
}

/** 將 mockDatabase ADVANCED_QUESTION_POOL 轉為編輯器格式 */
export function templatesFromMockPool(pool = []) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  return pool.map(normalizeTemplate);
}

/** 複製到剪貼簿（含 fallback） */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}
