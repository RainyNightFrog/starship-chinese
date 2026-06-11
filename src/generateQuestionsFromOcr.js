/**
 * 香港小五/小六呈分試 — 純 JS 動態閱讀理解出題引擎（主入口）
 * ─────────────────────────────────────────────────────────────
 * 流程：OCR 全文 → Advanced Text Sanitizer → 純淨正文 → 隨機 3 題 → 標準物件陣列
 *
 * @param {string} ocrText — Tesseract / 貼上全文
 * @param {{ seed?: number, questionCount?: number }} [options]
 */

import {
  cleanReadingLine,
  sanitizeArticleLines,
  denoiseOcrTextPreserveLines,
  sanitizeReadingOption,
  isGarbageOption,
  hasExamOptionArtifact,
} from './readingTextQuality.js';
import {
  advancedSanitizeOcrText,
  assertCleanArticleLines,
} from './readingAdvancedTextSanitizer.js';
import { normalizeReadingPayload } from './readingSchema.js';
import {
  createRng,
  sliceTextToSentences,
  sentencesToPassageLines,
  generateDynamicQuestions,
  expandCampusResilienceArticle,
  needsSmartExpansion,
  extractCoreKeywords,
  isFragmentWorksheet,
} from './readingDynamicQuestionEngine.js';
import {
  syncAndExpandSharedPool,
  pickRandomSharedIdiomQuestions,
  pickRandomSharedMethodQuestions,
  generateContributorLabel,
} from './globalSharedPool.js';
import { generateQuestionsFromCustomWords } from './customVocabMatcher.js';
import { saveUploadedPreviewWords } from './prestudyDictationBridge.js';

const DEFAULT_QUESTION_COUNT = 5;

/** 校名 / 分數欄 / 試卷雜訊（行內清理用） */
const SCHOOL_NOISE = /嗇色園|可信(?:小學|學校)?|保良局|聖公會|官立|津貼|band\s*[123]|小學|中學|學校|姓名|班別|學號|日期|滿分|得分|分數|___+|…{2,}|\.{4,}/gi;
const SCORE_NOISE = /\(\s*\d+\s*分\s*\)|\d+\s*\/\s*\d+\s*分|^\s*\d+\s*分\s*$/gm;
const ENGLISH_GARBAGE = /[A-Za-z]{4,}/g;

/** 文字去噪 — 保留換行，供 Sanitizer 切割 */
export function denoiseOcrText(ocrText = '') {
  let text = denoiseOcrTextPreserveLines(ocrText);
  text = text.replace(SCORE_NOISE, ' ');
  text = text.replace(SCHOOL_NOISE, ' ');
  text = text.replace(ENGLISH_GARBAGE, (match) => (match.length <= 3 ? match : ' '));
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 標準化單題物件（供 currentQuestionIndex 跳轉） */
function normalizeQuestionObject(q, index) {
  const questionText = cleanReadingLine(String(q.questionText ?? '').replace(/^Q\d+[\.．、\s]*/i, ''));
  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const seen = new Set();
  const options = [];

  rawOptions.forEach((opt) => {
    const cleaned = sanitizeReadingOption(opt);
    if (!cleaned || seen.has(cleaned) || hasExamOptionArtifact(cleaned) || isGarbageOption(cleaned)) return;
    options.push(cleaned);
    seen.add(cleaned);
  });

  if (options.length < 4) return null;

  let correctAnswerIndex = Number(q.correctAnswerIndex ?? q.correctIndex ?? 0);
  const correctRaw = sanitizeReadingOption(rawOptions[correctAnswerIndex] ?? options[0]);
  correctAnswerIndex = options.indexOf(correctRaw);
  if (correctAnswerIndex < 0) correctAnswerIndex = 0;

  return {
    id: index + 1,
    questionText,
    options: options.slice(0, 4),
    correctAnswerIndex,
    hint: String(q.hint ?? q.explanation ?? '請對照原文理解文意。').trim(),
    isCommunityShared: Boolean(q.isCommunityShared),
    contributorLabel: q.contributorLabel,
    sharedPoolId: q.sharedPoolId,
    source: q.source,
  };
}

function dedupeQuestions(questions = []) {
  const seen = new Set();
  const list = [];
  questions.forEach((q) => {
    const normalized = normalizeQuestionObject(q, list.length);
    if (!normalized) return;
    const key = normalized.questionText;
    if (!key || seen.has(key)) return;
    seen.add(key);
    list.push(normalized);
  });
  return list;
}

function mergeSharedPoolQuestions(questions = [], articleLines = [], seed, targetCount) {
  const seen = new Set(questions.map((q) => q.questionText));
  const merged = [...questions];

  // 從中央共享庫注入寫作手法題 + 四字詞語題（前人載樹，後人乘涼）
  const sharedMethods = pickRandomSharedMethodQuestions(2, seed + 17);
  const sharedIdioms = pickRandomSharedIdiomQuestions(1, seed + 31);

  [...sharedMethods, ...sharedIdioms].forEach((q) => {
    if (merged.length >= targetCount) return;
    if (!q?.questionText || seen.has(q.questionText)) return;
    seen.add(q.questionText);
    const normalized = normalizeQuestionObject(q, merged.length);
    merged.push(normalized ? { ...q, ...normalized } : q);
  });

  return merged.slice(0, targetCount).map((q, i) => ({ ...q, id: i + 1 }));
}

function ensureQuestionCount(questions = [], articleLines = [], keywords = [], seed, targetCount = DEFAULT_QUESTION_COUNT) {
  let list = dedupeQuestions(questions);

  if (list.length < targetCount) {
    const extra = generateDynamicQuestions(articleLines, {
      minCount: targetCount,
      maxCount: targetCount,
      seed: seed != null ? Number(seed) + list.length : undefined,
      keywords,
    });
    extra.forEach((q) => {
      const normalized = normalizeQuestionObject(q, list.length);
      if (!normalized) return;
      if (list.length < targetCount && !list.some((x) => x.questionText === normalized.questionText)) {
        list.push({ ...normalized, id: list.length + 1 });
      }
    });
  }

  // 最後一步：對接中央共享庫，混入全港 UGC 題目
  return mergeSharedPoolQuestions(list, articleLines, seed, targetCount);
}

function resolveArticleFromOcr(cleanedText, cleanArticleLines, coreKeywords) {
  let articleTitle = '校本閱讀';
  let expandedBy = 'ocr_sanitizer';
  let articleLines = assertCleanArticleLines(cleanArticleLines);

  if (articleLines.length < 2) {
    articleLines = assertCleanArticleLines(
      sanitizeArticleLines(sentencesToPassageLines(sliceTextToSentences(cleanedText))),
    );
  }

  const fragments = articleLines.filter((l) => l.length >= 4);
  const passageReady = articleLines.length >= 3 && articleLines.join('').length >= 120;

  if (!passageReady && (needsSmartExpansion(cleanedText, articleLines) || isFragmentWorksheet(fragments, articleLines))) {
    const campus = expandCampusResilienceArticle(coreKeywords, fragments);
    articleLines = assertCleanArticleLines(campus.articleLines);
    articleTitle = campus.articleTitle;
    expandedBy = 'campus_resilience_expand';
    return { articleTitle, articleLines, expandedBy, contentTrack: 'B' };
  }

  const normalized = normalizeReadingPayload({
    articleTitle,
    articleLines,
    questions: [],
  });

  return {
    articleTitle: normalized.articleTitle,
    articleLines: assertCleanArticleLines(normalized.articleLines),
    expandedBy: articleLines.length >= 2 ? expandedBy : 'programmatic',
    contentTrack: 'A',
  };
}

/**
 * 純 JS 動態出題主入口
 * @returns {{ articleTitle, articleLines, questions, contentTrack, coreKeywords, expandedBy, source, questionCount }}
 */
export function generateQuestionsFromOcr(ocrText = '', options = {}) {
  /** 詞表模式：家長指定詞彙 → 精準配對 IDIOM_EXAM_POOL（禁止 random 盲抽） */
  if (options.customWordsInput?.length) {
    const { matchedQuestions, customWordsInput } = generateQuestionsFromCustomWords(
      options.customWordsInput,
      options,
    );
    /** 固化 localStorage 管道 — 完整 IDIOM 物件 + 純文字默書陣列 */
    if (options.persistPreviewWords !== false && matchedQuestions.length) {
      saveUploadedPreviewWords(matchedQuestions);
    }
    return {
      articleTitle: '校本自訂詞表',
      articleLines: [],
      questions: matchedQuestions,
      contentTrack: 'vocab_custom',
      coreKeywords: customWordsInput,
      expandedBy: 'strict_vocab_match',
      source: options.source ?? 'custom_words_input',
      questionCount: matchedQuestions.length,
    };
  }

  const { seed, questionCount = DEFAULT_QUESTION_COUNT } = options;
  const { randInt } = createRng(seed ?? Date.now());

  const cleanedText = denoiseOcrText(ocrText);

  // ① 前置結構隔離器 — 100% 剝除考卷試題／選項行
  const { cleanArticleLines, droppedCount, hitWorksheet } = advancedSanitizeOcrText(cleanedText);

  // ② UGC Auto-Ingestor：以「清洗後正文」掃描新詞 → 去重 → 寫入 starship_global_idioms
  const storyBody = cleanArticleLines.join('\n');
  const ugcIngest = syncAndExpandSharedPool(storyBody, {
    seed: seed ?? Date.now(),
    contributorLabel: options.contributorLabel ?? generateContributorLabel(seed ?? Date.now()),
    source: 'ugc_photo_scan',
    customIdioms: options.customIdioms,
    customMethods: options.customMethods,
  });

  const coreKeywords = extractCoreKeywords(cleanArticleLines);

  const resolved = resolveArticleFromOcr(cleanedText, cleanArticleLines, coreKeywords);
  const { articleTitle, articleLines, expandedBy, contentTrack } = resolved;

  const questionSeed = seed ?? Date.now() + randInt(100000);

  const questions = ensureQuestionCount(
    generateDynamicQuestions(articleLines, {
      minCount: questionCount,
      maxCount: questionCount,
      seed: questionSeed,
      keywords: coreKeywords,
    }),
    articleLines,
    coreKeywords,
    questionSeed,
    questionCount,
  );

  return {
    articleTitle,
    articleLines,
    questions,
    questionCount: questions.length,
    contentTrack,
    coreKeywords,
    expandedBy,
    source: 'ocr-dynamic-engine',
    sanitizer: { droppedCount, hitWorksheet },
    ugcIngest,
  };
}
