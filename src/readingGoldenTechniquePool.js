/**
 * 呈分試「十大名校手法 + 六類高頻新題型」標準題型矩陣 — EXAM_METHOD_TEMPLATES
 * 選項 100% 固定專業繁體表述，嚴禁塞入無意義文章碎片。
 */

import { OPTION_MODES } from './readingTypeSafeOptions.js';
import { inferArticleProfile } from './readingArticleProfiler.js';

/** 與 readingAdvancedQuestionPool.QUESTION_CATEGORIES.WRITING_TECHNIQUE 同值 */
export const WRITING_TECHNIQUE_CATEGORY = 'writing_technique';

/**
 * 十大呈分試手法 — 不可破壞的標準樣版池（四大黃金寫作手法 + 六類高頻新題型）
 * Admin / mockDatabase / 動態引擎 / GLOBAL_SHARED_METHODS 共用此矩陣
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

  // ── 名校呈分試高頻新題型（6 類）──
  {
    id: 'type_paragraph_summary',
    type: '段落大意',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '若要為文章中「承上啟下」或過渡的關鍵段落歸納段意，以下哪一個選項最為準確？',
    options: [
      '概括前文主角所面臨的困境，並引出下文他如何克服困難的心路歷程',
      '單純重複第一段的內容，沒有實質的結構意義',
      '列舉故事中所有次要角色的名字與外貌特徵',
      '詳細交代故事發生的具體時間、地點與歷史背景',
    ],
    correctAnswerIndex: 0,
    hint: '提示：歸納段意時要留意文章的結構轉折，通常具備「承前啟後」的作用。',
  },
  {
    id: 'type_punctuation_effect',
    type: '標點符號',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '文中主角說話時使用了「……」（省略號）或破折號，這在語境中起到了什麼作用？',
    options: [
      '表示說話斷斷續續、欲言又止，或者內心正處於極度猶豫、忐忑不安的狀態',
      '代表主角說話聲音太大，導致旁邊的人聽不清楚',
      '純粹是印刷錯誤，在文章中沒有任何實際的語氣含意',
      '表示對話已經結束，不需要再往下閱讀',
    ],
    correctAnswerIndex: 0,
    hint: '提示：呈分試極愛考察省略號（語意未盡/斷續）與破折號（轉折/補充說明）的功能。',
  },
  {
    id: 'type_rhetoric_advanced',
    type: '高級修辭',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '文章中若出現結構相同、語氣一致的連續句子，這運用了什麼修辭手法？能達到什麼效果？',
    options: [
      '運用了排比或層遞手法，節奏明快，層層遞進地烘托出主角堅定不移的決心',
      '運用了借代手法，故意用其他事物來混淆讀者的焦點',
      '運用了對偶手法，純粹為了追求字數對稱，與情感表達無關',
      '運用了反問手法，故意提出問題而不作回答',
    ],
    correctAnswerIndex: 0,
    hint: '提示：排比增強語勢，層遞由淺入深，都是香港高年級必修的拉分修辭。',
  },
  {
    id: 'type_sensory_description',
    type: '感官描寫',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '作者在描寫環境（如雷雨、校園風景）時，同時融入了聲音與色彩。這種描寫手法屬於：',
    options: [
      '缺乏焦點的雜亂描寫，讓讀者抓不到核心畫面',
      '多感官描寫（結合視覺與聽覺），使景物顯得更立體、形象更生動逼真',
      '單純為了展示作者豐富的詞彙量，與烘托主角心情無關',
      '屬於動態描寫的錯誤示範',
    ],
    correctAnswerIndex: 1,
    hint: '提示：小五小六寫景、借景抒情文中，視覺、聽覺、觸覺的互動是考察重點。',
  },
  {
    id: 'type_character_portrayal',
    type: '人物描寫',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '文中透過配角的驚訝反應或旁人的讚美，來烘托出主角的優秀。這屬於哪一種人物描寫手法？',
    options: [
      '直接描寫，由作者直接宣布主角的性格特徵',
      '間接描寫（側面烘托），透過身邊人或環境的反應，更客觀、生動地突顯主角的特質',
      '心理描寫，直接展現主角內心的獨白與矛盾',
      '語言描寫，純粹記錄主要角色的對話內容',
    ],
    correctAnswerIndex: 1,
    hint: '提示：綠葉襯托紅花，側面描寫（間接描寫）能讓人物形象更為豐滿。',
  },
  {
    id: 'type_implied_meaning',
    type: '深層推論',
    category: WRITING_TECHNIQUE_CATEGORY,
    questionText: '結合文章結尾，主角最後說的那句話，背後隱含了什麼「言外之意」？',
    options: [
      '字面上的普通意思，主角只是隨口說說，沒有深層感悟',
      '暗示了主角思想的成熟，表達了他對過去錯誤行為的深刻反省與未來的期盼',
      '主角在向身邊的朋友抱怨生活艱難，內心充滿了負面情緒',
      '暗示故事將會發生悲劇性的逆轉',
    ],
    correctAnswerIndex: 1,
    hint: '提示：呈分試閱讀理解的最後一兩道選擇題，往往考察學生能否讀懂作者的「弦外之音」。',
  },
];

/** 十大呈分試樣版 id（供優先洗牌） */
export const EXAM_METHOD_IDS = EXAM_METHOD_TEMPLATES.map((t) => t.id);

/** 種子矩陣題型總數（4 大寫作手法 + 6 類新高頻題型） */
export const EXAM_METHOD_TEMPLATE_COUNT = EXAM_METHOD_TEMPLATES.length;

/**
 * 高級題型優先池：十大寫作手法 + 修辭題 + 心態轉變題 + 呈分試真題風格
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
  'ws43_four_char_meaning',
  'ws43_quoted_term_reason',
  'ws43_poem_citation_purpose',
  'ws43_author_purpose_aspects',
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
    case 'type_paragraph_summary':
      return (ctx.lines?.length ?? 0) >= 3;
    case 'type_punctuation_effect':
      return /……|…|——|—|「|」|？/.test((ctx.lines ?? []).join(''));
    case 'type_rhetoric_advanced':
      return /、|，.*，|不但|而且|越來越|一.*一/.test((ctx.lines ?? []).join(''));
    case 'type_sensory_description':
      return /聽|看|色|響|雷|雨|風|光|景|聲/.test((ctx.lines ?? []).join(''));
    case 'type_character_portrayal':
      return /他|她|同學|老師|驚|讚|眾人|旁人/.test((ctx.lines ?? []).join(''));
    case 'type_implied_meaning':
      return (ctx.lines?.length ?? 0) >= 4
        && /他|她|主角|爺爺|媽媽|說：|「.+」/.test((ctx.lines ?? []).join(''))
        && !/穀物|稻米|澱粉|營養|加工|品種|說明.*貢獻/.test((ctx.lines ?? []).join(''));
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
