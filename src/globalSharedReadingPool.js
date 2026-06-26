/**
 * 全港家長上載閱讀理解 — 中央共享文章池
 * localStorage `starship_global_reading`：上載後其他學生亦可練習
 */

import { generateContributorLabel } from './globalSharedPool.js';
import { sanitizeReadingBankItem } from './readingDisplayGuard.js';

import { LS_GLOBAL_READING } from './dataPipelineKeys.js';

export { LS_GLOBAL_READING } from './dataPipelineKeys.js';
const LEGACY_LS_READING = 'global_shared_reading';

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

function loadReadingPassages() {
  const current = readJsonStorage(LS_GLOBAL_READING, null);
  if (Array.isArray(current)) return current;
  const legacy = readJsonStorage(LEGACY_LS_READING, null);
  if (Array.isArray(legacy)) {
    writeJsonStorage(LS_GLOBAL_READING, legacy);
    return legacy;
  }
  return [];
}

/** @type {Array<object>} */
export let GLOBAL_SHARED_READING_PASSAGES = loadReadingPassages();

const MAX_PASSAGES = 48;

function persistReadingPassages() {
  writeJsonStorage(LS_GLOBAL_READING, GLOBAL_SHARED_READING_PASSAGES);
}

export function reloadGlobalSharedReadingPool() {
  GLOBAL_SHARED_READING_PASSAGES = loadReadingPassages();
  return GLOBAL_SHARED_READING_PASSAGES.length;
}

function passageFingerprintFromBank(readingBank = []) {
  const first = readingBank[0];
  if (!first) return '';
  const lines = (first.passage ?? []).join('|').replace(/^第\d+行：/gm, '');
  return `${first.passageTitle ?? ''}::${lines.slice(0, 120)}`;
}

function bankToPassageRecord(readingBank = [], meta = {}) {
  if (!readingBank.length) return null;
  const first = readingBank[0];
  const passageId = first.passageId ?? `ugc-read-${meta.seed ?? Date.now()}`;

  return {
    id: passageId,
    passageId,
    passageTitle: first.passageTitle ?? '校本閱讀',
    genre: first.genre ?? '校本閱讀',
    passage: [...(first.passage ?? [])],
    questions: readingBank.map((q) => ({
      question: q.question,
      options: [...(q.options ?? [])],
      correctIndex: Number(q.correctIndex ?? q.correctAnswerIndex ?? 0),
      explanation: q.explanation ?? q.hint ?? '',
      hint: q.hint ?? q.explanation ?? '',
    })),
    fingerprint: passageFingerprintFromBank(readingBank),
    isCommunityShared: true,
    contributorLabel: meta.contributorLabel ?? generateContributorLabel(meta.seed ?? Date.now()),
    sharedAt: new Date().toISOString(),
    source: meta.source ?? 'ugc_reading_upload',
  };
}

function passageRecordToBankEntries(record) {
  const total = record.questions?.length ?? 0;
  return (record.questions ?? []).map((q, qi) => sanitizeReadingBankItem({
    id: `${record.passageId}-q${qi + 1}`,
    passageId: record.passageId,
    passageTitle: record.passageTitle,
    genre: record.genre ?? '校本閱讀',
    passage: [...(record.passage ?? [])],
    question: q.question,
    options: [...(q.options ?? [])],
    correctIndex: Number(q.correctIndex ?? 0),
    explanation: q.explanation ?? q.hint ?? '',
    hint: q.hint ?? q.explanation ?? '',
    questionNumberInPassage: qi + 1,
    passageQuestionTotal: total,
    isCommunityShared: Boolean(record.isCommunityShared),
    isAiGenerated: true,
    contributorLabel: record.contributorLabel,
    sharedPoolId: record.sharedPoolId ?? `reading:${record.passageId}`,
    source: record.source ?? 'starship_global_reading',
  }));
}

/**
 * 家長上載閱讀理解完成後寫入中央池（去重）
 * @returns {{ added: boolean, skipped?: boolean, passageId?: string, totalPassages: number }}
 */
export function ingestReadingBankToGlobalPool(readingBank = [], meta = {}) {
  const fp = passageFingerprintFromBank(readingBank);
  if (!fp) {
    return { added: false, totalPassages: GLOBAL_SHARED_READING_PASSAGES.length };
  }

  const existingIdx = GLOBAL_SHARED_READING_PASSAGES.findIndex(
    (p) => p.fingerprint === fp || p.passageId === readingBank[0]?.passageId,
  );

  const record = bankToPassageRecord(readingBank, meta);
  if (!record) {
    return { added: false, totalPassages: GLOBAL_SHARED_READING_PASSAGES.length };
  }

  if (existingIdx >= 0) {
    GLOBAL_SHARED_READING_PASSAGES[existingIdx] = {
      ...GLOBAL_SHARED_READING_PASSAGES[existingIdx],
      ...record,
      sharedAt: new Date().toISOString(),
    };
    GLOBAL_SHARED_READING_PASSAGES.unshift(GLOBAL_SHARED_READING_PASSAGES.splice(existingIdx, 1)[0]);
    persistReadingPassages();
    return {
      added: true,
      skipped: false,
      passageId: record.passageId,
      totalPassages: GLOBAL_SHARED_READING_PASSAGES.length,
      updated: true,
    };
  }

  GLOBAL_SHARED_READING_PASSAGES.unshift(record);
  if (GLOBAL_SHARED_READING_PASSAGES.length > MAX_PASSAGES) {
    GLOBAL_SHARED_READING_PASSAGES = GLOBAL_SHARED_READING_PASSAGES.slice(0, MAX_PASSAGES);
  }
  persistReadingPassages();

  return {
    added: true,
    passageId: record.passageId,
    totalPassages: GLOBAL_SHARED_READING_PASSAGES.length,
  };
}

/** 中央共享池 → 學生端 readingBank 扁平陣列（最新上載優先） */
export function getGlobalSharedReadingBank() {
  return GLOBAL_SHARED_READING_PASSAGES.flatMap(passageRecordToBankEntries);
}

/** 合併共享上載 + 內建 18 篇（共享文章置前，避免每次都從「秋夜思鄉」開始） */
export function buildReadingPoolWithGlobal(builtinPool = []) {
  const shared = getGlobalSharedReadingBank();
  const sharedPassageIds = new Set(shared.map((q) => q.passageId));
  const builtinOnly = (builtinPool ?? []).filter((q) => !sharedPassageIds.has(q.passageId));
  return [...shared, ...builtinOnly];
}

export function getGlobalSharedReadingStats() {
  const bank = getGlobalSharedReadingBank();
  return {
    globalSharedReadingPassages: GLOBAL_SHARED_READING_PASSAGES.length,
    globalSharedReadingQuestions: bank.length,
    ugcReadingPassages: GLOBAL_SHARED_READING_PASSAGES.filter((p) => p.isCommunityShared).length,
  };
}
