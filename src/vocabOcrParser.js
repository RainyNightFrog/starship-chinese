/**
 * 默書詞表 OCR 解析 — 從 Tesseract 全文提取純詞彙清單（非閱讀理解題）
 */

import { DICTATION_VOCAB_POOL, PRESTUDY_VOCAB_POOL } from './mockDatabase.js';
import { getGlobalSharedIdioms } from './globalSharedPool.js';
import { withHints } from './vocabHints.js';
import { applyVocabDecomposition } from './vocabDecomposition.js';
import { PRESTUDY_IDIOM_COUNT } from './prestudyDictationBridge.js';
import { sanitizeDisplayText } from './previewWordFormat.js';

/** 默書／詞表版面特徵 */
const VOCAB_SHEET_SIGNALS = /默書|默写|詞表|词表|詞語|词语|聽寫|听写|生字|默寫|新詞|新词|成語|成语|詞彙|词汇|校本詞|校本词|範文詞|范文词|溫習詞|温习词/;

/** 試卷雜訊行 */
const NOISE_LINE = /姓名|班別|学号|學號|日期|分數|分数|滿分|满分|學校|学校|小學|小学|中學|中学|請在|请在|下列|造句|填空|改正|選出|选出|圈出|_{2,}|…{2,}|\.{4,}|^\(\s*\d+\s*分\s*\)/;

const STOP_TOKENS = new Set([
  '的', '了', '在', '是', '我', '他', '她', '它', '們', '这', '這', '那', '有', '和', '與', '与',
  '也', '就', '都', '而', '及', '或', '把', '被', '让', '讓', '向', '从', '從', '到', '為', '为',
  '上', '下', '中', '不', '很', '更', '最', '能', '會', '会', '要', '可以', '應該', '应该', '請', '请',
  '下列', '哪一', '哪项', '哪項', '根據', '根据', '文章', '作者', '本文', '句子', '詞語', '词语', '選項', '选项',
  '第一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九', '第十',
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
]);

function buildLookupPool() {
  const byTc = new Map();
  [...DICTATION_VOCAB_POOL, ...PRESTUDY_VOCAB_POOL].forEach((item) => {
    if (item?.tc) byTc.set(item.tc, item);
    if (item?.sc && item.sc !== item.tc) byTc.set(item.sc, item);
  });
  getGlobalSharedIdioms().forEach((item) => {
    if (item?.word && !byTc.has(item.word)) {
      const correctIdx = Number(item.correctAnswerIndex ?? 0);
      byTc.set(item.word, {
        tc: item.word,
        sc: item.word,
        hintTc: item.options?.[correctIdx] ?? item.hint ?? '',
        hintSc: item.options?.[correctIdx] ?? item.hint ?? '',
        en: item.en ?? '',
        source: item.source ?? 'starship_global_idioms',
      });
    }
  });
  return byTc;
}

const LOOKUP_POOL = buildLookupPool();

function stripLineNoise(line = '') {
  return String(line)
    .replace(/^\s*[\d①②③④⑤⑥⑦⑧⑨⑩]+[\.\．、\)\）\s]*/g, '')
    .replace(/^[A-DＡ-Ｄa-d][\.．、\)\）\s]+/g, '')
    .replace(/[（(][^）)]{0,12}[）)]/g, '')
    .replace(/[：:].*$/, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function isValidWordToken(token) {
  if (!token || token.length < 2 || token.length > 8) return false;
  if (STOP_TOKENS.has(token)) return false;
  if (/^[A-Za-z0-9]+$/.test(token)) return false;
  if (!/^[\u4e00-\u9fff]+$/.test(token)) return false;
  if (/錯別字|辨正|填空|成語題|試卷|分數|學校/.test(token)) return false;
  return true;
}

/**
 * 判斷 OCR 全文是否為默書詞表（而非閱讀文章）
 */
export function isVocabWorksheetContent(rawText = '') {
  const text = String(rawText ?? '').trim();
  if (!text) return false;

  if (VOCAB_SHEET_SIGNALS.test(text)) return true;

  const lines = text.split(/\n+/).map(stripLineNoise).filter(Boolean);
  const shortWordLines = lines.filter((line) => {
    const compact = line.replace(/\s/g, '');
    return isValidWordToken(compact) && compact.length <= 8;
  });

  if (shortWordLines.length >= 8) return true;

  const totalLen = text.replace(/\s/g, '').length;
  const avgLineLen = lines.length
    ? lines.reduce((sum, line) => sum + line.replace(/\s/g, '').length, 0) / lines.length
    : 0;

  if (lines.length >= 10 && avgLineLen < 14 && totalLen < 600) return true;

  const wordLikeMatches = text.match(/[\u4e00-\u9fff]{2,8}/g) ?? [];
  const uniqueWords = new Set(wordLikeMatches.filter(isValidWordToken));
  if (uniqueWords.size >= 12 && totalLen < 800 && avgLineLen < 18) return true;

  return false;
}

/** 詞彙池項目 → 標準上載格式（含 word 欄位） */
export function enrichExtractedWord(word, index, seed = Date.now()) {
  const base = LOOKUP_POOL.get(word);
  const meaningFromPool = base?.hintTc ?? base?.hint ?? '';
  const meaning = sanitizeDisplayText(meaningFromPool) || `校本詞語「${word}」— 請熟讀字形與讀音`;

  const item = withHints(applyVocabDecomposition({
    id: `ocr-vocab-${seed}-${index}`,
    word,
    tc: base?.tc ?? word,
    sc: base?.sc ?? word,
    py: base?.py ?? '',
    jp: base?.jp ?? '',
    en: base?.en ?? '',
    radical: base?.radical,
    body: base?.body,
    hintTc: meaning,
    hintSc: base?.hintSc ?? meaning,
    meaning,
    source: 'ocr_vocab_upload',
    isAiExtracted: true,
    idiomWord: word,
  }));

  return item;
}

/**
 * 從 OCR 全文提取詞彙清單（純文字 + 基礎解釋，非閱讀理解題）
 * @returns {Array<{ word, tc, sc, meaning, py, jp, en, ... }>}
 */
export function parseVocabFromOcrText(rawText = '', options = {}) {
  const maxWords = options.maxWords ?? PRESTUDY_IDIOM_COUNT;
  const seed = options.seed ?? Date.now();
  const seen = new Set();
  const candidates = [];

  const lines = String(rawText ?? '').split(/\n+/);

  lines.forEach((rawLine) => {
    if (NOISE_LINE.test(rawLine)) return;
    const line = stripLineNoise(rawLine);
    if (!line || NOISE_LINE.test(line)) return;

    const compact = line.replace(/\s/g, '');
    if (isValidWordToken(compact)) {
      if (!seen.has(compact)) {
        seen.add(compact);
        candidates.push(compact);
      }
      return;
    }

    const inlineWords = line.match(/[\u4e00-\u9fff]{2,8}/g) ?? [];
    inlineWords.forEach((token) => {
      if (!isValidWordToken(token) || seen.has(token)) return;
      seen.add(token);
      candidates.push(token);
    });
  });

  if (candidates.length < 3) {
    const globalWords = getGlobalSharedIdioms()
      .map((item) => item.word)
      .filter(isValidWordToken);
    globalWords.forEach((word) => {
      if (candidates.length >= maxWords || seen.has(word)) return;
      seen.add(word);
      candidates.push(word);
    });
  }

  return candidates
    .slice(0, maxWords)
    .map((word, index) => enrichExtractedWord(word, index, seed));
}
