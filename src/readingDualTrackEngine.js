/**
 * 閱讀理解 — 智能雙軌引擎（Dual-Track Engine）
 *
 * 軌道 A：完整長篇文章 → 直接提取清洗
 * 軌道 B：零碎考卷（錯別字、填空、成語題）→ 提取核心詞 + AI/程式化主題擴寫
 */

import { cleanReadingLine, chineseCharRatio, sanitizeArticleLines } from './readingTextQuality.js';
import { buildTrackBCacheKey, readTrackBCache } from './readingTrackBCache.js';

/** 模糊 / 無法辨識時，前端彈窗顯示的友善提示 */
export const READING_BLUR_USER_MESSAGE =
  '圖片太模糊了，請開燈重新拍照，或者直接使用「貼上文章文字」功能喔！';

/** 模糊上載的標準錯誤碼（前後端共用） */
export const READING_BLUR_ERROR_CODE = 'image_too_blurry';

/** 後端 .env 未設定有效 Vision API 密鑰 */
export const READING_ENV_MISSING_CODE = 'vision_env_missing';

export const READING_ENV_MISSING_USER_MESSAGE =
  '【開發者提示】後端未偵測到有效的 AI 密鑰，請檢查項目根目錄的 .env 檔案是否正確填寫！';

/** 本地 Ollama 未啟動或無法連接 */
export const READING_OLLAMA_UNAVAILABLE_CODE = 'ollama_unavailable';

export const READING_OLLAMA_UNAVAILABLE_MESSAGE =
  '【本地 AI】無法連接 Ollama（http://localhost:11434）。請先執行 ollama serve，並 ollama pull llava（或 .env 指定的模型）';

/** 本機 Speech API（:3001）未啟動或連線中斷 — 常見於重複 npm run dev */
export const READING_BACKEND_UNAVAILABLE_CODE = 'backend_unavailable';

export const READING_BACKEND_UNAVAILABLE_MESSAGE =
  '【後端未連接】Node.js OCR 伺服器（:3001）沒有正常運行。請在終端按 Ctrl+C，執行 npm run dev:stop，再執行 npm run dev，等看到「Tesseract 已就緒 ✓」再試。';

/** 本地模型回傳非標準 JSON — 請家長重試 */
export const READING_OLLAMA_JSON_PARSE_CODE = 'ollama_json_parse';

export const READING_OLLAMA_JSON_RETRY_MESSAGE =
  '本地 AI 這次開小差了，請再點擊一次「開始 AI 解析」重新觸發。';

/** 本地 Ollama 輸出被 Context 截斷（常見：Settings 設為 4k） */
export const READING_OLLAMA_CONTEXT_EXCEEDED_CODE = 'ollama_context_exceeded';

export const READING_OLLAMA_CONTEXT_EXCEEDED_MESSAGE =
  '【本地 AI】回應被截斷（Ollama Context 不足）。請開啟 Ollama → Settings → Context length 調至 **16k 或 32k**，然後重試上載。';

/** 本地 Ollama 尚未 pull 指定模型（如 llava） */
export const READING_OLLAMA_MODEL_NOT_FOUND_CODE = 'ollama_model_not_found';

export function buildOllamaModelNotFoundMessage(modelName = 'llava') {
  return `【本地 AI】尚未下載「${modelName}」視覺模型。請開啟 Ollama 應用程式 → 搜尋並 Pull「${modelName}」；若 Terminal 已加入 PATH，可執行：ollama pull ${modelName}`;
}

/** 零碎題型特徵（觸發軌道 B） */
const FRAGMENT_SIGNALS = [
  /錯別字|辨正|改錯|選出錯字|圈出錯|改正/,
  /填在橫線|填空|在橫線上|請填|填寫/,
  /成語|詞語|詞組|配對/,
  /造句|用「.+」造句/,
  /^[A-DＡ-Ｄ][\.．、]/,
  /^\(.+\)|（.+）/,
  /_{2,}|…{2,}|\.{4,}/,
  /悟|語|默書|詞表/,
];

const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '他', '她', '它', '們', '這', '那', '有', '和', '與',
  '也', '就', '都', '而', '及', '或', '把', '被', '讓', '向', '从', '從', '到', '為',
  '上', '下', '中', '不', '很', '更', '最', '能', '會', '要', '可以', '應該', '請',
  '下列', '哪一', '哪項', '根據', '文章', '作者', '本文', '句子', '詞語', '選項',
]);

/**
 * 從原始 OCR / AI 行判斷內容類型
 * @returns {'A'|'B'}
 */
export function classifyUploadContent({ rawLines = [], articleLines = [], rawText = '' } = {}) {
  const raw = rawLines.length
    ? rawLines.map((l) => cleanReadingLine(typeof l === 'string' ? l : l?.text ?? ''))
    : (rawText || '').split(/\n+/).map(cleanReadingLine).filter(Boolean);

  const cleaned = articleLines.length ? articleLines : sanitizeArticleLines(raw);
  const fullRaw = raw.join('');
  const fullClean = cleaned.join('');

  let fragmentScore = 0;
  raw.forEach((line) => {
    if (FRAGMENT_SIGNALS.some((p) => p.test(line))) fragmentScore += 2;
    if (line.length > 0 && line.length < 18) fragmentScore += 1;
  });

  const avgLineLen = cleaned.length
    ? cleaned.reduce((s, l) => s + l.length, 0) / cleaned.length
    : 0;
  const totalLen = fullClean.length || fullRaw.length;

  // 軌道 A：足夠長、句子平均夠長、零碎信號少
  if (
    cleaned.length >= 4
    && totalLen >= 280
    && avgLineLen >= 22
    && fragmentScore <= 2
  ) {
    return { track: 'A', reason: 'full_passage', fragmentScore, totalLen, avgLineLen };
  }

  // 軌道 B：錯別字/填空/短句碎片
  if (
    fragmentScore >= 3
    || totalLen < 200
    || cleaned.length < 3
    || avgLineLen < 20
  ) {
    return { track: 'B', reason: 'fragment_worksheet', fragmentScore, totalLen, avgLineLen };
  }

  return cleaned.length >= 3 && totalLen >= 200
    ? { track: 'A', reason: 'adequate_passage', fragmentScore, totalLen, avgLineLen }
    : { track: 'B', reason: 'insufficient_passage', fragmentScore, totalLen, avgLineLen };
}

/** 從零碎題目提取核心高頻詞（2–4 字） */
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

/** 將長文切成 passage 行（每行約 28–40 字） */
function splitIntoPassageLines(text = '') {
  const cleaned = cleanReadingLine(text).replace(/第[一二三四五六七八九十\d]+行[：:]/g, '');
  if (!cleaned) return [];

  const sentences = cleaned
    .split(/(?<=[。；！？])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);

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
  if (buffer.length >= 8) lines.push(buffer);

  if (lines.length < 2 && cleaned.length >= 16) {
    for (let i = 0; i < cleaned.length; i += 36) {
      const chunk = cleaned.slice(i, i + 36);
      if (chunk.length >= 8) lines.push(chunk);
    }
  }

  return lines.slice(0, 12);
}

/**
 * 評估上載擷取品質 — 無 coreKeywords 且幾無中文時視為模糊圖片
 * @returns {{ ok: boolean, code?: string, userMessage?: string }}
 */
export function assessUploadExtractQuality({
  rawLines = [],
  articleLines = [],
  coreKeywords = [],
  contentTrack,
  rawText = '',
} = {}) {
  const lines = rawLines.map((l) => cleanReadingLine(typeof l === 'string' ? l : l?.text ?? ''));
  const text = rawText || lines.join('');
  const chineseCount = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const articleLen = (articleLines ?? []).join('').length;
  const keywords = coreKeywords.length ? coreKeywords : extractCoreKeywords(lines);

  const classification = classifyUploadContent({ rawLines: lines, articleLines, rawText: text });
  const track = contentTrack === 'A' || contentTrack === 'B' ? contentTrack : classification.track;

  // 軌道 A：已有足夠正文 → 視為成功
  if (track === 'A' && articleLines.length >= 2 && articleLen >= 80) {
    return { ok: true };
  }

  // 軌道 B 或整體：無核心詞 + 幾乎無中文 → 模糊退回
  if (keywords.length === 0 && chineseCount < 12 && articleLen < 50) {
    return {
      ok: false,
      code: READING_BLUR_ERROR_CODE,
      userMessage: READING_BLUR_USER_MESSAGE,
    };
  }

  if (track === 'B' && keywords.length === 0) {
    return {
      ok: false,
      code: READING_BLUR_ERROR_CODE,
      userMessage: READING_BLUR_USER_MESSAGE,
    };
  }

  return { ok: true };
}

/** 模糊上載的標準 API / OCR 回傳物件 */
export function buildBlurryUploadPayload() {
  return {
    ok: false,
    code: READING_BLUR_ERROR_CODE,
    error: READING_BLUR_USER_MESSAGE,
    userMessage: READING_BLUR_USER_MESSAGE,
    qualityOk: false,
    qualityReason: READING_BLUR_ERROR_CODE,
    articleTitle: '',
    articleLines: [],
    passageLines: [],
    questions: [],
    fromVision: false,
  };
}

/**
 * 軌道 B：依核心詞程式化擴寫 300–400 字記敘/抒情文（AI 不可用時備援）
 */
export function expandTrackBArticle(coreKeywords = [], fragments = []) {
  const k1 = coreKeywords[0] ?? '啟發';
  const k2 = coreKeywords[1] ?? '恍然大悟';
  const k3 = coreKeywords[2] ?? '溫習';
  const k4 = coreKeywords[3] ?? '堅持';
  const fragHint = fragments.find((f) => f.length >= 6 && chineseCharRatio(f) >= 0.6) ?? '';

  const essay = [
    `這學期以來，我在溫習中文時常常遇到形近字混淆的問題，例如「${k1}」與相關詞語的分別，一度令我感到十分苦惱。`,
    `有一次默書測驗，我因為粗心而寫錯字，下課後經過老師的${k1}與耐心解釋，我才${k2}，明白分辨字詞的重要性。`,
    fragHint && fragHint.length >= 10
      ? `回想起試卷上的句子「${fragHint.slice(0, 20)}」，我更加體會到每一個字都承載着意思，不可隨意替換。`
      : `因此，我開始把容易混淆的字詞整理成表，每天花十五分鐘反覆記誦。`,
    `雖然過程並不容易，但我相信只要${k4}，定能穩步進步。`,
    `後來，我主動與同學互相提問，一起討論「${k2}」「${k3}」等詞語的用法，大家互相扶持，成績也漸漸提升。`,
    `這段經歷讓我明白：學習不僅是記誦，更是理解與反思；只要肯用心，錯誤也能成為成長的台階。`,
  ].filter(Boolean).join('');

  const lines = splitIntoPassageLines(essay);
  return {
    articleTitle: `圍繞「${k1}」的學習記敘`,
    articleLines: lines,
    coreKeywords: coreKeywords.slice(0, 6),
    wordCount: essay.length,
    expandedBy: 'programmatic',
  };
}

/**
 * 雙軌引擎主入口 — 輸出最終 articleLines（左側面板唯一來源）
 */
export function applyDualTrackEngine(payload = {}, context = {}) {
  const rawLines = context.rawLines ?? payload.rawFragments ?? [];
  const aiTrack = payload.contentTrack ?? payload.track;
  const aiKeywords = payload.coreKeywords ?? [];

  let articleLines = sanitizeArticleLines(
    payload.articleLines ?? payload.passageLines ?? [],
  );

  const classification = classifyUploadContent({
    rawLines,
    articleLines,
    rawText: context.rawText ?? '',
  });

  const track = aiTrack === 'A' || aiTrack === 'B' ? aiTrack : classification.track;
  let coreKeywords = aiKeywords.length ? aiKeywords : extractCoreKeywords(rawLines);
  let expandedBy = null;

  if (track === 'B') {
    const cacheKey = buildTrackBCacheKey(coreKeywords);
    const cached = cacheKey ? readTrackBCache(cacheKey) : null;

    if (cached) {
      return {
        ...payload,
        contentTrack: 'B',
        coreKeywords: cached.coreKeywords ?? coreKeywords,
        articleLines: cached.articleLines,
        passageLines: cached.articleLines,
        articleTitle: cached.articleTitle ?? payload.articleTitle,
        expandedBy: 'cache',
        cachedQuestions: cached.questions,
        fromCache: true,
        classification,
      };
    }

    // AI 已擴寫且字數足夠 → 採用 AI 的 articleLines
    const aiTotal = articleLines.join('').length;
    if (aiTotal >= 250 && articleLines.length >= 4) {
      expandedBy = 'vision';
    } else {
      const expanded = expandTrackBArticle(
        coreKeywords,
        rawLines.map((l) => cleanReadingLine(typeof l === 'string' ? l : l?.text ?? '')),
      );
      articleLines = expanded.articleLines;
      coreKeywords = expanded.coreKeywords;
      expandedBy = expanded.expandedBy;
      payload = {
        ...payload,
        articleTitle: expanded.articleTitle,
      };
    }
  }

  return {
    ...payload,
    contentTrack: track,
    coreKeywords,
    articleLines,
    passageLines: articleLines,
    expandedBy,
    classification,
  };
}
