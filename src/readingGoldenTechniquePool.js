/**
 * 呈分試「四大黃金寫作手法」標準題型矩陣 — EXAM_METHOD_TEMPLATES
 * 選項 100% 固定專業繁體表述，嚴禁塞入無意義文章碎片。
 */

import { OPTION_MODES } from './readingTypeSafeOptions.js';
import { inferArticleProfile } from './readingArticleProfiler.js';

/** 與 readingAdvancedQuestionPool.QUESTION_CATEGORIES.WRITING_TECHNIQUE 同值 */
export const WRITING_TECHNIQUE_CATEGORY = 'writing_technique';

/**
 * 四大黃金寫作手法 — 不可破壞的標準樣版池（呈分試高難度）
 * Admin / mockDatabase / 動態引擎共用此矩陣
 */
export const EXAM_METHOD_TEMPLATES = [
  {
    id: 'method_rhetoric_lyric',
    type: '借物抒情',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '本文運用了「借物抒情」的手法。文中主角所關注的核心物件，主要用來抒發什麼情感？',
    options: [
      '透過對物件的細緻描寫，抒發主角對親人的思念以及明白到分享與關愛帶來的真正快樂',
      '單純為了說明該物件的科學構造、市面價格與實用功能',
      '用來暗示主角家庭環境的富裕，以及他對物質生活的追求',
      '藉此說明主角學習進度落後，需要依賴工具來提升專注力',
    ],
    correctAnswerIndex: 0,
    hint: '提示：借物抒情往往是藉由一件有紀念價值的物品，來帶出背後的正向價值觀或深層情感。',
  },
  {
    id: 'method_contrast',
    type: '對比手法',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '文章中多處運用了「對比」手法（例如主角前後心態或情境的轉變）。這種手法在文中有何作用？',
    options: [
      '故意混淆讀者的視聽，使情節變得模糊不清',
      '透過強烈的反差，更鮮明地烘托出主角的心態轉變，從而深化文章的中心思想',
      '為了增加文章的字數，使內容看起來更加豐富',
      '證明主角前後言行不一，是一個缺乏誠信的人',
    ],
    correctAnswerIndex: 1,
    hint: '提示：對比手法能形成強烈反差，讓主角的成長（如由傲慢變慚愧）更加突出。',
  },
  {
    id: 'method_foil',
    type: '襯托手法',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '關於文中運用「襯托」手法的分析，以下哪一項敘述最準確？',
    options: [
      '利用次要人物的反應或惡劣環境的描寫，正襯或反襯出主要人物的情感與核心性格特質',
      '只是為了描寫優美的校園風景，與主角的心理活動毫無關係',
      '這種手法降低了主要情節的真實性，屬於文章的瑕疵',
      '用來證明其他配角的能力與智慧遠遠超過主角',
    ],
    correctAnswerIndex: 0,
    hint: '提示：綠葉襯托紅花，環境的惡劣或配角的驚訝往往是為了突顯主角的行為。',
  },
  {
    id: 'method_transition',
    type: '結構功能',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '文章中間特定的過渡段落或句子，在整篇短文的結構上起到了什麼作用？',
    options: [
      '開門見山，直接點出文章的標題',
      '設置懸念，吸引讀者猜測故事的結局',
      '承上啟下（過渡），既承接了前文的經歷描寫，又開啟了後文的心情轉折與感悟',
      '總結全文，給出具體的行為勸導與建議',
    ],
    correctAnswerIndex: 2,
    hint: '提示：過渡段就像一座橋樑，前半句呼應前面發生的事，後半句引出後面的發展。',
  },
];

/** 四大黃金樣版 id（供優先洗牌） */
export const EXAM_METHOD_IDS = EXAM_METHOD_TEMPLATES.map((t) => t.id);

/**
 * 高級題型優先池：四大寫作手法 + 修辭題 + 心態轉變題
 * 上載 OCR 後優先從此池 Fisher-Yates 洗牌注入
 */
export const PRIORITY_TEMPLATE_IDS = [
  ...EXAM_METHOD_IDS,
  'rhetoric_device',
  'logic_mindset_shift',
  'sspa_article_focus',
  'sspa_author_main_purpose',
  'sspa_para_main_idea',
  'sspa_emotion_express',
];

/** 依文體判斷寫作手法題是否適用（說明文不宜出借物抒情） */
function isMethodApplicable(templateId, ctx) {
  const text = (ctx.lines ?? []).join('');
  const p = inferArticleProfile(ctx);
  switch (templateId) {
    case 'method_rhetoric_lyric':
      return ['narrative', 'nostalgic', 'inspirational'].includes(p.genre)
        || /足球|蛋糕|邀請卡|義肢|望遠鏡|照片|信/.test(text);
    case 'method_contrast':
      return /雖然|但是|然而|卻|前.*後|一方面|另一方面/.test(text);
    case 'method_foil':
      return /環境|風景|同學|配角|襯|烘托/.test(text) || p.genre !== 'expository';
    case 'method_transition':
      return (ctx.lines?.length ?? 0) >= 3;
    default:
      return true;
  }
}

function buildFromTemplate(tpl) {
  const correct = tpl.options[tpl.correctAnswerIndex];
  return {
    questionText: tpl.questionText,
    correct,
    fixedOptions: [...tpl.options],
    fixedCorrectIndex: tpl.correctAnswerIndex,
    optionMode: OPTION_MODES.FIXED_GOLDEN,
    hint: tpl.hint,
    trapProfile: 'technique',
    methodType: tpl.type,
  };
}

/** 引擎用動態樣版（build(ctx) 介面，忽略 ctx — 選項不可變） */
export const EXAM_METHOD_ENGINE_TEMPLATES = EXAM_METHOD_TEMPLATES.map((tpl) => ({
  id: tpl.id,
  category: tpl.category,
  build(ctx) {
    if (!isMethodApplicable(tpl.id, ctx)) return null;
    return buildFromTemplate(tpl);
  },
}));

/** Admin / mockDatabase 靜態格式 */
export function examMethodTemplatesToMockPool() {
  return EXAM_METHOD_TEMPLATES.map((tpl) => ({
    id: tpl.id,
    category: tpl.category,
    questionText: tpl.questionText,
    options: [...tpl.options],
    correctAnswerIndex: tpl.correctAnswerIndex,
    hint: tpl.hint,
    trapProfile: 'technique',
    methodType: tpl.type,
    source: 'exam_method',
  }));
}

/** @deprecated 請改用 EXAM_METHOD_TEMPLATES */
export const GOLDEN_TECHNIQUE_SPECS = EXAM_METHOD_TEMPLATES;

/** @deprecated 請改用 EXAM_METHOD_ENGINE_TEMPLATES */
export const GOLDEN_TECHNIQUE_TEMPLATES = EXAM_METHOD_ENGINE_TEMPLATES;

/** @deprecated 請改用 EXAM_METHOD_IDS */
export const GOLDEN_TECHNIQUE_IDS = EXAM_METHOD_IDS;

/** @deprecated 請改用 examMethodTemplatesToMockPool */
export function goldenSpecsToMockPool() {
  return examMethodTemplatesToMockPool();
}
