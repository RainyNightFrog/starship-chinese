/**
 * 依 OCR / AI 擷取的文章段落，生成與文意對應的理解題
 * 出題來源：readingDynamicQuestionEngine（進階樣版池 + 真隨機洗牌）
 */

import {
  formatPassageLines,
  normalizeReadingPayload,
  schemaToQuestionPack,
} from './readingSchema';
import { applyDualTrackEngine, extractCoreKeywords } from './readingDualTrackEngine';
import { buildTrackBCacheKey, writeTrackBCache, readTrackBCache } from './readingTrackBCache';
import { sanitizeArticleLines } from './readingTextQuality';
import {
  generateDynamicQuestions,
  dynamicQuestionsToLegacyFormat,
} from './readingDynamicQuestionEngine.js';
import { generateQuestionsFromOcr } from './generateQuestionsFromOcr.js';

const TRANSITION_WORDS = [
  { word: '因此', meaning: '承上啟下，引出結果或結論' },
  { word: '所以', meaning: '承接前文，說明原因與結果' },
  { word: '然而', meaning: '表示轉折，前後意思不同' },
  { word: '但是', meaning: '表示轉折或對比' },
  { word: '雖然', meaning: '表示讓步，後文常有轉折' },
  { word: '於是', meaning: '承接前文，引出後續行動或結果' },
  { word: '而且', meaning: '表示遞進、補充說明' },
  { word: '况且', meaning: '進一步補充理由' },
];

function shortenLine(line, max = 28) {
  const text = String(line ?? '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function pickDistinctOptions(correct, pool, count = 4) {
  const options = [correct];
  pool.filter((item) => item !== correct).forEach((item) => {
    if (options.length < count && !options.includes(item)) options.push(item);
  });
  const fallbacks = ['與文章內容無關', '未能概括重點', '意思與原文相反', '只提及次要細節'];
  fallbacks.filter((item) => item !== correct && !options.includes(item)).forEach((item) => {
    if (options.length < count) options.push(item);
  });
  return options.slice(0, count);
}

function pickDistractorsFromArticle(correct, articleLines, count = 3) {
  const pool = articleLines
    .map((line) => shortenLine(line, 24))
    .filter((line) => line && line !== correct);
  return pool.filter((item, idx, arr) => arr.indexOf(item) === idx).slice(0, count);
}

function findTransitionInLines(lines) {
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const match = TRANSITION_WORDS.find(({ word }) => line.includes(word));
    if (match) return { lineIndex, ...match };
  }
  return null;
}

function buildLineMeaningQuestion(lines) {
  const lineIndex = lines.findIndex((line) => line.length >= 8);
  const targetIndex = lineIndex >= 0 ? lineIndex : 0;
  const targetLine = lines[targetIndex];
  const correct = shortenLine(targetLine, 30);
  const distractors = pickDistractorsFromArticle(correct, lines);

  return {
    question: `Q1. 根據文章第${targetIndex + 1}行，下列哪一項描述最貼切？`,
    options: pickDistinctOptions(correct, distractors.length >= 3 ? distractors : [
      shortenLine(lines[Math.min(1, lines.length - 1)], 24),
      shortenLine(lines[Math.max(0, lines.length - 2)], 24),
      '與該行內容無關',
    ]),
    correctIndex: 0,
    explanation: `第${targetIndex + 1}行重點是：${correct}`,
    hint: `請細讀第${targetIndex + 1}行。`,
  };
}

function buildTransitionQuestion(lines, transition) {
  if (transition) {
    const { lineIndex, word, meaning } = transition;
    const distractors = pickDistractorsFromArticle(meaning, lines, 3);
    return {
      question: `Q2. 第${lineIndex + 1}行的「${word}」表示什麼關係？`,
      options: pickDistinctOptions(meaning, distractors.length >= 3 ? distractors : [
        '表示時間順序',
        '表示並列列舉',
        '表示相反或無關',
      ]),
      correctIndex: 0,
      explanation: `第${lineIndex + 1}行出現「${word}」，${meaning}。`,
      hint: `留意第${lineIndex + 1}行的連接詞「${word}」。`,
    };
  }

  const lineIndex = Math.min(1, lines.length - 1);
  const targetLine = lines[lineIndex];
  const correct = shortenLine(targetLine, 30);
  const distractors = pickDistractorsFromArticle(correct, lines);

  return {
    question: `Q2. 第${lineIndex + 1}行主要說明什麼？`,
    options: pickDistinctOptions(correct, distractors.length >= 3 ? distractors : [
      '與該行無關的內容',
      '只描述背景，不是重點',
      '與文章其他部分矛盾',
    ]),
    correctIndex: 0,
    explanation: `第${lineIndex + 1}行重點是：${correct}`,
    hint: `請細讀第${lineIndex + 1}行。`,
  };
}

function buildThemeQuestion(lines) {
  const summaryLine = lines[lines.length - 1] ?? lines[0] ?? '';
  const correct = shortenLine(summaryLine, 30);
  const distractors = pickDistractorsFromArticle(correct, lines, 3).filter((item) => item !== correct);

  return {
    question: 'Q3. 綜合全文，下列哪一項最能概括文章重點？',
    options: pickDistinctOptions(correct, distractors.length >= 3 ? distractors : [
      shortenLine(lines[0], 24),
      shortenLine(lines[Math.min(1, lines.length - 1)], 24),
      '只描述細節，未能概括全文',
    ]),
    correctIndex: 0,
    explanation: `綜合全文，重點接近：${correct}`,
    hint: '留意文章最後一段的總結。',
  };
}

function buildProgrammaticQuestions(lines, seed) {
  const keywords = extractCoreKeywords(lines);
  const dynamic = generateDynamicQuestions(lines, {
    minCount: 3,
    maxCount: 5,
    seed,
    keywords,
  });
  if (dynamic.length >= 3) {
    return dynamicQuestionsToLegacyFormat(dynamic);
  }
  // 極端兜底：舊邏輯三題
  const transition = findTransitionInLines(lines);
  return [
    buildLineMeaningQuestion(lines),
    buildTransitionQuestion(lines, transition),
    buildThemeQuestion(lines),
  ];
}

/** 依 articleLines 動態隨機出題（3–5 題） */
export function buildProgrammaticQuestionsForLines(lines = [], seed) {
  return buildProgrammaticQuestions(lines, seed);
}

function resolveArticleLines(parsed = {}) {
  const rawLines = parsed.articleLines ?? parsed.passageLines ?? parsed.lines ?? [];
  return sanitizeArticleLines(Array.isArray(rawLines) ? rawLines : [rawLines]);
}

/** 將 Vision 大模型動態 JSON 題目轉為內部 pack 格式 */
function buildQuestionsFromVisionAi(parsed = {}, articleLines = [], fileLabel = '校本閱讀') {
  const rawQuestions = parsed.questions ?? [];
  if (!parsed.questionsFromAi || rawQuestions.length < 3) {
    return null;
  }
  // Vision AI 題目仍走舊路徑

  const schemaQuestions = rawQuestions.map((item, index) => ({
    id: item.id ?? index + 1,
    questionText: String(item.questionText ?? item.question ?? '').replace(/^Q\d\.\s*/, ''),
    options: item.options ?? [],
    correctAnswerIndex: item.correctAnswerIndex ?? item.correctIndex ?? 0,
    hint: item.hint ?? item.explanation ?? '',
  }));

  const pack = schemaToQuestionPack({
    articleTitle: parsed.articleTitle ?? parsed.passageTitle ?? fileLabel,
    articleLines,
    questions: schemaQuestions,
  }, fileLabel);

  return pack.questions;
}

/** 雙軌引擎 + Vision 動態出題（優先）或貼上文字程序化出題 */
export function buildReadingPackFromPage(parsed = {}, fileLabel = '校本閱讀') {
  if (parsed.code === 'image_too_blurry' || parsed.qualityReason === 'image_too_blurry') {
    return buildOcrFallbackPack(fileLabel, 0, 'image_too_blurry');
  }

  const rawLines = parsed.rawFragments ?? parsed.rawLines ?? [];
  const preKeywords = parsed.coreKeywords?.length
    ? parsed.coreKeywords
    : extractCoreKeywords(rawLines);
  const cacheKey = buildTrackBCacheKey(preKeywords);
  const cachedPack = cacheKey ? readTrackBCache(cacheKey) : null;

  if (cachedPack && (parsed.contentTrack === 'B' || cachedPack.contentTrack === 'B')) {
    const title = cachedPack.articleTitle || fileLabel;
    return {
      passage: formatPassageLines(cachedPack.articleLines),
      articleLines: cachedPack.articleLines,
      passageTitle: title.startsWith('校本') ? title : `校本閱讀：${title}`,
      genre: '校本閱讀（主題擴寫 · 快取）',
      questions: cachedPack.questions,
      lineCount: cachedPack.articleLines.length,
      contentTrack: 'B',
      coreKeywords: cachedPack.coreKeywords ?? preKeywords,
      expandedBy: 'cache',
      fromCache: true,
      fromVision: Boolean(parsed.fromVision),
    };
  }

  const dual = applyDualTrackEngine(
    {
      ...parsed,
      articleTitle: parsed.articleTitle ?? parsed.passageTitle ?? fileLabel,
      articleLines: resolveArticleLines(parsed),
    },
    {
      rawLines,
      rawText: parsed.rawText ?? rawLines.join('\n'),
    },
  );

  const articleLines = dual.articleLines ?? [];

  if (articleLines.length < 2) {
    return buildOcrFallbackPack(fileLabel, 0, parsed.qualityReason ?? 'passage_too_short');
  }

  const title = dual.articleTitle || fileLabel;

  const schemaQuestions = (parsed.questions ?? []).length >= 3
    ? parsed.questions.map((item, index) => ({
        id: item.id ?? index + 1,
        questionText: String(item.questionText ?? item.question ?? '').replace(/^Q\d\.\s*/, ''),
        options: item.options ?? [],
        correctAnswerIndex: item.correctAnswerIndex ?? item.correctIndex ?? 0,
        hint: item.hint ?? item.explanation ?? '',
      }))
    : null;

  const regenSeed = Date.now();
  const questions = schemaQuestions?.length >= 3
    ? schemaToQuestionPack({
        articleTitle: title,
        articleLines,
        questions: schemaQuestions,
      }, fileLabel).questions
    : dual.cachedQuestions?.length >= 3
      ? dual.cachedQuestions
      : buildProgrammaticQuestions(articleLines, regenSeed);

  const genre = dual.fromCache
    ? '校本閱讀（主題擴寫 · 快取）'
    : parsed.stitched
      ? '校本閱讀（多頁拼讀）'
      : dual.contentTrack === 'B'
        ? '校本閱讀（主題擴寫）'
        : '校本閱讀';

  if (dual.contentTrack === 'B' && articleLines.length >= 2 && !dual.fromCache && cacheKey) {
    writeTrackBCache(cacheKey, {
      articleTitle: title,
      articleLines,
      coreKeywords: dual.coreKeywords ?? preKeywords,
      questions,
      expandedBy: dual.expandedBy,
    });
  }

  return {
    passage: formatPassageLines(articleLines),
    articleLines,
    passageTitle: title.startsWith('校本') ? title : `校本閱讀：${title}`,
    genre,
    questions,
    lineCount: articleLines.length,
    contentTrack: dual.contentTrack,
    coreKeywords: dual.coreKeywords ?? [],
    expandedBy: dual.expandedBy,
    fromCache: Boolean(dual.fromCache),
    fromVision: false,
    questionsFromAi: false,
  };
}

/** 由 OCR 行生成 passage + 3–5 道動態理解題 */
export function buildReadingPackFromLines(lines = [], fileLabel = '校本閱讀') {
  const safeLines = sanitizeArticleLines(lines);
  if (safeLines.length < 2) {
    const generated = generateQuestionsFromOcr(lines.join('\n'));
    if (generated.articleLines.length >= 2 && generated.questions.length >= 3) {
      const pack = schemaToQuestionPack({
        articleTitle: generated.articleTitle,
        articleLines: generated.articleLines,
        questions: generated.questions,
      }, fileLabel);
      return {
        passage: formatPassageLines(generated.articleLines),
        articleLines: generated.articleLines,
        passageTitle: pack.passageTitle,
        genre: '校本閱讀（智能擴寫）',
        questions: pack.questions,
        lineCount: generated.articleLines.length,
        contentTrack: generated.contentTrack,
        expandedBy: generated.expandedBy,
      };
    }
    return buildOcrFallbackPack(fileLabel, 0, 'passage_too_short');
  }

  const pack = schemaToQuestionPack({
    articleTitle: fileLabel,
    articleLines: safeLines,
    questions: buildProgrammaticQuestions(safeLines, Date.now()).map((item, index) => ({
      id: index + 1,
      questionText: item.question.replace(/^Q\d\.\s*/, ''),
      options: item.options,
      correctAnswerIndex: item.correctIndex,
      hint: item.hint ?? item.explanation,
    })),
  }, fileLabel);

  return {
    passage: formatPassageLines(safeLines),
    articleLines: safeLines,
    passageTitle: pack.passageTitle,
    genre: '校本閱讀',
    questions: pack.questions,
    lineCount: safeLines.length,
  };
}

/** OCR 失敗時的提示型占位（不再顯示亂碼文章） */
export function buildOcrFallbackPack(fileLabel, pageIndex, reason = 'unknown') {
  const tipsByReason = {
    passage_garbled: '系統讀到的文字雜訊太多，未能還原文章。',
    options_in_passage: '圖片同時包含試題與選項，請改為只拍「閱讀文章」段落。',
    passage_too_short: '未能擷取足夠的文章句子。',
    image_too_blurry: '圖片太模糊了，請開燈重新拍照，或者直接使用「貼上文章文字」功能喔！',
    vision_no_questions: 'AI 未能生成扣緊文章的動態理解題，請重試或改用較清晰的圖片。',
    pdf_unsupported: 'PDF 暫不支援，請改為拍照上載。',
    no_preview: '找不到圖片預覽，請重新上載。',
  };
  const tip = tipsByReason[reason] ?? '請重新上載清晰、完整的閱讀文章頁面。';

  const articleLines = [
    `（第 ${pageIndex + 1} 頁 · 未能生成閱讀內容）`,
    tip,
    '建議只拍「閱讀材料／範文段落」，不要連題目和 A B C D 選項一起拍。',
    '光線要充足、文字要清楚，拍完再按「開始 AI 解析」。',
  ];

  const passage = formatPassageLines(articleLines);

  const questions = [
    {
      question: 'Q1. 若系統未能辨識文章，家長應怎麼做？',
      options: pickDistinctOptions('重新上載清晰圖片', ['忽略並繼續', '改用默書上載', '無需任何操作']),
      correctIndex: 0,
      explanation: '圖片不清晰或文字太少時，OCR 可能失敗，請重新上載。',
      hint: '重新上載清晰圖片。',
    },
    {
      question: 'Q2. 上載閱讀材料時，哪項做法較佳？',
      options: pickDistinctOptions('拍攝完整、光線充足的頁面', ['只拍一角', '使用模糊照片', '上載無文字圖片']),
      correctIndex: 0,
      explanation: '完整清晰的頁面有助 OCR 擷取真實文章。',
      hint: '光線充足、文字清楚。',
    },
    {
      question: 'Q3. 閱讀理解上載應使用哪個按鈕？',
      options: pickDistinctOptions('📖 上載閱讀文章', ['📷 上載新詞表', '📋 上載試卷', '無需上載']),
      correctIndex: 0,
      explanation: '閱讀文章請使用「📖 上載閱讀文章」。',
      hint: '使用「📖 上載閱讀文章」。',
    },
  ];

  return {
    passage,
    articleLines,
    passageTitle: `校本閱讀：${fileLabel}`,
    genre: '校本閱讀（待重新上載）',
    questions,
    lineCount: 0,
    ocrFailed: true,
  };
}

export { formatPassageLines };
