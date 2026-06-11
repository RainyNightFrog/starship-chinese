/**
 * 閱讀理解動態出題引擎 — 文章切片、真隨機洗牌、干擾項、短文擴寫
 * 香港小五／小六呈分試難度 · 純前端 · 無 LLM
 */

import {
  cleanReadingLine,
  sanitizeArticleLines,
  extractPassageBodyFromOcrText,
  truncateLineBeforeWorksheet,
  trimAtPhraseBoundary,
  sanitizeReadingOption,
  isValidOptionCandidate,
  isGarbageOption,
} from './readingTextQuality.js';
import { READING_MAX_ARTICLE_LINES } from './readingConstants.js';

const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '他', '她', '它', '們', '這', '那', '有', '和', '與',
  '也', '就', '都', '而', '及', '或', '把', '被', '讓', '向', '从', '從', '到', '為',
  '上', '下', '中', '不', '很', '更', '最', '能', '會', '要', '可以', '應該', '請',
  '下列', '哪一', '哪項', '根據', '文章', '作者', '本文', '句子', '詞語', '選項',
]);

/** 從零碎 OCR 提取核心詞（2–4 字） */
export function extractCoreKeywords(rawLines = [], max = 8) {
  const freq = new Map();
  const sources = rawLines.map((l) => cleanReadingLine(typeof l === 'string' ? l : l?.text ?? ''));

  sources.forEach((line) => {
    const matches = line.match(/[\u4e00-\u9fff]{2,4}/g) ?? [];
    matches.forEach((word) => {
      if (STOP_WORDS.has(word)) return;
      if (/錯別字|辨正|填空|成語|學校|試卷/.test(word)) return;
      freq.set(word, (freq.get(word) ?? 0) + 1);
    });
    const idiom = line.match(/[\u4e00-\u9fff]{4,8}/g) ?? [];
    idiom.forEach((w) => {
      if (w.length >= 4 && !STOP_WORDS.has(w)) {
        freq.set(w, (freq.get(w) ?? 0) + 2);
      }
    });
  });

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

/** 判斷是否為零碎考卷碎片（觸發擴寫軌道） */
export function isFragmentWorksheet(rawLines = [], articleLines = []) {
  const totalLen = articleLines.join('').length;
  if (articleLines.length >= 3 && totalLen >= 120) return false;

  const signals = [/錯別字|填空|成語|造句|_{2,}/, /^[A-DＡ-Ｄ][\.．、]/];
  let score = 0;
  rawLines.forEach((line) => {
    const l = cleanReadingLine(line);
    if (signals.some((p) => p.test(l))) score += 2;
    if (l.length > 0 && l.length < 18) score += 1;
  });
  return score >= 3 || totalLen < 200 || articleLines.length < 3;
}
import {
  ADVANCED_QUESTION_TEMPLATES,
  QUESTION_CATEGORIES,
  PRIORITY_TEMPLATE_IDS,
} from './readingAdvancedQuestionPool.js';
import { buildTypeSafeOptions } from './readingTypeSafeOptions.js';
import { getGlobalSharedMethods } from './globalSharedPool.js';

/** 將樣版實例化為標準 schema 題目（題型-選項強綁定） */
function instantiateTemplate(template, ctx) {
  const built = template.build(ctx);
  if (!built?.questionText || !built.correct) return null;

  const safe = buildTypeSafeOptions(built, ctx);
  if (!safe?.options?.length || safe.options.length < 4) return null;

  const rawOptions = safe.options.slice(0, 4);
  const options = rawOptions.map((opt) => sanitizeReadingOption(opt) || opt);
  if (options.length < 4 || options.some((opt) => !opt || isGarbageOption(opt))) return null;

  const correctRaw = sanitizeReadingOption(
    rawOptions[safe.correctAnswerIndex] ?? built.correct,
  ) || built.correct;
  let correctAnswerIndex = options.indexOf(correctRaw);
  if (correctAnswerIndex < 0) correctAnswerIndex = safe.correctAnswerIndex ?? 0;
  if (correctAnswerIndex >= options.length) correctAnswerIndex = 0;

  return {
    id: template.id,
    category: template.category,
    questionText: built.questionText,
    options: options.slice(0, 4),
    correctAnswerIndex,
    hint: built.hint ?? '請對照原文定位句理解文意。',
    optionMode: built.optionMode,
  };
}

// ─── 隨機數工具 ───────────────────────────────────────────

/** 建立可重現或真隨機的 RNG（seed 省略則每次不同） */
export function createRng(seed) {
  if (seed == null || seed === '') {
    return {
      rng: () => Math.random(),
      randInt: (n) => Math.floor(Math.random() * n),
    };
  }
  let state = (Number(seed) >>> 0) || 1;
  const rng = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state & 0x7fffffff) / 0x80000000;
  };
  return {
    rng,
    randInt: (n) => Math.floor(rng() * n),
  };
}

export function fisherYatesShuffle(array, randInt) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 文章切片 ───────────────────────────────────────────

export function shortenLine(line, max = 28) {
  return trimAtPhraseBoundary(line, max);
}

export function pickLineSummary(line, max = 30) {
  return trimAtPhraseBoundary(line, max);
}

/**
 * 步驟 1：按句號、問號、驚嘆號、換行切碎 OCR 文本
 */
export function sliceTextToSentences(rawText = '') {
  const passageFirst = extractPassageBodyFromOcrText(rawText);
  if (passageFirst.length >= 2) return passageFirst;

  const cleaned = truncateLineBeforeWorksheet(String(rawText).replace(/\r/g, '\n'));
  if (!cleaned) return [];

  const chunks = cleaned
    .split(/(?<=[。；！？!?])|[\r\n]+/)
    .map((s) => truncateLineBeforeWorksheet(cleanReadingLine(s)))
    .filter((s) => s.length >= 6);

  if (chunks.length >= 2) return chunks;

  // 極短文本：按逗號或固定長度切
  return cleaned
    .split(/[，,、]/)
    .map((s) => truncateLineBeforeWorksheet(cleanReadingLine(s)))
    .filter((s) => s.length >= 4);
}

/**
 * 將句子組裝為 passage 行（每行約 28–42 字，供「第 N 行」定位）
 */
export function sentencesToPassageLines(sentences = []) {
  const lines = [];
  let buffer = '';

  sentences.forEach((sent) => {
    if ((buffer + sent).length <= 42) {
      buffer += sent;
    } else {
      if (buffer.length >= 8) lines.push(buffer);
      buffer = sent;
    }
  });
  if (buffer.length >= 6) lines.push(buffer);

  if (lines.length < 2 && sentences.join('').length >= 16) {
    const joined = sentences.join('');
    for (let i = 0; i < joined.length; i += 36) {
      const chunk = joined.slice(i, i + 36);
      if (chunk.length >= 6) lines.push(chunk);
    }
  }

  return sanitizeArticleLines(lines).slice(0, READING_MAX_ARTICLE_LINES);
}

/**
 * 從文章行中選 2–3 個關鍵定位句（長度優先 + 隨機打散）
 */
export function pickAnchorSentences(lines = [], { count = 3, randInt } = {}) {
  const ri = randInt ?? ((n) => Math.floor(Math.random() * n));
  const candidates = lines
    .map((text, lineIndex) => ({ lineIndex, text }))
    .filter(({ text }) => text.length >= 10)
    .sort((a, b) => b.text.length - a.text.length);

  const pool = candidates.length >= 2 ? candidates : lines.map((text, lineIndex) => ({ lineIndex, text }));
  const shuffled = fisherYatesShuffle(pool, ri);
  const pickCount = Math.min(count, Math.max(2, Math.min(3, shuffled.length)));
  return shuffled.slice(0, pickCount);
}

// ─── 干擾項（名校陷阱）────────────────────────────────────

const TRAP_POOL_BY_PROFILE = {
  theme: [
    '著重描寫優美的校園風景，與全文主旨無關',
    '只記錄一次考試分數，未能帶出成長啟示',
    '強調玩樂娛樂，與作者反思態度相反',
    '把次要人物的故事當成全文中心',
  ],
  intent: [
    '批評同學不合作，但文中強調互助',
    '介紹學校設施，並非作者寫作目的',
    '炫耀個人成績，與謙虛反省的語氣不符',
    '呼籲取消默書，文中並無此意',
  ],
  summary: [
    '只描述開學第一天，未能概括全文',
    '與文章結尾啟示相反',
    '張冠李戴，將老師的話誤當成主角想法',
    '僅提及天氣變化，與事件無關',
  ],
  message: [
    '逃避困難才聰明，與作者態度相反',
    '運氣比努力重要，文中並無此論',
    '描寫校園花壇，與克服困難無關',
    '暗示不必溫習，與全文不符',
  ],
  title: [
    '美麗的校園風景',
    '一次普通的放學',
    '我喜歡的運動會項目',
    '與本文無關的科幻冒險',
  ],
  shift: [
    '始終十分樂觀，沒有任何轉變',
    '由積極變得更消極放棄',
    '只關心成績排名，忽略內心成長',
    '與文章敘述的轉折相反',
  ],
  structure: [
    '純粹填充字數，與後文無關',
    '交代時間地點後即與下文脫節',
    '重複前文，沒有結構作用',
    '描寫與主線無關的插曲',
  ],
  relation: [
    '兩段互不相干，沒有邏輯聯繫',
    '後段否定前段，但文中為遞進關係',
    '僅並列兩個無關例子',
    '因果顛倒，偷換概念',
  ],
  transition: [
    '表示列舉同類事例',
    '表示直接否定前文',
    '僅作時間標記，無轉折',
    '與連接詞常見用法相反',
  ],
  line_detail: [
    '與該行內容完全無關',
    '只提及次要人物',
    '把結果當成原因',
    '與原文意思相反',
  ],
  rhetoric: [
    '純說明文體，不帶任何描寫',
    '以對話推進情節，並非烘托氣氛',
    '只列舉數據，沒有修辭',
    '與該段表達方式不符',
  ],
  technique: [
    '只下定義，不舉例子',
    '大量引用對話，並非借事例說理',
    '與文中先敘事後議論的手法不同',
    '純列舉成語，沒有展開',
  ],
  scene: [
    '單純介紹校園設施',
    '為旅遊指南作宣傳',
    '與人物情感無關的風景堆砌',
    '記錄天氣預報',
  ],
  emphasis: [
    '削弱人物決心，與語氣相反',
    '強調逃避責任',
    '只為諷刺老師',
    '與反覆出現的意象無關',
  ],
  vocab: [
    '望文生義，忽略上下文',
    '解釋成與本文無關的專有名詞',
    '與句中實際語境相反',
    '只按字面當成外語翻譯',
  ],
  character: [
    '驕傲自大，不願聽取意見',
    '遇到困難立刻放棄',
    '只顧玩樂，不顧學業',
    '與主角行為相反',
  ],
  feeling: [
    '完全冷漠，不關心結果',
    '只感到驕傲自滿',
    '與該段情感用詞相反',
    '描述與處境無關的興奮',
  ],
  implication: [
    '暗示不必努力',
    '與結尾啟示相反',
    '純粹描述天氣',
    '與事件無關的道德說教',
  ],
  cause: [
    '把結果誤當原因',
    '與該行因果邏輯相反',
    '歸因於與本文無關的因素',
    '只描述現象，未解釋原因',
  ],
};

const UNIVERSAL_TRAPS = [
  '主角感到十分沮喪，不願面對現實',
  '記述了一段令人深思的經歷',
  '描寫了優美的校園風景，但與人物內心無關',
  '偷換概念，把甲事件說成乙事件',
  '張冠李戴，將配角言行安在主角身上',
  '只擷取某一細節，未能回應題干',
  '與文章基調相反，故意曲解作者',
  '說明人物當時內心十分緊張',
  '強調玩樂娛樂，與全文主旨無關',
  '只描述天氣變化，與事件無關',
];

/** 僅「逐行比對」類題型才允許從正文摘句作干擾項 */
const LINE_SNIPPET_PROFILES = new Set(['line_detail', 'cause', 'feeling', 'vocab']);

/**
 * 步驟 3：高級干擾項 — 主旨／意圖題用陷阱池；細節題才可摘句
 */
export function buildTrapDistractors({ correct, lines = [], profile = 'theme', rng, randInt }) {
  const ri = randInt ?? ((n) => Math.floor(Math.random() * n));
  const profileTraps = TRAP_POOL_BY_PROFILE[profile] ?? UNIVERSAL_TRAPS;
  const fromLines = LINE_SNIPPET_PROFILES.has(profile)
    ? lines
      .map((l) => trimAtPhraseBoundary(l, 32))
      .filter((l) => isValidOptionCandidate(l, correct))
    : [];

  const pool = fisherYatesShuffle(
    [...profileTraps, ...UNIVERSAL_TRAPS, ...fromLines],
    ri,
  );

  const picked = [];
  const seen = new Set([correct]);
  pool.forEach((item) => {
    const key = sanitizeReadingOption(item);
    if (!key || seen.has(key) || key === correct || isGarbageOption(key)) return;
    if (picked.length < 3) {
      picked.push(key);
      seen.add(key);
    }
  });

  while (picked.length < 3) {
    const filler = UNIVERSAL_TRAPS[picked.length % UNIVERSAL_TRAPS.length];
    if (!seen.has(filler)) {
      picked.push(filler);
      seen.add(filler);
    } else break;
  }

  return picked;
}

// ─── 智能擴寫（極短 OCR 兜底）────────────────────────────

/**
 * 雙軌制兜底：OCR 僅 3–5 詞時，拼湊約 250 字「校園克服困難」短文
 */
export function expandCampusResilienceArticle(keywords = [], fragments = []) {
  const hero = keywords[0] ?? '小華';
  const challenge = keywords[1] ?? '學習上的挫折';
  const trait = keywords[2] ?? '堅持';
  const virtue = keywords[3] ?? '團結';
  const frag = fragments
    .filter((f) => f.length >= 8 && !/閱讀下面的文字|根據文章內容|愛吃甚麼|出適當的答案/.test(f))
    .find((f) => f.length >= 8)
    ?.slice(0, 18) ?? '';

  const essay = [
    `開學後不久，${hero}在校園裏面對${challenge}，曾經一度懷疑自己的能力，連課堂討論也變得沉默。`,
    `在班主任的鼓勵下，${hero}開始調整温習方法，每天課後留在圖書館整理筆記，並主動向同學請教。`,
    frag
      ? `回想起與「${frag}」相關的課堂內容，${hero}明白面對困難需要耐心與反省，不能只求捷徑。`
      : `${hero}與組員${virtue}合作，分工完成專題報告，彼此扶持渡過呈分試前的壓力。`,
    `雖然途中仍有失敗，但${hero}沒有放棄，而是在每一次錯誤中累積經驗，學會先理解再記誦。`,
    `漸漸地，${hero}在模擬測驗中看見進步；更重要的是，他體會到${trait}、自律與求助並不丟臉。`,
    `這段校園經歷讓${hero}懂得：克服困難不只靠天分，更需要勇氣、反思與不放棄的態度，才能迎向真正的成長。`,
  ].join('');

  const lines = sentencesToPassageLines(sliceTextToSentences(essay));
  return {
    articleTitle: `校園成長記：${hero}的${trait}之路`,
    articleLines: lines.length >= 2 ? lines : sentencesToPassageLines([essay]),
    expandedBy: 'campus_resilience_expand',
    charCount: essay.length,
  };
}

/** 判斷是否需啟動智能擴寫 */
export function needsSmartExpansion(rawText = '', lines = []) {
  const charCount = (rawText || lines.join('')).replace(/\s/g, '').length;
  const wordLike = (rawText.match(/[\u4e00-\u9fff]{2,}/g) ?? []).length;
  return charCount < 30 || lines.length < 2 || wordLike <= 5;
}

// ─── 動態出題主流程 ───────────────────────────────────────

/**
 * 步驟 2：從樣版池隨機抽 3–5 道不同維度題目（絕不重複同一樣版 id）
 * @param {string[]} articleLines
 * @param {{ minCount?: number, maxCount?: number, seed?: number, keywords?: string[] }} options
 */
export function generateDynamicQuestions(articleLines = [], options = {}) {
  const lines = sanitizeArticleLines(articleLines);
  if (lines.length < 2) return [];

  const { minCount = 4, maxCount = 6, seed, keywords = [] } = options;
  const { rng, randInt } = createRng(seed);

  const questionCount = minCount + randInt(Math.max(1, maxCount - minCount + 1));
  const anchors = pickAnchorSentences(lines, { count: 3, randInt });

  const ctx = {
    lines,
    keywords,
    anchors,
    rng,
    randInt,
  };

  const templateById = Object.fromEntries(
    ADVANCED_QUESTION_TEMPLATES.map((tpl) => [tpl.id, tpl]),
  );

  const picked = [];
  const usedIds = new Set();
  const usedStems = new Set();

  const tryPick = (tpl) => {
    if (!tpl || usedIds.has(tpl.id)) return false;
    const q = instantiateTemplate(tpl, ctx);
    if (!q || usedStems.has(q.questionText)) return false;
    usedIds.add(tpl.id);
    usedStems.add(q.questionText);
    picked.push(q);
    return true;
  };

  /** 從中央共享庫直接注入靜態寫作手法題（Shuffle Pool 對接 GLOBAL_SHARED_METHODS） */
  const tryPickSharedMethod = (tpl) => {
    if (!tpl?.questionText || usedStems.has(tpl.questionText)) return false;
    const options = (tpl.options ?? []).slice(0, 4);
    if (options.length < 4) return false;
    usedIds.add(tpl.id ?? tpl.questionText);
    usedStems.add(tpl.questionText);
    picked.push({
      id: tpl.id,
      category: tpl.category ?? 'writing_technique',
      questionText: tpl.questionText,
      options,
      correctAnswerIndex: Number(tpl.correctAnswerIndex ?? 0),
      hint: tpl.hint,
      isCommunityShared: tpl.isCommunityShared,
      contributorLabel: tpl.contributorLabel,
      sharedPoolId: tpl.sharedPoolId,
      source: tpl.source ?? 'global_shared_methods',
    });
    return true;
  };

  // 階段 1：高級優先池（四大黃金 + 修辭 + 心態）Fisher-Yates 洗牌注入
  const priorityPool = fisherYatesShuffle(
    PRIORITY_TEMPLATE_IDS.map((id) => templateById[id]).filter(Boolean),
    randInt,
  );
  const priorityTarget = Math.min(
    questionCount - 1,
    Math.max(2, 1 + randInt(2)),
  );
  for (const tpl of priorityPool) {
    if (picked.length >= priorityTarget) break;
    tryPick(tpl);
  }

  // 階段 1b：中央共享寫作手法池 — 全港家長 UGC 滾雪球題目
  const sharedMethodPool = fisherYatesShuffle(getGlobalSharedMethods(), randInt);
  for (const tpl of sharedMethodPool) {
    if (picked.length >= priorityTarget + 1) break;
    tryPickSharedMethod(tpl);
  }

  // 階段 2：每大類至少 1 題，確保維度多元
  const byCategory = {};
  ADVANCED_QUESTION_TEMPLATES.forEach((tpl) => {
    if (!byCategory[tpl.category]) byCategory[tpl.category] = [];
    byCategory[tpl.category].push(tpl);
  });

  Object.values(QUESTION_CATEGORIES).forEach((cat) => {
    if (picked.length >= questionCount) return;
    const pool = fisherYatesShuffle(byCategory[cat] ?? [], randInt);
    for (const tpl of pool) {
      if (tryPick(tpl)) break;
    }
  });

  const remaining = fisherYatesShuffle(
    ADVANCED_QUESTION_TEMPLATES.filter((t) => !usedIds.has(t.id)),
    randInt,
  );

  for (const tpl of remaining) {
    if (picked.length >= questionCount) break;
    tryPick(tpl);
  }

  // 最終題序再洗牌（保留正確索引綁定）
  const shuffledQuestions = fisherYatesShuffle(picked, randInt);

  return shuffledQuestions.slice(0, questionCount).map((q, index) => ({
    id: index + 1,
    questionText: q.questionText,
    options: q.options,
    correctAnswerIndex: q.correctAnswerIndex,
    hint: q.hint,
    templateId: q.id,
    category: q.category,
    isCommunityShared: q.isCommunityShared,
    contributorLabel: q.contributorLabel,
    sharedPoolId: q.sharedPoolId,
    source: q.source,
  }));
}

/**
 * 將動態題目轉為舊版 programmatic 格式（相容 readingQuestionBuilder）
 */
export function dynamicQuestionsToLegacyFormat(questions = []) {
  return questions.map((q, index) => ({
    question: `Q${index + 1}. ${q.questionText}`,
    options: q.options,
    correctIndex: q.correctAnswerIndex,
    explanation: q.hint,
    hint: q.hint,
  }));
}
