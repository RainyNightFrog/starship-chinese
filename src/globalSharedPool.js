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
import {
  isGarbageIdiomWord,
  isPlayableVocabExamItem,
  isScannableIdiomCandidate,
} from './sharedIdiomQuality.js';
import {
  fuzzyMatchIdiomWord,
  fuzzyMatchIdiomsFromText,
} from './idiomFuzzyMatcher.js';

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

/** 中央共享寫作手法題庫 — 初始化優先讀 localStorage，否則十大呈分試手法種子矩陣 */
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

/** 清理 localStorage 中 OCR 碎片與無法作答的舊版 UGC 題 */
export function sanitizeGlobalIdiomPool(pool = GLOBAL_SHARED_IDIOMS) {
  const cleaned = (pool ?? []).map((item) => {
    const word = String(item?.word ?? '').trim();
    if (!word || isGarbageIdiomWord(word)) return null;
    if (!isPlayableVocabExamItem(item)) {
      return {
        ...item,
        word,
        dictationOnly: true,
        hint: item.hint ?? `校本詞彙「${word}」`,
      };
    }
    return item;
  }).filter(Boolean);

  const changed = cleaned.length !== pool.length
    || cleaned.some((item, i) => item.dictationOnly !== pool[i]?.dictationOnly);
  return { pool: cleaned, changed };
}

export function reloadGlobalSharedPools() {
  GLOBAL_SHARED_IDIOMS = loadPoolWithMigration(LS_GLOBAL_IDIOMS, LEGACY_LS_IDIOMS, IDIOM_EXAM_POOL);
  GLOBAL_SHARED_METHODS = loadPoolWithMigration(LS_GLOBAL_METHODS, LEGACY_LS_METHODS, EXAM_METHOD_TEMPLATES);
  const { pool, changed } = sanitizeGlobalIdiomPool(GLOBAL_SHARED_IDIOMS);
  if (changed) {
    GLOBAL_SHARED_IDIOMS = pool;
    persistGlobalIdioms();
  }
  ensureSeedMethodsInPool();
  return { idioms: GLOBAL_SHARED_IDIOMS.length, methods: GLOBAL_SHARED_METHODS.length };
}

/**
 * 將 EXAM_METHOD_TEMPLATES 種子併入既有 localStorage 池（舊版僅 4 題時補齊 6 類新題型）
 */
export function ensureSeedMethodsInPool() {
  let changed = false;

  EXAM_METHOD_TEMPLATES.forEach((seed) => {
    const idx = GLOBAL_SHARED_METHODS.findIndex(
      (m) => m.id === seed.id || m.sharedPoolId === `method:${seed.id}`,
    );

    if (idx < 0) {
      GLOBAL_SHARED_METHODS.push({
        ...seed,
        source: seed.source ?? 'exam_method_seed',
        sharedPoolId: seed.sharedPoolId ?? `method:${seed.id}`,
      });
      changed = true;
      return;
    }

    if (!GLOBAL_SHARED_METHODS[idx].isCommunityShared) {
      GLOBAL_SHARED_METHODS[idx] = {
        ...GLOBAL_SHARED_METHODS[idx],
        ...seed,
        source: GLOBAL_SHARED_METHODS[idx].source ?? 'exam_method_seed',
        sharedPoolId: GLOBAL_SHARED_METHODS[idx].sharedPoolId ?? `method:${seed.id}`,
      };
      changed = true;
    }
  });

  if (changed) persistGlobalMethods();
}

export function getGlobalSharedIdioms() {
  return [...GLOBAL_SHARED_IDIOMS];
}

export function getGlobalSharedMethods() {
  ensureSeedMethodsInPool();
  return [...GLOBAL_SHARED_METHODS];
}

function createSeededRandInt(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return (n) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return Math.floor(((state & 0x7fffffff) / 0x80000000) * n);
  };
}

/** 標準題目包裝 — UGC 無精選選項時僅供默書／預習，不進呈分試 */
export function wrapIdiomAsStandardQuestion(word, meta = {}) {
  const w = String(word ?? '').trim();
  if (!w || isGarbageIdiomWord(w)) return null;

  const hasCuratedOptions = Array.isArray(meta.options) && meta.options.length >= 4
    && isPlayableVocabExamItem({ word: w, options: meta.options, questionText: meta.questionText });

  if (hasCuratedOptions) {
    return {
      word: w,
      questionText: meta.questionText
        ?? `「${w}」在呈分試語境中最接近以下哪一項語意？`,
      options: [...meta.options],
      correctAnswerIndex: Number(meta.correctAnswerIndex ?? 0),
      hint: meta.hint ?? `提示：聯想「${w}」常見的課文用法，再選出最貼切的語意。`,
      contributorLabel: meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now()),
      source: meta.source ?? 'ugc_photo_scan',
      isCommunityShared: true,
    };
  }

  return {
    word: w,
    dictationOnly: true,
    hint: meta.hint ?? `校本詞彙「${w}」— 請先理解詞義再默寫。`,
    contributorLabel: meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now()),
    source: meta.source ?? 'ugc_photo_scan',
    isCommunityShared: true,
  };
}

export function saveToGlobalPool(newWordObj) {
  const word = String(newWordObj?.word ?? '').trim();
  if (!word || isGarbageIdiomWord(word)) return false;

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
    if (!isScannableIdiomCandidate(word)) return;
    seen.add(word);
    candidates.push(word);
  });

  return candidates;
}

/**
 * UGC Auto-Ingestor — Tesseract 清洗後呼叫
 * 掃描正文 → Fuse.js 模糊配對 IDIOM_EXAM_POOL → 去重 push → 立刻寫入 localStorage
 */
export function syncAndExpandSharedPool(cleanText = '', meta = {}) {
  const contributorLabel = meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now());
  const addedWords = [];
  let addedCount = 0;
  let skippedCount = 0;

  /** ① Fuse.js 全文模糊撈取黃金 30 題（容忍 OCR 錯字） */
  const fuseMatched = fuzzyMatchIdiomsFromText(cleanText);
  const scanned = scanIdiomCandidatesFromText(cleanText);
  const customWords = (meta.customIdioms ?? [])
    .map((item) => (typeof item === 'string' ? item : item?.word))
    .filter(Boolean);

  /** canonicalWord → 合併後的題目 metadata（優先保留 IDIOM_EXAM_POOL 完整四選一） */
  const resolvedEntries = new Map();

  fuseMatched.forEach((poolItem) => {
    resolvedEntries.set(poolItem.word, { ...poolItem, matchedVia: poolItem.matchedVia ?? 'fuse_text' });
  });

  scanned.forEach((rawWord) => {
    const fuseResult = fuzzyMatchIdiomWord(rawWord);
    if (fuseResult?.item) {
      const canonical = fuseResult.item.word;
      if (!resolvedEntries.has(canonical)) {
        resolvedEntries.set(canonical, {
          ...fuseResult.item,
          matchedVia: fuseResult.matchedVia,
          ocrCorrectedFrom: fuseResult.matchedVia !== 'exact' ? rawWord : undefined,
        });
      }
      return;
    }
    if (!resolvedEntries.has(rawWord)) {
      resolvedEntries.set(rawWord, { word: rawWord });
    }
  });

  customWords.forEach((rawWord) => {
    const customMeta = Array.isArray(meta.customIdioms)
      ? meta.customIdioms.find((i) => i?.word === rawWord) ?? {}
      : {};
    const fuseResult = fuzzyMatchIdiomWord(rawWord);
    const canonical = fuseResult?.item?.word ?? rawWord;

    resolvedEntries.set(canonical, {
      ...(fuseResult?.item ?? { word: rawWord }),
      ...customMeta,
      word: canonical,
      matchedVia: fuseResult?.matchedVia,
      ocrCorrectedFrom: fuseResult?.matchedVia === 'fuse' ? rawWord : undefined,
    });
  });

  resolvedEntries.forEach((entryMeta, canonicalWord) => {
    const wrapped = wrapIdiomAsStandardQuestion(canonicalWord, {
      contributorLabel,
      seed: meta.seed,
      source: meta.source ?? 'ugc_photo_scan',
      questionText: entryMeta.questionText,
      options: entryMeta.options,
      correctAnswerIndex: entryMeta.correctAnswerIndex,
      hint: entryMeta.hint,
    });

    if (saveToGlobalPool(wrapped)) {
      addedWords.push(canonicalWord);
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
  return idiomPool
    .filter((item) => item?.word && !isGarbageIdiomWord(item.word))
    .map((item) => {
    const correctIdx = Number(item.correctAnswerIndex ?? 0);
    const meaning = item.dictationOnly
      ? stripHintPrefix(item.hint)
      : (item.options?.[correctIdx] ?? stripHintPrefix(item.hint));
    return {
      id: item.id ?? `global-vocab-${item.word}`,
      tc: item.word,
      sc: item.word,
      hintTc: meaning,
      hintSc: meaning,
      hint: stripHintPrefix(item.hint),
      en: item.en ?? '',
      word: item.word,
      isCommunityShared: Boolean(item.isCommunityShared),
      contributorLabel: item.contributorLabel,
      sharedPoolId: item.sharedPoolId ?? `idiom:${item.word}`,
      source: item.source ?? 'starship_global_idioms',
    };
  });
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
  return pickDistinctSharedMethodQuestions(count, seed, { requireDistinctType: false });
}

/**
 * Dynamic Fisher-Yates 洗牌 — 從 GLOBAL_SHARED_METHODS 抽取 count 道題
 * @param {number} count
 * @param {number} [seed]
 * @param {{ requireDistinctType?: boolean }} [opts] — 預設 true：保證 type 維度互不相同
 */
export function pickDistinctSharedMethodQuestions(count = 1, seed, opts = {}) {
  const { requireDistinctType = true } = opts;
  ensureSeedMethodsInPool();
  const pool = getGlobalSharedMethods();
  if (!pool.length) return [];

  const randInt = seed != null
    ? createSeededRandInt(seed)
    : (n) => Math.floor(Math.random() * n);

  const shuffled = shuffleWithRandInt(pool, randInt);
  const picked = [];
  const usedTypes = new Set();
  const usedIds = new Set();

  shuffled.forEach((tpl) => {
    if (picked.length >= count) return;
    const typeKey = String(tpl.type ?? tpl.id ?? tpl.questionText ?? '').trim();
    const idKey = String(tpl.id ?? tpl.sharedPoolId ?? tpl.questionText ?? '').trim();
    if (requireDistinctType && typeKey && usedTypes.has(typeKey)) return;
    if (usedIds.has(idKey)) return;
    if (typeKey) usedTypes.add(typeKey);
    usedIds.add(idKey);
    picked.push(tpl);
  });

  if (picked.length < count) {
    shuffled.forEach((tpl) => {
      if (picked.length >= count) return;
      const idKey = String(tpl.id ?? tpl.sharedPoolId ?? tpl.questionText ?? '').trim();
      if (usedIds.has(idKey)) return;
      usedIds.add(idKey);
      picked.push(tpl);
    });
  }

  return picked
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
  const playableIdioms = getGlobalSharedIdioms().filter(isPlayableVocabExamItem);
  return [
    ...quizPoolCore,
    ...idiomToQuiz(playableIdioms),
  ];
}

/** 呈分試池 = 靜態核心 + 中央共享 30 題詞彙語意 + 十大呈分試手法矩陣 */
export function buildSspaPoolWithGlobal(
  sspaPoolCore,
  idiomToSspa = idiomExamPoolToSspaPool,
) {
  const playableIdioms = getGlobalSharedIdioms().filter(isPlayableVocabExamItem);
  return [
    ...sspaPoolCore,
    ...idiomToSspa(playableIdioms),
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
