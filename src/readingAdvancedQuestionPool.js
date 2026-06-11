/**
 * 呈分試權威題型樣版池（Advanced SSPA Question Pool）
 * ─────────────────────────────────────────────────────────
 * 香港小五／小六閱讀理解：5 大類、32 道高維度題型樣版（含四大黃金寫作手法與呈分試真題風格）
 * 每個樣版透過 build(ctx) 動態綁定 OCR 文章切片，絕非固定美玲望遠鏡題。
 *
 * @typedef {object} QuestionBuildContext
 * @property {string[]} lines — 文章行陣列（已清洗）
 * @property {string[]} keywords — 核心詞
 * @property {{ lineIndex: number, text: string }[]} anchors — 定位句（2–3 句）
 * @property {() => number} rng — 0–1 隨機函數
 * @property {(n: number) => number} randInt — [0, n) 整數
 */

import { cleanReadingLine, trimAtPhraseBoundary } from './readingTextQuality.js';
import {
  OPTION_MODES,
  detectRhetoricInText,
  inferMindsetShift,
} from './readingTypeSafeOptions.js';
import {
  EXAM_METHOD_ENGINE_TEMPLATES,
} from './readingGoldenTechniquePool.js';
import { SSPA_EXAM_TEMPLATES } from './readingSspaExamTemplates.js';
import { inferArticleProfile } from './readingArticleProfiler.js';

export {
  EXAM_METHOD_TEMPLATES,
  EXAM_METHOD_IDS,
  PRIORITY_TEMPLATE_IDS,
} from './readingGoldenTechniquePool.js';
export { SSPA_EXAM_TEMPLATES, SSPA_EXAM_TEMPLATE_IDS } from './readingSspaExamTemplates.js';
export {
  WORKSHEET_TECHNIQUE_TAGS,
  WORKSHEET_TEMPLATE_IDS,
  RICE_EXPOSITORY_PASSAGE,
  DUANWU_EXPOSITORY_PASSAGE,
  ZHENGPING_NARRATIVE_PASSAGE,
  STRANGE_TREES_EXPOSITORY_PASSAGE,
  LIANG_LETTER_PASSAGE,
} from './readingWorksheetReferencePool.js';

export const QUESTION_CATEGORIES = {
  MAIN_THEME: 'main_theme',
  PARAGRAPH_LOGIC: 'paragraph_logic',
  RHETORIC: 'rhetoric',
  VOCAB_INFERENCE: 'vocab_inference',
  WRITING_TECHNIQUE: 'writing_technique',
};

function shortenLine(line, max = 28) {
  return trimAtPhraseBoundary(line, max);
}

function pickLineSummary(line, max = 30) {
  return trimAtPhraseBoundary(line, max);
}

/** 依文章語意推斷主題（供主旨／意圖題合成答案，不用原文碎片） */
function inferStoryTopic(ctx) {
  const p = inferArticleProfile(ctx);
  return {
    event: p.articleFocus?.replace(/^說明|^記述|^介紹|^全文圍繞/, '') ?? '相關經歷',
    intent: p.authorPurpose ?? '帶出正向價值觀',
    theme: p.articleFocus ?? '成長與反思',
  };
}

function buildAbstractAnswer(ctx, kind) {
  const topic = inferStoryTopic(ctx);
  switch (kind) {
    case 'intent':
      return `透過敘述${topic.event}，${topic.intent}`;
    case 'center':
      return topic.theme.includes('快樂') || topic.theme.includes('道理')
        ? `闡述了${topic.theme}`
        : `全文圍繞${topic.event}，帶出${topic.theme}的道理`;
    case 'summary':
      return `作者藉${topic.event}一事，說明${topic.theme}`;
    case 'message':
      return `啟發讀者：面對生活應抱持${topic.theme}的態度`;
    default:
      return `透過${topic.event}，傳達${topic.theme}`;
  }
}

/** 修辭／手法常見標籤（用於修辭類題干） */
const RHETORIC_LABELS = [
  { label: '比喻', signal: /像|如同|彷彿|好似|猶如/ },
  { label: '擬人', signal: /輕撫|微笑|凝視|訴說|陪伴/ },
  { label: '誇張', signal: /萬分|極其|十分|不住|整晚|每一天/ },
  { label: '排比', signal: /不但|不僅|一方面|另一方面|有的.*有的/ },
];

function pickAnchor(ctx, offset = 0) {
  const anchors = ctx.anchors ?? [];
  if (!anchors.length) return { lineIndex: 0, text: ctx.lines[0] ?? '' };
  return anchors[(offset + ctx.randInt(anchors.length)) % anchors.length];
}

function lastMeaningfulLine(ctx) {
  const lines = ctx.lines ?? [];
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].length >= 10) return { lineIndex: i, text: lines[i] };
  }
  return { lineIndex: 0, text: lines[0] ?? '' };
}

function findTransition(ctx) {
  const words = ['然而', '因此', '所以', '雖然', '但是', '於是', '而且', '不僅', '既然'];
  for (let i = 0; i < ctx.lines.length; i += 1) {
    const w = words.find((word) => ctx.lines[i].includes(word));
    if (w) return { lineIndex: i, word: w, text: ctx.lines[i] };
  }
  return null;
}

function quotedWordFromLine(text = '') {
  const m = text.match(/「([^」]{1,6})」/);
  if (m) return m[1];
  const words = text.match(/[\u4e00-\u9fff]{2,4}/g) ?? [];
  return words.find((w) => w.length >= 2) ?? words[0] ?? '堅持';
}

/**
 * 32 道題型樣版 — 含四大黃金寫作手法與呈分試真題風格；每次出題隨機抽樣
 */
export const ADVANCED_QUESTION_TEMPLATES = [
  // ── 【四大黃金寫作手法／結構功能題】────────────────
  ...EXAM_METHOD_ENGINE_TEMPLATES,

  // ── 【呈分試真題風格：段意／重點／目的／情感】──────
  ...SSPA_EXAM_TEMPLATES,

  // ── 【主旨深究題】────────────────────────────
  {
    id: 'main_center_idea',
    category: QUESTION_CATEGORIES.MAIN_THEME,
    build(ctx) {
      const correct = buildAbstractAnswer(ctx, 'center');
      return {
        questionText: '本文的中心思想最接近以下哪一項？',
        correct,
        optionMode: OPTION_MODES.ABSTRACT_THEME,
        hint: '綜合全文，尤其留意最後一至兩段所帶出的啟示。',
        trapProfile: 'theme',
      };
    },
  },
  {
    id: 'main_author_intent',
    category: QUESTION_CATEGORIES.MAIN_THEME,
    build(ctx) {
      const correct = buildAbstractAnswer(ctx, 'intent');
      return {
        questionText: '作者撰寫此文的主要意圖是？',
        correct,
        optionMode: OPTION_MODES.ABSTRACT_THEME,
        hint: '思考作者想透過敘述經歷，向讀者傳達甚麼態度或價值觀。',
        trapProfile: 'intent',
      };
    },
  },
  {
    id: 'main_best_summary',
    category: QUESTION_CATEGORIES.MAIN_THEME,
    build(ctx) {
      const correct = buildAbstractAnswer(ctx, 'summary');
      return {
        questionText: '下列哪一項最能概括全文主旨？',
        correct,
        optionMode: OPTION_MODES.ABSTRACT_THEME,
        hint: '排除只描述單一細節的選項，選擇能涵蓋全文重心的答案。',
        trapProfile: 'summary',
      };
    },
  },
  {
    id: 'main_core_message',
    category: QUESTION_CATEGORIES.MAIN_THEME,
    build(ctx) {
      const k = ctx.keywords[0] ?? '成長';
      const correct = buildAbstractAnswer(ctx, 'message');
      return {
        questionText: '綜合全文，作者最想帶出的訊息是？',
        correct,
        optionMode: OPTION_MODES.ABSTRACT_THEME,
        hint: `留意文中與「${k}」相關的敘述如何呼應結尾。`,
        trapProfile: 'message',
      };
    },
  },
  {
    id: 'main_title_match',
    category: QUESTION_CATEGORIES.MAIN_THEME,
    build(ctx) {
      const k1 = ctx.keywords[0] ?? '校園';
      const k2 = ctx.keywords[1] ?? '堅持';
      const correct = `在${k1}中學會${k2}與反思`;
      return {
        questionText: '若為本文擬定標題，下列哪一項最貼切？',
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '標題須同時扣緊事件與作者領悟，不可只寫表面活動。',
        trapProfile: 'title',
      };
    },
  },

  // ── 【段落邏輯／轉折題】────────────────────────
  {
    id: 'logic_mindset_shift',
    category: QUESTION_CATEGORIES.PARAGRAPH_LOGIC,
    build(ctx) {
      const a = pickAnchor(ctx, 0);
      const b = pickAnchor(ctx, 1);
      const mindsetCorrect = inferMindsetShift(ctx);
      return {
        questionText: `根據文章第${a.lineIndex + 1}至第${b.lineIndex + 1}段，主角的心態經歷了怎樣的轉變？`,
        correct: mindsetCorrect,
        mindsetCorrect,
        optionMode: OPTION_MODES.MINDSET_SHIFT,
        hint: `對照第${a.lineIndex + 1}行與第${b.lineIndex + 1}行的用詞變化。`,
        trapProfile: 'shift',
      };
    },
  },
  {
    id: 'logic_plot_function',
    category: QUESTION_CATEGORIES.PARAGRAPH_LOGIC,
    build(ctx) {
      const anchor = pickAnchor(ctx);
      const correct = `為後文鋪墊，引出人物面對困難後的反思與成長（第${anchor.lineIndex + 1}行）`;
      return {
        questionText: `文中第${anchor.lineIndex + 1}行提及的情節，在結構上起到了什麼作用？`,
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '思考該段落在「起因—經過—結果」結構中的位置。',
        trapProfile: 'structure',
      };
    },
  },
  {
    id: 'logic_line_relation',
    category: QUESTION_CATEGORIES.PARAGRAPH_LOGIC,
    build(ctx) {
      const a = pickAnchor(ctx, 0);
      const b = pickAnchor(ctx, 2);
      const correct = `第${a.lineIndex + 1}行交代背景，第${b.lineIndex + 1}行則呈現轉折後的行動與結果`;
      return {
        questionText: `第${a.lineIndex + 1}行與第${b.lineIndex + 1}行之間存在什麼邏輯關係？`,
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '先找兩段各自的重點，再判斷是因果、遞進還是對比。',
        trapProfile: 'relation',
      };
    },
  },
  {
    id: 'logic_transition_word',
    category: QUESTION_CATEGORIES.PARAGRAPH_LOGIC,
    build(ctx) {
      const tr = findTransition(ctx);
      if (!tr) return null;
      const meaning = tr.word === '然而' || tr.word === '但是' || tr.word === '雖然'
        ? '表示語意轉折，前後形成對比'
        : tr.word === '因此' || tr.word === '所以' || tr.word === '於是'
          ? '承接前文，引出結果或後續行動'
          : '表示遞進或補充，加強論述';
      return {
        questionText: `文中第${tr.lineIndex + 1}行的「${tr.word}」表示什麼關係？`,
        correct: meaning,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: `細讀「${tr.word}」前後兩句，判斷語氣是轉折還是因果。`,
        trapProfile: 'transition',
      };
    },
  },
  {
    id: 'logic_sequence',
    category: QUESTION_CATEGORIES.PARAGRAPH_LOGIC,
    build(ctx) {
      const anchor = pickAnchor(ctx);
      const correct = shortenLine(anchor.text, 36);
      return {
        questionText: '根據文章內容，以下哪一個敘述是正確的？',
        correct,
        optionMode: OPTION_MODES.PASSAGE_DETAIL,
        hint: `請先定位第${anchor.lineIndex + 1}行，再與選項逐項比對。`,
        trapProfile: 'line_detail',
      };
    },
  },

  // ── 【修辭與表達手法】────────────────────────
  {
    id: 'rhetoric_device',
    category: QUESTION_CATEGORIES.RHETORIC,
    build(ctx) {
      const rhetoricCorrect = detectRhetoricInText((ctx.lines ?? []).join(''));
      return {
        questionText: '本文主要運用了哪一種修辭手法？',
        correct: rhetoricCorrect,
        rhetoricCorrect,
        optionMode: OPTION_MODES.RHETORIC_LABELS,
        hint: '留意文中有無比喻、擬人、排比或誇張等用語。',
        trapProfile: 'rhetoric',
      };
    },
  },
  {
    id: 'rhetoric_same_technique',
    category: QUESTION_CATEGORIES.RHETORIC,
    build(ctx) {
      const anchor = pickAnchor(ctx, 1);
      const correct = '借具體事例表達抽象道理，使道理更易明白';
      return {
        questionText: '以下哪一個選項與文中的寫作手法相同？',
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '文中是否透過一件具體經歷來說明較抽象的道理？',
        trapProfile: 'technique',
      };
    },
  },
  {
    id: 'rhetoric_scene_purpose',
    category: QUESTION_CATEGORIES.RHETORIC,
    build(ctx) {
      const anchor = pickAnchor(ctx);
      const correct = '以環境或場景襯托人物內心，而非單純描寫風景';
      return {
        questionText: `作者在第${anchor.lineIndex + 1}段描寫情境，主要目的是什麼？`,
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '思考描寫是否為人物情感或後續行動服務。',
        trapProfile: 'scene',
      };
    },
  },
  {
    id: 'rhetoric_emphasis',
    category: QUESTION_CATEGORIES.RHETORIC,
    build(ctx) {
      const anchor = pickAnchor(ctx, 2);
      const correct = '強調人物面對困難時的決心，突出「不放棄」的態度';
      return {
        questionText: `第${anchor.lineIndex + 1}行中，作者反覆強調某一細節，目的是？`,
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '重複或誇張的用語通常為突出情感或態度。',
        trapProfile: 'emphasis',
      };
    },
  },

  // ── 【詞彙與深意推論】────────────────────────
  {
    id: 'vocab_context_meaning',
    category: QUESTION_CATEGORIES.VOCAB_INFERENCE,
    build(ctx) {
      const anchor = pickAnchor(ctx);
      const word = quotedWordFromLine(anchor.text);
      const correct = `在上下文中最接近「${shortenLine(anchor.text, 18)}」所表達的意思`;
      return {
        questionText: `文中「${word}」在上下文中最準確的解釋是？`,
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: `把「${word}」放回第${anchor.lineIndex + 1}行整句理解，勿只看字面。`,
        trapProfile: 'vocab',
      };
    },
  },
  {
    id: 'vocab_character_trait',
    category: QUESTION_CATEGORIES.VOCAB_INFERENCE,
    build(ctx) {
      const anchor = pickAnchor(ctx, 1);
      const correct = '面對挫折仍願反省、主動求助，具堅毅與虛心特質';
      return {
        questionText: '從主角的言行中，我們可以推論出他是一個怎樣的人？',
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '綜合主角面對困難時的態度與後續行動作判斷。',
        trapProfile: 'character',
      };
    },
  },
  {
    id: 'vocab_feeling',
    category: QUESTION_CATEGORIES.VOCAB_INFERENCE,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      const correct = /開心|高興|驚喜|哈哈大笑/.test(text)
        ? '感到興奮期待，充滿喜悅'
        : /擔心|緊張|不安/.test(text)
          ? '感到緊張忐忑，略帶不安'
          : '感到溫暖踏實，心裏充滿希望';
      return {
        questionText: '下列哪一項最能說明作者（或主角）當時的感受？',
        correct,
        optionMode: OPTION_MODES.TRAP_ONLY,
        hint: '留意文中帶有情感色彩的詞語，勿選正文碎句。',
        trapProfile: 'feeling',
      };
    },
  },
  {
    id: 'vocab_implication',
    category: QUESTION_CATEGORIES.VOCAB_INFERENCE,
    build(ctx) {
      return {
        questionText: '文末的敘述暗示了什麼道理？',
        correct: buildAbstractAnswer(ctx, 'message'),
        optionMode: OPTION_MODES.ABSTRACT_THEME,
        hint: '結尾通常點題，把事件升華為可借鑑的態度或價值觀。',
        trapProfile: 'implication',
      };
    },
  },
  {
    id: 'vocab_cause_effect',
    category: QUESTION_CATEGORIES.VOCAB_INFERENCE,
    build(ctx) {
      const a = pickAnchor(ctx, 0);
      const correct = shortenLine(a.text, 36);
      return {
        questionText: '根據文章內容，以下哪一個敘述是正確的？',
        correct,
        optionMode: OPTION_MODES.PASSAGE_DETAIL,
        hint: '找出「因」與「果」的對應，避免選擇只描述結果的選項。',
        trapProfile: 'cause',
      };
    },
  },
];
