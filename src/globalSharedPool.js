/**
 * 🌐 全港家長拍照共享題庫 — 中央雲端池（Global Shared DB Pool）
 * ─────────────────────────────────────────────────────────────────
 * · 模擬雲端持久化：localStorage `starship_global_idioms` / `starship_global_methods`
 * · UGC Auto-Ingestor：OCR 清洗後自動掃描、去重、滾雪球擴充
 * · 學生端 Fisher-Yates 抽題一律讀取本模組最新池
 */

import {
  IDIOM_EXAM_POOL,
  idiomExamPoolToQuizPool,
  idiomExamPoolToSspaPool,
} from './idiomExamPool.js';
import { EXAM_METHOD_TEMPLATES } from './readingGoldenTechniquePool.js';

export const LS_GLOBAL_IDIOMS = 'starship_global_idioms';
export const LS_GLOBAL_METHODS = 'starship_global_methods';
export const LS_GLOBAL_STUDY_STATS = 'starship_global_study_stats';

const LEGACY_LS_IDIOMS = 'global_shared_idioms';
const LEGACY_LS_METHODS = 'global_shared_methods';
const LEGACY_LS_STATS = 'global_shared_study_stats';

function readJsonStorage(key, fallback = null) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function loadPoolWithMigration(primaryKey, legacyKey, seedArray) {
  const current = readJsonStorage(primaryKey, null);
  if (Array.isArray(current) && current.length) return current;

  const legacy = readJsonStorage(legacyKey, null);
  if (Array.isArray(legacy) && legacy.length) {
    writeJsonStorage(primaryKey, legacy);
    return legacy;
  }

  return [...seedArray];
}

/** 中央共享四字詞語庫 — 初始化優先讀 localStorage，否則 30 題黃金矩陣 */
export let GLOBAL_SHARED_IDIOMS = loadPoolWithMigration(
  LS_GLOBAL_IDIOMS,
  LEGACY_LS_IDIOMS,
  IDIOM_EXAM_POOL,
);

/** 中央共享寫作手法題庫 — 初始化優先讀 localStorage，否則四大黃金手法 */
export let GLOBAL_SHARED_METHODS = loadPoolWithMigration(
  LS_GLOBAL_METHODS,
  LEGACY_LS_METHODS,
  EXAM_METHOD_TEMPLATES,
);

const CONTRIBUTOR_DISTRICTS = [
  '九龍塘', '沙田', '屯門', '北角', '將軍澳', '大埔', '元朗', '荃灣',
  '深水埗', '觀塘', '灣仔', '西貢', '葵涌', '上水', '馬鞍山',
];

const SCAN_STOP_WORDS = new Set([
  '錯別字', '填空', '成語', '學校', '試卷', '姓名', '班別', '學號',
  '滿分', '得分', '日期', '小學', '中學', '香港', '中文', '語文',
]);

function shuffleWithRandInt(array, randInt) {
  const arr = [...array];
  const ri = randInt ?? ((n) => Math.floor(Math.random() * n));
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = ri(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateContributorLabel(seed = Date.now()) {
  const n = Math.abs(Number(seed) || Date.now());
  return `${CONTRIBUTOR_DISTRICTS[n % CONTRIBUTOR_DISTRICTS.length]}某小學家長`;
}

function stripHintPrefix(hint) {
  return String(hint ?? '').replace(/^提示：/, '').trim();
}

function persistGlobalIdioms() {
  writeJsonStorage(LS_GLOBAL_IDIOMS, GLOBAL_SHARED_IDIOMS);
}

function persistGlobalMethods() {
  writeJsonStorage(LS_GLOBAL_METHODS, GLOBAL_SHARED_METHODS);
}

export function reloadGlobalSharedPools() {
  GLOBAL_SHARED_IDIOMS = loadPoolWithMigration(LS_GLOBAL_IDIOMS, LEGACY_LS_IDIOMS, IDIOM_EXAM_POOL);
  GLOBAL_SHARED_METHODS = loadPoolWithMigration(LS_GLOBAL_METHODS, LEGACY_LS_METHODS, EXAM_METHOD_TEMPLATES);
  return { idioms: GLOBAL_SHARED_IDIOMS.length, methods: GLOBAL_SHARED_METHODS.length };
}

export function getGlobalSharedIdioms() {
  return [...GLOBAL_SHARED_IDIOMS];
}

export function getGlobalSharedMethods() {
  return [...GLOBAL_SHARED_METHODS];
}

/** 標準題目包裝 — 選項／提示絕不洩漏正確答案文字 */
export function wrapIdiomAsStandardQuestion(word, meta = {}) {
  const w = String(word ?? '').trim();
  if (!w) return null;

  return {
    word: w,
    questionText: meta.questionText
      ?? `文中使用了「${w}」，以下哪一項最能描述這個詞語在文中的意思？`,
    options: [
      '能結合上下文，概括該詞在文中的語境義',
      '望文生義，理解成與本文主旨相反的意思',
      '只按字面拆解每一個字，忽略段落語境',
      '與該詞所在句子的敘述重點完全無關',
    ],
    correctAnswerIndex: 0,
    hint: meta.hint ?? `提示：請回到原文找出「${w}」所在的句子，從前後文推斷語意（提示不會直接給答案）。`,
    contributorLabel: meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now()),
    source: meta.source ?? 'ugc_photo_scan',
    isCommunityShared: true,
  };
}

export function saveToGlobalPool(newWordObj) {
  const word = String(newWordObj?.word ?? '').trim();
  if (!word) return false;

  if (GLOBAL_SHARED_IDIOMS.some((item) => item.word === word)) return false;

  const entry = {
    ...newWordObj,
    word,
    id: newWordObj.id ?? `ugc_${word}_${Date.now()}`,
    isCommunityShared: true,
    sharedAt: newWordObj.sharedAt ?? new Date().toISOString(),
    contributorLabel: newWordObj.contributorLabel ?? generateContributorLabel(Date.now()),
    sharedPoolId: newWordObj.sharedPoolId ?? `idiom:${word}`,
    source: newWordObj.source ?? 'ugc_photo_scan',
  };

  GLOBAL_SHARED_IDIOMS.push(entry);
  persistGlobalIdioms();
  return true;
}

export function saveMethodToGlobalPool(newMethodObj) {
  const questionText = String(newMethodObj?.questionText ?? '').trim();
  if (!questionText) return false;

  if (GLOBAL_SHARED_METHODS.some((item) => item.questionText === questionText)) return false;

  const entry = {
    ...newMethodObj,
    questionText,
    id: newMethodObj.id ?? `ugc_method_${Date.now()}`,
    isCommunityShared: true,
    sharedAt: newMethodObj.sharedAt ?? new Date().toISOString(),
    contributorLabel: newMethodObj.contributorLabel ?? generateContributorLabel(Date.now() + 1),
    sharedPoolId: newMethodObj.sharedPoolId ?? `method:${questionText.slice(0, 24)}`,
    source: newMethodObj.source ?? 'ugc_photo_scan',
  };

  GLOBAL_SHARED_METHODS.push(entry);
  persistGlobalMethods();
  return true;
}

export function scanIdiomCandidatesFromText(cleanText = '') {
  const plain = String(cleanText).replace(/\s+/g, '');
  const matches = plain.match(/[\u4e00-\u9fff]{4}/g) ?? [];
  const seen = new Set();
  const candidates = [];

  matches.forEach((word) => {
    if (seen.has(word)) return;
    if (SCAN_STOP_WORDS.has(word)) return;
    if (/^[第行選項題分]/.test(word)) return;
    seen.add(word);
    candidates.push(word);
  });

  return candidates;
}

/**
 * UGC Auto-Ingestor — Tesseract 清洗後呼叫
 * 掃描正文 → 包裝標準題 → 去重 push → 立刻寫入 localStorage
 */
export function syncAndExpandSharedPool(cleanText = '', meta = {}) {
  const contributorLabel = meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now());
  const addedWords = [];
  let addedCount = 0;
  let skippedCount = 0;

  const scanned = scanIdiomCandidatesFromText(cleanText);
  const customWords = (meta.customIdioms ?? [])
    .map((item) => (typeof item === 'string' ? item : item?.word))
    .filter(Boolean);

  const allCandidates = [...new Set([...scanned, ...customWords])];

  allCandidates.forEach((word) => {
    const customMeta = Array.isArray(meta.customIdioms)
      ? meta.customIdioms.find((i) => i?.word === word) ?? {}
      : {};

    const wrapped = wrapIdiomAsStandardQuestion(word, {
      contributorLabel,
      seed: meta.seed,
      source: meta.source ?? 'ugc_photo_scan',
      ...customMeta,
    });

    if (saveToGlobalPool(wrapped)) {
      addedWords.push(word);
      addedCount += 1;
    } else {
      skippedCount += 1;
    }
  });

  (meta.customMethods ?? []).forEach((method) => {
    const enriched = { ...method, contributorLabel, source: method.source ?? 'ugc_photo_scan' };
    if (saveMethodToGlobalPool(enriched)) addedCount += 1;
    else skippedCount += 1;
  });

  return {
    addedWords,
    addedCount,
    skippedCount,
    totalIdioms: GLOBAL_SHARED_IDIOMS.length,
    totalMethods: GLOBAL_SHARED_METHODS.length,
  };
}

export function ingestFromOcrText(ocrText = '', meta = {}) {
  return syncAndExpandSharedPool(ocrText, meta);
}

export function ingestNewItemsToSharedPool(newIdioms = [], newMethods = [], meta = {}) {
  const contributorLabel = meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now());
  let idiomsAdded = 0;
  let methodsAdded = 0;
  let skipped = 0;

  (Array.isArray(newIdioms) ? newIdioms : []).forEach((item) => {
    const enriched = { ...item, contributorLabel, source: item.source ?? 'ugc_upload', isCommunityShared: true };
    if (saveToGlobalPool(enriched)) idiomsAdded += 1;
    else skipped += 1;
  });

  (Array.isArray(newMethods) ? newMethods : []).forEach((item) => {
    const enriched = { ...item, contributorLabel, source: item.source ?? 'ugc_upload', isCommunityShared: true };
    if (saveMethodToGlobalPool(enriched)) methodsAdded += 1;
    else skipped += 1;
  });

  return {
    idiomsAdded,
    methodsAdded,
    skipped,
    addedCount: idiomsAdded + methodsAdded,
    totalIdioms: GLOBAL_SHARED_IDIOMS.length,
    totalMethods: GLOBAL_SHARED_METHODS.length,
  };
}

export function ingestFromExamPatterns(idiomPatterns = [], meta = {}) {
  const contributorLabel = meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now());
  const idioms = idiomPatterns.map((p) => {
    const word = p.idiom ?? p.word;
    const base = wrapIdiomAsStandardQuestion(word, { contributorLabel, source: 'exam_upload', seed: meta.seed });
    const hintRaw = stripHintPrefix(p.hint);
    return {
      ...base,
      questionText: `「${word}」在呈分試語境中最接近以下哪一項語意？`,
      hint: hintRaw ? `提示：${hintRaw}` : base.hint,
    };
  });
  return ingestNewItemsToSharedPool(idioms, [], meta);
}

export function globalIdiomsToVocabPool(idiomPool = getGlobalSharedIdioms()) {
  return idiomPool.map((item) => ({
    id: item.id ?? `global-vocab-${item.word}`,
    tc: item.word,
    sc: item.word,
    hintTc: stripHintPrefix(item.hint),
    hintSc: stripHintPrefix(item.hint),
    hint: stripHintPrefix(item.hint),
    en: item.en ?? '',
    word: item.word,
    isCommunityShared: Boolean(item.isCommunityShared),
    contributorLabel: item.contributorLabel,
    sharedPoolId: item.sharedPoolId ?? `idiom:${item.word}`,
    source: item.source ?? 'starship_global_idioms',
  }));
}

export function idiomPoolItemToQuestion(item, index = 0) {
  return {
    id: item.id ?? index + 1,
    questionText: item.questionText,
    options: [...(item.options ?? [])],
    correctAnswerIndex: Number(item.correctAnswerIndex ?? 0),
    hint: item.hint,
    word: item.word,
    category: 'vocab_inference',
    templateId: item.id,
    isCommunityShared: Boolean(item.isCommunityShared),
    contributorLabel: item.contributorLabel,
    sharedPoolId: item.sharedPoolId ?? `idiom:${item.word}`,
    source: item.source ?? 'starship_global_idioms',
  };
}

export function methodPoolItemToQuestion(tpl, index = 0) {
  return {
    id: tpl.id ?? `method_${index}`,
    questionText: tpl.questionText,
    options: [...(tpl.options ?? [])],
    correctAnswerIndex: Number(tpl.correctAnswerIndex ?? 0),
    hint: tpl.hint,
    category: tpl.category ?? 'writing_technique',
    methodType: tpl.type,
    templateId: tpl.id,
    isCommunityShared: Boolean(tpl.isCommunityShared),
    contributorLabel: tpl.contributorLabel,
    sharedPoolId: tpl.sharedPoolId ?? `method:${tpl.id}`,
    source: tpl.source ?? 'starship_global_methods',
  };
}

export function pickRandomSharedIdiomQuestions(count = 1, seed) {
  const pool = getGlobalSharedIdioms();
  if (!pool.length) return [];

  let randInt;
  if (seed != null) {
    let state = (Number(seed) >>> 0) || 1;
    randInt = (n) => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return Math.floor(((state & 0x7fffffff) / 0x80000000) * n);
    };
  } else {
    randInt = (n) => Math.floor(Math.random() * n);
  }

  return shuffleWithRandInt(pool, randInt)
    .slice(0, Math.min(count, pool.length))
    .map(idiomPoolItemToQuestion);
}

export function pickRandomSharedMethodQuestions(count = 1, seed) {
  const pool = getGlobalSharedMethods();
  if (!pool.length) return [];

  let randInt;
  if (seed != null) {
    let state = (Number(seed) >>> 0) || 1;
    randInt = (n) => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return Math.floor(((state & 0x7fffffff) / 0x80000000) * n);
    };
  } else {
    randInt = (n) => Math.floor(Math.random() * n);
  }

  return shuffleWithRandInt(pool, randInt)
    .slice(0, Math.min(count, pool.length))
    .map(methodPoolItemToQuestion);
}

export function shuffleGlobalIdiomPool(seed) {
  const pool = getGlobalSharedIdioms();
  let randInt;
  if (seed != null) {
    let state = (Number(seed) >>> 0) || 1;
    randInt = (n) => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return Math.floor(((state & 0x7fffffff) / 0x80000000) * n);
    };
  } else {
    randInt = (n) => Math.floor(Math.random() * n);
  }
  return shuffleWithRandInt(pool, randInt);
}

function readStudyStats() {
  const current = readJsonStorage(LS_GLOBAL_STUDY_STATS, null);
  if (current) return current;
  const legacy = readJsonStorage(LEGACY_LS_STATS, null);
  if (legacy) {
    writeJsonStorage(LS_GLOBAL_STUDY_STATS, legacy);
    return legacy;
  }
  return {};
}

function writeStudyStats(stats) {
  writeJsonStorage(LS_GLOBAL_STUDY_STATS, stats);
}

export function recordSharedItemStudy(sharedPoolId) {
  const id = String(sharedPoolId ?? '').trim();
  if (!id) return 0;
  const stats = readStudyStats();
  const base = stats[id] ?? Math.floor(80 + Math.random() * 200);
  stats[id] = base + 1;
  writeStudyStats(stats);
  return stats[id];
}

export function getSharedItemStudyCount(sharedPoolId) {
  const id = String(sharedPoolId ?? '').trim();
  if (!id) return 0;
  return readStudyStats()[id] ?? 0;
}

export function getContributorBadgeForItem(item) {
  if (!item?.isCommunityShared) return null;

  const poolId = item.sharedPoolId ?? item.id;
  return {
    isCommunityShared: true,
    helpedCount: getSharedItemStudyCount(poolId),
    sharedPoolId: poolId,
  };
}

export function methodPoolItemToSspaQuestion(tpl, index = 0) {
  const correctIdx = Number(tpl.correctAnswerIndex ?? 0);
  const correctText = tpl.options?.[correctIdx] ?? '';

  return {
    id: tpl.id ?? `sspa_method_${index}`,
    text: tpl.questionText,
    hint: stripHintPrefix(tpl.hint),
    subType: '四大寫作手法',
    category: tpl.category ?? 'writing_technique',
    methodType: tpl.type,
    options: [...(tpl.options ?? [])],
    correctIndex: correctIdx,
    explanation: `正確分析：${correctText}`,
    isCommunityShared: Boolean(tpl.isCommunityShared),
    contributorLabel: tpl.contributorLabel,
    sharedPoolId: tpl.sharedPoolId ?? `method:${tpl.id}`,
    source: tpl.source ?? 'starship_global_methods',
  };
}

export function enrichPoolItemWithContributor(item) {
  if (!item || item.isCommunityShared) return item;

  const word = item.word ?? item.sourceIdiom;
  if (word) {
    const shared = GLOBAL_SHARED_IDIOMS.find((i) => i.word === word && i.isCommunityShared);
    if (shared) {
      return {
        ...item,
        isCommunityShared: true,
        contributorLabel: shared.contributorLabel,
        sharedPoolId: shared.sharedPoolId ?? `idiom:${word}`,
      };
    }
  }

  const stem = item.text ?? item.questionText;
  if (stem) {
    const sharedMethod = GLOBAL_SHARED_METHODS.find(
      (i) => i.questionText === stem && i.isCommunityShared,
    );
    if (sharedMethod) {
      return {
        ...item,
        isCommunityShared: true,
        contributorLabel: sharedMethod.contributorLabel,
        sharedPoolId: sharedMethod.sharedPoolId ?? `method:${sharedMethod.id}`,
      };
    }
  }

  return item;
}

export function enrichQuizItemWithContributor(quizItem) {
  return enrichPoolItemWithContributor(quizItem);
}

export function buildQuizPoolWithGlobal(quizPoolCore, idiomToQuiz = idiomExamPoolToQuizPool) {
  return [
    ...quizPoolCore,
    ...idiomToQuiz(getGlobalSharedIdioms()),
  ];
}

/** 呈分試池 = 靜態核心 + 中央共享 30 題詞彙語意 + 四大寫作手法 */
export function buildSspaPoolWithGlobal(
  sspaPoolCore,
  idiomToSspa = idiomExamPoolToSspaPool,
) {
  return [
    ...sspaPoolCore,
    ...idiomToSspa(getGlobalSharedIdioms()),
    ...getGlobalSharedMethods().map(methodPoolItemToSspaQuestion),
  ];
}

export function getGlobalPoolStats() {
  return {
    globalSharedIdioms: GLOBAL_SHARED_IDIOMS.length,
    globalSharedMethods: GLOBAL_SHARED_METHODS.length,
    ugcIdioms: GLOBAL_SHARED_IDIOMS.filter((i) => i.isCommunityShared).length,
    ugcMethods: GLOBAL_SHARED_METHODS.filter((i) => i.isCommunityShared).length,
  };
}

export { idiomExamPoolToQuizPool };
