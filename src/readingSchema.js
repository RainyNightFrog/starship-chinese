/**
 * 閱讀理解 — 標準 JSON Schema 正規化、驗證與前端映射
 *
 * AI / Mock 輸出格式：
 * {
 *   articleTitle, articleLines[], questions[{ id, questionText, options, correctAnswerIndex, hint }]
 * }
 */

import {
  cleanReadingLine,
  isGarbageOption,
  isNoiseLine,
  isQuestionFragmentLine,
  sanitizeArticleLines,
} from './readingTextQuality.js';
import { sanitizeReadingBankItem } from './readingDisplayGuard.js';
import { READING_MAX_QUESTIONS } from './readingConstants.js';

export const READING_AI_JSON_EXAMPLE = {
  articleTitle: '文章標題（由AI根據內容擬定）',
  articleLines: [
    '第一行：乾淨的文章內文...',
    '第二行：乾淨的文章內文...',
  ],
  questions: [
    {
      id: 1,
      questionText: '針對這篇文章的精準提問？',
      options: ['正確答案', '合理干擾項B', '合理干擾項C', '合理干擾項D'],
      correctAnswerIndex: 0,
      hint: '給學生的字義或段落提示',
    },
  ],
};

function clampIndex(value, max = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.floor(n)));
}

function normalizeOptions(rawOptions = []) {
  const seen = new Set();
  const options = rawOptions
    .map((opt) => cleanReadingLine(opt))
    .filter((opt) => opt.length >= 2 && !isGarbageOption(opt))
    .filter((opt) => {
      if (seen.has(opt)) return false;
      seen.add(opt);
      return true;
    });

  return options;
}

function normalizeQuestion(item = {}, index = 0) {
  const options = normalizeOptions(item.options ?? []);
  let correctAnswerIndex = clampIndex(item.correctAnswerIndex ?? item.correctIndex ?? 0, options.length - 1);
  if (correctAnswerIndex >= options.length) correctAnswerIndex = 0;

  return {
    id: item.id ?? index + 1,
    questionText: cleanReadingLine(item.questionText ?? item.question ?? ''),
    options,
    correctAnswerIndex,
    hint: String(item.hint ?? item.explanation ?? '').trim(),
  };
}

/** 正規化 AI / OCR / 舊格式 payload → 標準 schema */
export function normalizeReadingPayload(raw = {}) {
  const rawLines = raw.articleLines ?? raw.passageLines ?? raw.lines ?? [];
  const articleLines = sanitizeArticleLines(
    Array.isArray(rawLines) ? rawLines : [rawLines],
  );

  const articleTitle = cleanReadingLine(raw.articleTitle ?? raw.passageTitle ?? '')
    || '校本閱讀';

  const questions = (raw.questions ?? [])
    .slice(0, READING_MAX_QUESTIONS)
    .map((item, index) => normalizeQuestion(item, index))
    .filter((item) => item.questionText.length >= 6 && item.options.length >= 4);

  return { articleTitle, articleLines, questions };
}

/**
 * 嚴格校驗 Vision 大模型動態 JSON（後端 Retry 依據）
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateStrictReadingAiResponse(payload = {}) {
  const errors = [];
  const articleTitle = cleanReadingLine(payload.articleTitle ?? '');
  const articleLines = payload.articleLines ?? [];
  const questions = payload.questions ?? [];

  if (articleTitle.length < 2) {
    errors.push('缺少有效的 articleTitle');
  }
  if (!Array.isArray(articleLines) || articleLines.length < 2) {
    errors.push('articleLines 至少需要 2 行正文');
  } else if (articleLines.join('').length < 80) {
    errors.push('articleLines 正文過短，未能構成完整閱讀材料');
  }
  if (!Array.isArray(questions) || questions.length < 3 || questions.length > 8) {
    errors.push(`questions 須為 3–8 題（目前 ${questions.length} 題）`);
  } else {
    questions.forEach((q, i) => {
      const label = `第 ${i + 1} 題`;
      const text = cleanReadingLine(q.questionText ?? q.question ?? '');
      if (text.length < 8) errors.push(`${label} questionText 過短或缺失`);
      const opts = q.options ?? [];
      if (!Array.isArray(opts) || opts.length !== 4) {
        errors.push(`${label} options 必須恰好 4 個（目前 ${opts.length} 個）`);
      } else {
        opts.forEach((opt, oi) => {
          if (cleanReadingLine(opt).length < 2) {
            errors.push(`${label} 選項 ${oi + 1} 無效`);
          }
        });
        const unique = new Set(opts.map((o) => cleanReadingLine(o)));
        if (unique.size < 4) errors.push(`${label} 選項不可重複`);
      }
      const idx = Number(q.correctAnswerIndex ?? q.correctIndex);
      if (!Number.isFinite(idx) || idx < 0 || idx > 3) {
        errors.push(`${label} correctAnswerIndex 必須為 0–3`);
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

function extractLineReference(questionText = '') {
  const match = questionText.match(/第([一二三四五六七八九十\d]+)行/);
  if (!match) return null;
  const numMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  const token = match[1];
  if (/^\d+$/.test(token)) return Number(token) - 1;
  if (token.length === 1 && numMap[token] != null) return numMap[token] - 1;
  if (token === '十') return 9;
  return null;
}

function sharesArticleFragment(text = '', articleLines = []) {
  const cleaned = cleanReadingLine(text);
  if (!cleaned || cleaned.length < 2) return false;

  const article = articleLines.join('');
  if (article.includes(cleaned)) return true;

  const chars = [...cleaned].filter((c) => /[\u4e00-\u9fff]/.test(c));
  if (!chars.length) return false;

  for (let size = Math.min(4, chars.length); size >= 2; size -= 1) {
    for (let i = 0; i <= chars.length - size; i += 1) {
      const fragment = chars.slice(i, i + size).join('');
      if (article.includes(fragment)) return true;
    }
  }

  const matched = chars.filter((c) => article.includes(c)).length;
  return matched / chars.length >= 0.72;
}

function extractQuotedWord(questionText = '') {
  const match = questionText.match(/「([^」]{1,8})」/);
  return match?.[1] ?? null;
}

/** 驗證 AI 題目是否扣緊文章（程序化出題不在此列） */
export function validateQuestionGrounding(question, articleLines = []) {
  const { questionText, options, correctAnswerIndex } = question;
  if (!questionText || questionText.length < 6) return false;
  if (isNoiseLine(questionText) || isQuestionFragmentLine(questionText)) return false;
  if (options.length < 3) return false;
  if (options.some((opt) => isGarbageOption(opt))) return false;

  const correct = options[correctAnswerIndex];
  if (!correct || isGarbageOption(correct)) return false;

  const lineRef = extractLineReference(questionText);
  if (lineRef != null && lineRef >= 0 && lineRef < articleLines.length) {
    const targetLine = articleLines[lineRef];
    if (sharesArticleFragment(correct, [targetLine])) return true;
  }

  const quoted = extractQuotedWord(questionText);
  if (quoted && articleLines.some((line) => line.includes(quoted))) {
    return sharesArticleFragment(correct, articleLines) || correct.length <= 12;
  }

  if (sharesArticleFragment(correct, articleLines)) return true;

  const articleChars = new Set(
    [...articleLines.join('')].filter((c) => /[\u4e00-\u9fff]/.test(c)),
  );
  const correctChars = [...correct].filter((c) => /[\u4e00-\u9fff]/.test(c));
  const overlap = correctChars.filter((c) => articleChars.has(c)).length;
  return correctChars.length >= 4 && overlap / correctChars.length >= 0.65;
}

export function filterGroundedQuestions(questions = [], articleLines = []) {
  return questions.filter((q) => {
    if (!validateQuestionGrounding(q, articleLines)) return false;
    const match = validateQuestionArticleMatch(q.questionText ?? '', articleLines);
    if (!match.ok) return false;
    const topicMatch = validateOptionsTopicMatch(q.options ?? [], articleLines);
    return topicMatch.ok;
  });
}

/** 選項是否提及某主題但正文完全無關（防 profile 誤判） */
const READING_TOPIC_SIGNATURES = [
  {
    label: '孔子',
    optionTerms: /孔子|孔廟|論語|六經|萬世師表|儒家思想|仲尼/,
    articleTerms: /孔子|仲尼|孔丘|儒家|六經|論語|萬世師表|有教無類/,
  },
  {
    label: '端午節',
    optionTerms: /端午|屈原|粽子|龍舟|汨羅/,
    articleTerms: /端午|屈原|粽子|龍舟|汨羅/,
  },
  {
    label: '米',
    optionTerms: /稻米|糯米|粳米|糙米|粒粒皆辛苦|誰知盤中飧/,
    articleTerms: /米飯|稻米|稻穀|糯米|粳米|糙米|粒粒皆辛苦/,
  },
  {
    label: '紅樹',
    optionTerms: /紅樹|紅樹林|濕地公園|鹽腺/,
    articleTerms: /紅樹|紅樹林|濕地|鹽腺/,
  },
];

export function validateOptionsTopicMatch(options = [], articleLines = []) {
  const plainArticle = articleLines
    .map((line) => cleanReadingLine(line).replace(/^第[一二三四五六七八九十\d]+行[：:]?/, ''))
    .join('');

  for (const sig of READING_TOPIC_SIGNATURES) {
    const optionHits = options.filter((opt) => sig.optionTerms.test(String(opt ?? ''))).length;
    if (optionHits >= 2 && !sig.articleTerms.test(plainArticle)) {
      return { ok: false, reason: `選項涉及「${sig.label}」但正文無相關內容` };
    }
  }

  return { ok: true, reason: 'matched' };
}

/** 題幹關鍵字是否能在文章中找到（防脫節） */
export function validateQuestionArticleMatch(questionText = '', articleLines = []) {
  const plainArticle = articleLines
    .map((line) => cleanReadingLine(line).replace(/^第[一二三四五六七八九十\d]+行[：:]?/, ''))
    .join('');

  const ABSTRACT_MISMATCH_TERMS = [
    '幸福', '真諦', '哲理', '人生道理', '生命意義', '真正的快樂', '作者認為', '中心思想', '寫作目的',
  ];

  for (const term of ABSTRACT_MISMATCH_TERMS) {
    if (questionText.includes(term) && !plainArticle.includes(term)) {
      return { ok: false, reason: `題目提及「${term}」但文章未出現` };
    }
  }

  const keywords = (questionText.match(/[\u4e00-\u9fff]{2,6}/g) ?? [])
    .filter((w) => !/下列|哪一|哪項|根據|文章|本文|作者|第/.test(w));
  if (keywords.length >= 2) {
    const hits = keywords.filter((w) => plainArticle.includes(w)).length;
    if (hits === 0) return { ok: false, reason: '題幹關鍵字與文章完全無交集' };
  }

  return { ok: true, reason: 'matched' };
}

/** 標準 schema → 內部出題 pack 格式 */
export function schemaToQuestionPack({ articleTitle, articleLines, questions }, fileLabel = '校本閱讀') {
  return {
    passageTitle: articleTitle.startsWith('校本') ? articleTitle : `校本閱讀：${articleTitle || fileLabel}`,
    articleLines,
    questions: questions.map((item, index) => ({
      id: item.id ?? index + 1,
      question: /^Q\d/.test(item.questionText) ? item.questionText : `Q${index + 1}. ${item.questionText}`,
      options: [...item.options],
      correctIndex: item.correctAnswerIndex,
      explanation: item.hint || '請對照原文理解文意。',
      hint: item.hint || '',
      isCommunityShared: item.isCommunityShared,
      contributorLabel: item.contributorLabel,
      sharedPoolId: item.sharedPoolId,
      source: item.source,
    })),
  };
}

/** 內部 pack → 學生端 readingBank 單題（含渲染前防亂碼清洗） */
export function mapToReadingBankEntry({
  pack,
  question,
  qi,
  seed,
  passageIndex,
  genre = '校本閱讀',
  ocrFailed = false,
  passageQuestionTotal = 3,
}) {
  const passageId = `ai-read-${seed}-${passageIndex}`;
  const passageLines = pack.articleLines ?? pack.passageLines ?? [];

  const entry = {
    id: `${passageId}-q${qi + 1}`,
    passageId,
    passageTitle: pack.passageTitle,
    genre,
    passage: passageLines.map((line, index) => `第${index + 1}行：${line}`),
    question: question.question.replace(/^Q\d\./, `Q${qi + 1}.`),
    options: [...question.options],
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    hint: question.hint ?? question.explanation ?? '',
    isAiGenerated: true,
    fromVisionDynamic: Boolean(pack.fromVisionDynamic ?? pack.questionsFromAi),
    ocrFailed,
    /** 同一篇文章內的題號（1–3），供進度條「第 X/Y 題」顯示 */
    questionNumberInPassage: qi + 1,
    passageQuestionTotal,
    isCommunityShared: question.isCommunityShared,
    contributorLabel: question.contributorLabel,
    sharedPoolId: question.sharedPoolId,
    source: question.source,
  };

  return sanitizeReadingBankItem(entry);
}

export function formatPassageLines(lines = []) {
  return lines.map((line, index) => `第${index + 1}行：${line}`);
}
