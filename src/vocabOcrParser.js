/**
 * 默書詞表 OCR 解析
 * ─────────────────
 * 多層提取：詞庫最長匹配 → 滑窗掃描 → 逐字分行配對 → 校本詞子串掃描
 * 只輸出詞庫內詞彙，拒絕標題碎片與亂碼
 */

import { IDIOM_EXAM_POOL } from './idiomExamPool.js';
import { VOCAB_HINTS } from './vocabHints.js';
import { PRESTUDY_IDIOM_COUNT } from './prestudyDictationBridge.js';
import { resolveCustomVocabFromInput } from './customVocabMatcher.js';
import { dedupeVocabWords, toTraditionalVocabWord } from './vocabWordNormalize.js';
import {
  WORKSHEET_TITLE_PATTERN,
  ALL_WORKSHEET_WORDS,
  WORKSHEET_ORDERED_WORDS,
  WORKSHEET_PAGES,
  WORKSHEET_PINYIN_PAIRS,
} from './worksheetVocabLexicon.js';

const VOCAB_SHEET_SIGNALS = /默書|默写|詞表|词表|詞語|词语|聽寫|听写|生字|默寫|新詞|新词|成語|成语|詞彙|词汇|校本詞|校本词|範文詞|范文词|溫習詞|温习词|字詞表/;

const NOISE_LINE = /姓名|班別|学号|學號|日期|分數|分数|滿分|满分|學校|学校|請在|请在|下列|造句|填空|改正|選出|选出|圈出|_{2,}|…{2,}|\.{4,}|^\(\s*\d+\s*分\s*\)/;

const TITLE_FRAGMENT = new Set([
  '小學', '小学', '高年', '年級', '年级', '級字', '字詞', '词表', '詞表', '字表',
  '高年級', '詞語', '词语', '而出', '脫穎', '穎而',
]);

const KNOWN_WORDS_SORTED = [...new Set([
  ...IDIOM_EXAM_POOL.map((item) => item.word),
  ...Object.keys(VOCAB_HINTS),
  ...ALL_WORKSHEET_WORDS,
])].sort((a, b) => b.length - a.length);

const KNOWN_WORD_SET = new Set(KNOWN_WORDS_SORTED);

/** 繁簡／OCR 常見混淆字 */
const CHAR_EQUIV = new Map([
  ['了', '瞭'], ['瞭', '了'], ['了', '了'],
  ['沈', '沉'], ['沉', '沈'],
  ['彷', '仿'], ['仿', '彷'],
  ['複', '复'], ['复', '複'],
  ['與', '与'], ['与', '與'],
  ['後', '后'], ['后', '後'],
  ['發', '发'], ['发', '發'],
  ['獎', '奖'], ['奖', '獎'],
  ['製', '制'], ['制', '製'],
  ['頒', '颁'], ['颁', '頒'],
  ['屢', '屡'], ['屡', '屢'],
  ['傳', '传'], ['传', '傳'],
  ['創', '创'], ['创', '創'],
  ['義', '义'], ['义', '義'],
  ['嚴', '严'], ['严', '嚴'],
  ['務', '务'], ['务', '務'],
  ['愛', '爱'], ['爱', '愛'],
  ['載', '载'], ['载', '載'],
  ['藍', '蓝'], ['蓝', '藍'],
  ['陰', '阴'], ['阴', '陰'],
  ['輕', '轻'], ['轻', '輕'],
  ['籠', '笼'], ['笼', '籠'],
  ['規', '规'], ['规', '規'],
  ['雜', '杂'], ['杂', '雜'],
  ['氣', '气'], ['气', '氣'],
  ['脅', '胁'], ['胁', '脅'],
  ['賴', '赖'], ['赖', '賴'],
  ['資', '资'], ['资', '資'],
  ['產', '产'], ['产', '產'],
  ['鰥', '鳏'], ['鳏', '鰥'],
  ['禮', '礼'], ['礼', '禮'],
  ['眾', '众'], ['众', '眾'],
  ['棄', '弃'], ['弃', '棄'],
  ['撓', '挠'], ['挠', '撓'],
  ['浹', '浃'], ['浃', '浹'],
  ['洛', '落'], ['落', '洛'],
  ['瘓', '痰'], ['痰', '瘓'],
  ['斜', '鮮'], ['鮮', '斜'],
  ['穫', '勁'], ['勁', '穫'],
  ['協', '協'], ['調', '調'],
]);

function charsEquivalent(a, b) {
  if (a === b) return true;
  return CHAR_EQUIV.get(a) === b || CHAR_EQUIV.get(b) === a;
}

function fuzzyMatchAt(plain, start, word) {
  if (start + word.length > plain.length) return false;
  let mismatches = 0;
  const maxMismatch = word.length <= 2 ? 1 : 2;
  for (let i = 0; i < word.length; i += 1) {
    if (!charsEquivalent(plain[start + i], word[i])) {
      mismatches += 1;
      if (mismatches > maxMismatch) return false;
    }
  }
  return true;
}

function fuzzyFindWord(plain, word, startPos = 0) {
  const exact = plain.indexOf(word, startPos);
  if (exact >= 0) return exact;
  for (let i = startPos; i + word.length <= plain.length; i += 1) {
    if (fuzzyMatchAt(plain, i, word)) return i;
  }
  return -1;
}

function isKnownWord(word) {
  return KNOWN_WORD_SET.has(word) && !TITLE_FRAGMENT.has(word);
}

/** OCR 兩字 → 詞庫內最接近的雙字詞（容忍 1 字偏差） */
function resolveOcrPairToKnownWord(char1, char2) {
  const raw = toTraditionalVocabWord(`${char1}${char2}`);
  if (isKnownWord(raw)) return raw;

  for (const word of KNOWN_WORDS_SORTED) {
    if (word.length !== 2) continue;
    if (fuzzyMatchAt(raw, 0, word)) return word;
  }
  return null;
}

function extractFirstHanChar(text = '') {
  const m = String(text).match(/[\u4e00-\u9fff]/);
  return m ? m[0] : null;
}

/**
 * 格子 OCR 常輸出「明|確| |擅||自」— 按 | 分列後每 2 字配對
 */
function extractPipeDelimitedPairs(rawText = '') {
  const hits = [];
  const seen = new Set();

  String(rawText).split(/\n+/).forEach((rawLine, lineIdx) => {
    if (NOISE_LINE.test(rawLine)) return;
    if (!/[|｜]/.test(rawLine)) return;

    const chars = rawLine.split(/[|｜]/)
      .map((seg) => extractFirstHanChar(seg))
      .filter(Boolean);

    for (let i = 0; i + 2 <= chars.length; i += 2) {
      const word = resolveOcrPairToKnownWord(chars[i], chars[i + 1]);
      if (!word || seen.has(word)) continue;
      seen.add(word);
      hits.push({ word, pos: lineIdx * 200 + i });
    }
  });

  return hits;
}

/** 可接受的 OCR 詞語（含詞庫外新詞，拒絕標題碎片） */
function isValidExtractedWord(word) {
  if (!/^[\u4e00-\u9fff]{2,4}$/.test(word)) return false;
  if (TITLE_FRAGMENT.has(word)) return false;
  if (/字詞表|词表|年級|年级|高年級|小學|小学|詞語表/.test(word)) return false;
  return true;
}

/** 從一行 OCR 抽出全部漢字（拼音混排時不可只取首字） */
function pushHanCharsFromSegment(seg, charStream) {
  const hanOnly = String(seg).replace(/[^\u4e00-\u9fff]/g, '');
  if (!hanOnly) return;

  if (hanOnly.length === 1) {
    charStream.push(hanOnly);
    return;
  }

  if (hanOnly.length === 2) {
    charStream.push(hanOnly[0], hanOnly[1]);
    return;
  }

  if (hanOnly.length === 4 && isKnownWord(hanOnly)) {
    charStream.push(hanOnly[0], hanOnly[1], hanOnly[2], hanOnly[3]);
    return;
  }

  hanOnly.split('').forEach((ch) => charStream.push(ch));
}

/** 從 OCR 行收集逐字主字流（格子字表） */
function buildCharStream(rawText = '') {
  const charStream = [];

  String(rawText).split(/\n+/).forEach((rawLine) => {
    if (NOISE_LINE.test(rawLine)) return;
    const line = rawLine.trim();
    if (!line) return;

    /** OCR 常輸出「風 | 吹 | 雨 | 打」— 先拆 | 再取全部漢字 */
    line.split(/\|/).forEach((segment) => {
      pushHanCharsFromSegment(segment.trim(), charStream);
    });
  });

  return charStream;
}

/** 合併多種提取結果，按 OCR 位置排序去重（繁體 canonical） */
function mergeWordHits(...hitLists) {
  const byWord = new Map();

  hitLists.flat().forEach(({ word, pos }) => {
    const out = toTraditionalVocabWord(word);
    /** OCR 只保留詞庫命中，拒絕「後明、確擅」等盲切亂碼 */
    if (!isValidExtractedWord(out) || !isKnownWord(out)) return;
    if (!byWord.has(out) || pos < byWord.get(out)) {
      byWord.set(out, pos);
    }
  });

  return [...byWord.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([word]) => word);
}

function extractGenericGridWords(rawText = '') {
  const charStream = buildCharStream(rawText);
  if (charStream.length < 4) return [];

  const pairChunk = (chunkSize) => {
    const hits = [];
    for (let i = 0; i + chunkSize <= charStream.length; i += chunkSize) {
      const word = charStream.slice(i, i + chunkSize).join('');
      if (isValidExtractedWord(word) && isKnownWord(word)) {
        hits.push({ word, pos: i });
      }
    }
    return hits;
  };

  const as4 = pairChunk(4);
  const as2 = pairChunk(2);

  const scoreHits = (hits) => hits.reduce(
    (sum, h) => sum + (isKnownWord(h.word) ? 3 : 1),
    0,
  );

  return mergeWordHits(scoreHits(as4) >= scoreHits(as2) ? as4 : as2);
}

function stripWorksheetTitle(text = '') {
  return String(text)
    .replace(/小學高年級字詞表/g, ' ')
    .replace(/高年級字詞表/g, ' ')
    .replace(WORKSHEET_TITLE_PATTERN, ' ')
    .replace(/小學\s*高年級\s*字詞表/g, ' ');
}

function stripPinyinAndNoise(text = '') {
  return stripWorksheetTitle(text)
    .replace(/[a-zA-Z\u0100-\u024F\u1E00-\u1EFF\u0300-\u036f\u0350-\u036F\u0483-\u0489\u0323-\u0328]+/g, ' ')
    .replace(/[0-9０-９]+/g, ' ');
}

function toPlainHan(text = '') {
  return stripPinyinAndNoise(text).replace(/[^\u4e00-\u9fff]/g, '');
}

function removeTitleFromPlain(plainHan = '') {
  return plainHan
    .replace(/小學高年級字詞表/g, '')
    .replace(/高年級字詞表/g, '');
}

/** 詞庫最長匹配（連續子串） */
function mineLexiconWordsFromPlain(plainHan = '') {
  const hits = [];
  const seen = new Set();

  for (let i = 0; i < plainHan.length; ) {
    let matched = null;
    for (const word of KNOWN_WORDS_SORTED) {
      if (plainHan.startsWith(word, i)) {
        matched = word;
        break;
      }
    }
    if (matched) {
      if (!seen.has(matched) && isKnownWord(matched)) {
        seen.add(matched);
        hits.push({ word: matched, pos: i });
      }
      i += matched.length;
    } else {
      i += 1;
    }
  }

  return hits;
}

/** 模糊詞庫掃描 — 容忍 OCR 1–2 字偏差 */
function fuzzyLexiconScan(plainHan = '') {
  const hits = [];
  const seen = new Set();

  KNOWN_WORDS_SORTED.forEach((word) => {
    if (!isKnownWord(word) || seen.has(word)) return;
    if (fuzzyFindWord(plainHan, word, 0) >= 0) {
      seen.add(word);
      hits.push({ word, pos: fuzzyFindWord(plainHan, word, 0) });
    }
  });

  return hits;
}

/**
 * 字詞表格子 OCR — 每格取行首主字，再 2/4 字配對
 * 例：廉\nlián\n讠兼 → 廉
 */
function extractGridHeadChars(rawText = '') {
  const hits = [];
  const seen = new Set();
  const charStream = [];

  String(rawText).split(/\n+/).forEach((rawLine) => {
    if (NOISE_LINE.test(rawLine)) return;
    const line = rawLine.trim();
    if (!line) return;

    const hanOnly = line.replace(/[^\u4e00-\u9fff]/g, '');
    if (hanOnly.length === 2 && isKnownWord(hanOnly)) {
      if (!seen.has(hanOnly)) {
        seen.add(hanOnly);
        hits.push({ word: hanOnly, pos: charStream.length });
      }
    } else if (hanOnly.length === 4 && isKnownWord(hanOnly)) {
      if (!seen.has(hanOnly)) {
        seen.add(hanOnly);
        hits.push({ word: hanOnly, pos: charStream.length });
      }
    }

    const before = charStream.length;
    pushHanCharsFromSegment(line, charStream);
    if (charStream.length === before && hanOnly.length === 1) {
      charStream.push(hanOnly);
    }
  });

  if (charStream.length >= 4) {
    const isIdiomStream = /成語|汗流|恍然|百折不/.test(rawText);
    const chunk = isIdiomStream ? 4 : 2;
    for (let i = 0; i + chunk <= charStream.length; i += chunk) {
      const word = charStream.slice(i, i + chunk).join('');
      if (!isKnownWord(word) || seen.has(word)) continue;
      seen.add(word);
      hits.push({ word, pos: i });
    }
  }

  return hits;
}

/** 依校本詞表順序，在 OCR 字流中模糊找回詞語 */
function recoverOrderedWorksheetWords(plainHan = '') {
  const hits = [];
  const seen = new Set();
  let cursor = 0;

  WORKSHEET_ORDERED_WORDS.forEach((word) => {
    if (!isKnownWord(word) || seen.has(word)) return;
    const pos = fuzzyFindWord(plainHan, word, cursor);
    if (pos >= 0) {
      seen.add(word);
      hits.push({ word, pos });
      cursor = pos + word.length;
    }
  });

  return hits;
}

/** 滑窗掃描 2/4 字 — 僅保留詞庫命中（容忍 OCR 字間插入雜字） */
function slidingWindowLexiconScan(plainHan = '') {
  const hits = [];
  const seen = new Set();

  [4, 2].forEach((len) => {
    for (let i = 0; i + len <= plainHan.length; i += 1) {
      const word = plainHan.slice(i, i + len);
      if (!isKnownWord(word) || seen.has(word)) continue;
      seen.add(word);
      hits.push({ word, pos: i });
    }
  });

  return hits;
}

/**
 * 格子 OCR 常逐字分行 — 廉\n潔\n輝\n煌 → 組成 廉潔、輝煌
 */
function extractSingleCharLinePairs(rawText = '') {
  const hits = [];
  const seen = new Set();

  const flushPairs = (charLines, chunkSize) => {
    for (let i = 0; i + chunkSize <= charLines.length; i += chunkSize) {
      const word = charLines.slice(i, i + chunkSize).join('');
      if (!isKnownWord(word) || seen.has(word)) continue;
      seen.add(word);
      hits.push({ word, pos: i });
    }
  };

  String(rawText).split(/\n{2,}/).forEach((page) => {
    const charLines = [];
    page.split(/\n+/).forEach((line) => {
      const han = line.replace(/[^\u4e00-\u9fff]/g, '');
      if (han.length === 1) charLines.push(han);
      else if (han.length === 2 && isKnownWord(han)) {
        if (!seen.has(han)) {
          seen.add(han);
          hits.push({ word: han, pos: charLines.length });
        }
      } else if (han.length === 4 && isKnownWord(han)) {
        if (!seen.has(han)) {
          seen.add(han);
          hits.push({ word: han, pos: charLines.length });
        }
      }
    });

    if (charLines.length >= 4) {
      const isIdiomPage = /成語|汗流|恍然|百折不/.test(page);
      flushPairs(charLines, isIdiomPage ? 4 : 2);
    }
  });

  return hits;
}

const PINYIN_OCR_TOKEN_FIX = new Map([
  ['gdn', 'gan'], ['wuu', 'wu'], ['qn', 'an'], ['xiqng', 'xiang'], ['xigng', 'xiang'],
  ['ki', 'kai'], ['jm', 'jin'], ['xinq', 'xin'], ['xiqn', 'xian'], ['gtan', 'gan'],
  ['gtm', 'gan'], ['sh', 'shi'], ['joo', 'jiao'], ['huqng', 'huang'], ['huang', 'huang'],
  ['z', 'zi'], ['syss', ''], ['sssy', ''],
]);

function normalizeOcrPinyinLine(line = '') {
  let s = String(line)
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/[^a-z]/g, '');

  if (PINYIN_OCR_TOKEN_FIX.has(s)) {
    s = PINYIN_OCR_TOKEN_FIX.get(s);
  }

  return s;
}

/** 從 OCR 拼音行配對詞語（字表格上方常見 luò hòu 等） */
function extractPinyinLinePairs(rawText = '', activePage = null) {
  if (!activePage) return [];

  const allowed = new Set(activePage.words);
  const latinTokens = [];

  String(rawText).split(/\n+/).forEach((line) => {
    const t = line.trim();
    if (!t || NOISE_LINE.test(t)) return;
    if (/[\u4e00-\u9fff]/.test(t)) return;

    t.split(/\s+/).forEach((part) => {
      const norm = normalizeOcrPinyinLine(part);
      if (norm.length >= 2 && norm.length <= 10) {
        latinTokens.push(norm);
      }
    });
  });

  const hits = [];
  const seen = new Set();

  for (let i = 0; i + 1 < latinTokens.length; i += 1) {
    const pairKey = latinTokens[i] + latinTokens[i + 1];
    const word = WORKSHEET_PINYIN_PAIRS[pairKey];
    if (!word || !allowed.has(word) || seen.has(word)) continue;
    seen.add(word);
    hits.push({ word, pos: i });
  }

  return hits;
}

/** 偵測最可能的詞表頁 — 依錨點詞命中數 */
function detectWorksheetPage(plainHan = '') {
  let bestPage = null;
  let bestScore = 0;

  WORKSHEET_PAGES.forEach((page) => {
    const score = page.anchors.filter((anchor) => fuzzyFindWord(plainHan, anchor, 0) >= 0).length;
    if (score > bestScore) {
      bestScore = score;
      bestPage = page;
    }
  });

  return bestScore >= 2 ? bestPage : null;
}

/** 鎖定詞表頁後 — 依頁內順序找回所有可辨識詞（容忍 OCR 錯字） */
function extractDetectedPageWords(plainHan = '', rawText = '') {
  const page = detectWorksheetPage(plainHan);
  if (!page) return [];

  const byWord = new Map();

  page.words.forEach((word, order) => {
    if (!isKnownWord(word)) return;
    if (fuzzyFindWord(plainHan, word, 0) >= 0) {
      byWord.set(word, order);
    }
  });

  extractPinyinLinePairs(rawText, page).forEach(({ word }) => {
    if (!byWord.has(word)) {
      byWord.set(word, page.words.indexOf(word));
    }
  });

  return [...byWord.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([word, pos]) => ({ word, pos }));
}

/** 在校本詞表固定順序中，掃描 OCR 全文是否含該詞（含模糊匹配） */
function scanWorksheetLexiconPresence(plainHan = '') {
  const hits = [];
  const seen = new Set();

  WORKSHEET_ORDERED_WORDS.forEach((word) => {
    if (!isKnownWord(word) || seen.has(word)) return;
    const pos = fuzzyFindWord(plainHan, word, 0);
    if (pos >= 0) {
      seen.add(word);
      hits.push({ word, pos });
    }
  });

  return hits;
}

/** 多層校本詞表提取 */
function extractWorksheetWordsHybrid(rawText = '') {
  const plainFull = toPlainHan(rawText);
  const plainBody = removeTitleFromPlain(plainFull);

  const pages = String(rawText).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pagePlains = (pages.length > 1 ? pages : [rawText]).map((p) => removeTitleFromPlain(toPlainHan(p)));

  const perPageHits = pagePlains.flatMap((plain) => [
    ...mineLexiconWordsFromPlain(plain),
    ...slidingWindowLexiconScan(plain),
    ...fuzzyLexiconScan(plain),
  ]);

  return mergeWordHits(
    perPageHits,
    mineLexiconWordsFromPlain(plainBody),
    slidingWindowLexiconScan(plainBody),
    fuzzyLexiconScan(plainBody),
    fuzzyLexiconScan(plainFull),
    extractPipeDelimitedPairs(rawText),
    extractDetectedPageWords(plainFull, rawText),
    extractSingleCharLinePairs(rawText),
    extractGridHeadChars(rawText),
    scanWorksheetLexiconPresence(plainFull),
    recoverOrderedWorksheetWords(plainFull),
  );
}

function extractLineTokens(rawText = '', { lexiconOnly = false } = {}) {
  const tokens = [];
  const seen = new Set();

  String(rawText).split(/\n+/).forEach((rawLine) => {
    if (NOISE_LINE.test(rawLine)) return;
    const line = stripPinyinAndNoise(rawLine).trim();
    if (!line) return;

    line.split(/[\s\u3000、，,。；;·|\/\\]+/)
      .map((s) => s.replace(/[^\u4e00-\u9fff]/g, ''))
      .filter((w) => w.length === 2 || w.length === 4)
      .forEach((w) => {
        if (lexiconOnly && !isKnownWord(w)) return;
        if (!lexiconOnly && !isValidExtractedWord(w)) return;
        if (lexiconOnly && !KNOWN_WORD_SET.has(w)) return;
        if (seen.has(w)) return;
        seen.add(w);
        tokens.push(w);
      });
  });

  return tokens;
}

function isWorksheetUpload(rawText = '') {
  if (WORKSHEET_TITLE_PATTERN.test(rawText)) return true;
  if (/lián|jié|huī|huáng|píng|fán|lián jié/i.test(rawText) && /廉|輝|烹|詞表|字詞表/.test(rawText)) return true;
  const hanCount = (rawText.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinCount = (rawText.match(/[a-zA-Z]/g) || []).length;
  return (hanCount >= 20 && latinCount >= 5) || (VOCAB_SHEET_SIGNALS.test(rawText) && hanCount >= 12);
}

/** 家長貼上詞表 — 每行一詞 */
function looksLikePastedWordList(rawText = '') {
  const lines = String(rawText).trim().split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const wordLines = lines.filter((l) => /^[\u4e00-\u9fff]{2,4}$/.test(l.replace(/\s/g, '')));
  return wordLines.length >= Math.ceil(lines.length * 0.6);
}

export function isVocabWorksheetContent(rawText = '') {
  const text = String(rawText ?? '').trim();
  if (!text) return false;
  if (WORKSHEET_TITLE_PATTERN.test(text)) return true;
  if (VOCAB_SHEET_SIGNALS.test(text)) return true;
  if (isWorksheetUpload(text)) return true;
  if (extractWorksheetWordsHybrid(text).length >= 3) return true;
  return false;
}

export function parseVocabFromOcrText(rawText = '', options = {}) {
  const maxWords = options.maxWords ?? PRESTUDY_IDIOM_COUNT;
  const seed = options.seed ?? Date.now();
  const minWords = options.minWords ?? 3;

  if (looksLikePastedWordList(rawText)) {
    const candidates = extractLineTokens(rawText, { lexiconOnly: false }).filter(isValidExtractedWord);
    if (candidates.length >= minWords) {
      const { matchedQuestions } = resolveCustomVocabFromInput(candidates.slice(0, maxWords), {
        source: 'pasted_vocab_list',
        seed,
        maxWords,
      });
      return matchedQuestions.filter((q) => isValidExtractedWord(q.word)).slice(0, maxWords);
    }
  }

  const plainFull = toPlainHan(rawText);
  const pageHits = extractDetectedPageWords(plainFull, rawText);

  /** 鎖定詞表頁 — 只輸出該頁命中詞（杜絕跨頁誤配如「落寞」「瞭解」） */
  let candidates;
  if (pageHits.length >= minWords) {
    candidates = pageHits
      .sort((a, b) => a.pos - b.pos)
      .map((h) => h.word);
  } else {
    candidates = extractWorksheetWordsHybrid(rawText);
  }

  /** 格子字表 — 僅詞庫命中（禁止盲切未知雙字） */
  if (candidates.length < minWords) {
    candidates = mergeWordHits(
      candidates.map((word, pos) => ({ word, pos })),
      extractPipeDelimitedPairs(rawText),
      extractGenericGridWords(rawText),
      extractLineTokens(rawText, { lexiconOnly: true }),
    );
  }

  /** 偵測校本字詞表但 OCR 極差 — 依順序模糊對齊 */
  if (candidates.length < minWords && isWorksheetUpload(rawText)) {
    const pageHitsRetry = extractDetectedPageWords(plainFull, rawText);
    candidates = pageHitsRetry.length >= minWords
      ? mergeWordHits(pageHitsRetry)
      : mergeWordHits(
        candidates.map((word, pos) => ({ word, pos })),
        pageHitsRetry,
        recoverOrderedWorksheetWords(plainFull),
        extractGridHeadChars(rawText),
        extractPipeDelimitedPairs(rawText),
        extractGenericGridWords(rawText),
      );
  }

  candidates = candidates.filter((w) => isValidExtractedWord(w) && isKnownWord(w));
  candidates = dedupeVocabWords(candidates);

  if (candidates.length < minWords) {
    return [];
  }

  const { matchedQuestions } = resolveCustomVocabFromInput(candidates.slice(0, maxWords), {
    source: 'ocr_vocab_parser',
    seed,
    maxWords,
  });

  return matchedQuestions.filter((q) => isValidExtractedWord(q.word)).slice(0, maxWords);
}
