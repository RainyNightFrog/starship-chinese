/**
 * 呈分試參考樣版池 — 標點符號、語文知識、固定閱讀選擇題
 * 可直接匯入 ADVANCED_QUESTION_POOL / QUIZ_POOL，無需 OCR 動態生成
 */

import { getReadingReferencePassage } from './readingReferencePassages.js';

export const REFERENCE_CATEGORIES = {
  LANGUAGE_KNOWLEDGE: 'language_knowledge',
  PUNCTUATION: 'punctuation',
  READING_FIXED: 'reading_fixed',
};

/** 標點符號選擇題（對標呈分試真題） */
export const PUNCTUATION_REFERENCE_TEMPLATES = [
  {
    id: 'punct_laptop_watch',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n爸爸昨天買了一部新的手提電腦給哥哥（ ）我想讓哥哥今天借給我用一下（ ）咦（ ）我的手錶怎麼（ ）',
    options: ['， —— ? ......', '， —— ， ?', '， ...... ? ——', '， ...... ， ......'],
    correctAnswerIndex: 1,
    hint: '提示：破折號表示話題轉換；「咦」後用逗號停頓，句末用問號。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
  {
    id: 'punct_sister_warning',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n姐姐嚴肅地警告妹妹說（ ）（ ）你如果下次再做（ ）大話精（ ）的話（ ）你怎麼（ ）怎麼讓別人相信你呢（ ）（ ）',
    options: [
      '： 「 『 』 ， —— ? 」',
      '： 「 ( ) ， ...... ? 」',
      '： 「 『 』 ， ...... ? 」',
      '： 「 『 』 —— ...... ? 」',
    ],
    correctAnswerIndex: 2,
    hint: '提示：對話用冒號、雙引號；稱呼用單引號；停頓用逗號；反問用問號。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
  {
    id: 'punct_education_groups',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n自從教育部推行新課標方案以來（ ）各教育團體包括（ ）教師工會（ ）家長協會（ ）學生聯盟（ ）都陸續表示支持（ ）',
    options: [
      '， ： 、 、 ； 。',
      '， ： 、 、 —— 。',
      '， ： 、 、 …… 。',
      '， —— 、 、 …… 。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：列舉同類機構用頓號；總分關係用冒號；並列分句可用分號。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
  {
    id: 'punct_andersen_titles',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n安徒生（ ）1805 至 1875（ ）（ ）（ ）身為丹麥文學巨擘（ ）以（ ）醜小鴨（ ）（ ）（ ）人魚公主（ ）等雋永童話（ ）為全球孩童編織出充滿詩意的幻想世界（ ）',
    options: [
      '（ ） ， ， 《 》 、 《 》 —— 。',
      '「 」 ， ， 《 》 、 《 》 ， 。',
      '（ ） —— —— 《 》 、 《 》 ， 。',
      '（ ） ， ， 《 》 、 《 》 ， 。',
    ],
    correctAnswerIndex: 3,
    hint: '提示：補充說明用括號；書名用書名號；並列書名用頓號。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
  {
    id: 'punct_parallel_sea_beach',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n海水很清澈（ ）像被過濾過似的（ ）一點雜質也沒有（ ）沙灘很柔軟（ ）像鋪了絨毯似的（ ）沒有一粒碎石（ ）',
    options: [
      '， ， ； ， ， 。',
      '、 、 。 、 、 。',
      '； ； ； ； ； 。',
      '， ， ， ， ， 。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：兩個結構相似的並列分句，中間宜用分號分隔。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
  {
    id: 'punct_yellow_river',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n黃河發源於青海卡日曲（ ）是我國第二長的河流（ ）幹流全長 5464 公里（ ）流域總面積 79.5 萬平方公里（ ）',
    options: [
      '， 。 ， ， 。',
      '， ， ， ， 。',
      '； ； ； ； 。',
      '， ： ， ， 。',
    ],
    correctAnswerIndex: 1,
    hint: '提示：同一主題下補充說明，各分句之間多用逗號。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
  {
    id: 'punct_traffic_buffer',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n根據交通法規（ ）在高速公路行駛時（ ）必須保持安全車距（ ）這些距離又稱為（ ）防撞緩衝區（ ）（ ）',
    options: [
      '， ， 。 「 」 。',
      '， ， ， 「 」 ， 。',
      '： ， 。 「 」 ？',
      '， ， 。 『 』 。',
    ],
    correctAnswerIndex: 1,
    hint: '提示：專有名詞用引號標示；分句之間用逗號。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
  {
    id: 'punct_four_plays',
    category: REFERENCE_CATEGORIES.PUNCTUATION,
    subType: '標點符號',
    questionText: '選出一組適當的標點符號：\n（ ）西廂記（ ）（ ）（ ）牡丹亭（ ）（ ）（ ）桃花扇（ ）和（ ）長生殿（ ）被譽為中國古典四大名劇（ ）',
    options: [
      '《 》 、 《 》 、 《 》 和 《 》 ， 。',
      '「 」 、 「 」 、 「 」 和 「 」 。 。',
      '《 》 ， 《 》 ， 《 》 ， 《 》 。',
      '（ ） （ ） （ ） （ ） ， 。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：戲曲名稱用書名號；並列劇名用頓號；最後一項前用「和」。',
    trapProfile: 'punctuation',
    source: 'sspa_reference',
  },
];

/** 語文知識固定題（修辭辨析、歇後語等） */
export const LANGUAGE_KNOWLEDGE_TEMPLATES = [
  {
    id: 'lang_rhetoric_contrast_spicy',
    category: REFERENCE_CATEGORIES.LANGUAGE_KNOWLEDGE,
    subType: '修辭辨析',
    questionText: '「愛吃辣的人，一碗辣椒也不夠；怕吃辣的人，一隻辣椒也吃不下。」運用了哪種修辭手法？',
    options: ['對比', '比喻', '擬人', '誇張'],
    correctAnswerIndex: 0,
    hint: '提示：前後兩種相反情況並列，形成鮮明反差。',
    trapProfile: 'rhetoric',
    source: 'sspa_reference',
  },
  {
    id: 'lang_rhetoric_contrast_siblings',
    category: REFERENCE_CATEGORIES.LANGUAGE_KNOWLEDGE,
    subType: '修辭辨析',
    questionText: '「弟弟很聰明，小學年紀已能計算高中數學；妹妹很懶惰，一道數學題目也不願去做。」主要運用了？',
    options: ['對比', '排比', '反問', '設問'],
    correctAnswerIndex: 0,
    hint: '提示：把弟弟與妹妹的不同表現並列，突出反差。',
    trapProfile: 'rhetoric',
    source: 'sspa_reference',
  },
  {
    id: 'lang_rhetoric_personification_cloud',
    category: REFERENCE_CATEGORIES.LANGUAGE_KNOWLEDGE,
    subType: '修辭辨析',
    questionText: '「雲姐姐聽了小水點的故事後感動得掉下淚來。」運用了哪種修辭手法？',
    options: ['擬人', '明喻', '反問', '對偶'],
    correctAnswerIndex: 0,
    hint: '提示：把「雲」當作人來寫，賦予人的情感與動作。',
    trapProfile: 'rhetoric',
    source: 'sspa_reference',
  },
  {
    id: 'lang_rhetoric_hypophora',
    category: REFERENCE_CATEGORIES.LANGUAGE_KNOWLEDGE,
    subType: '修辭辨析',
    questionText: '「哪一天是父親節？父親節是每年六月第三個星期日。」運用了哪種修辭手法？',
    options: ['設問', '反問', '反復', '誇張'],
    correctAnswerIndex: 0,
    hint: '提示：先提出問題，再自己作答。',
    trapProfile: 'rhetoric',
    source: 'sspa_reference',
  },
  {
    id: 'lang_idiom_teaching_all',
    category: REFERENCE_CATEGORIES.LANGUAGE_KNOWLEDGE,
    subType: '成語運用',
    questionText: '「孔子有三千弟子，只要是願意學習的，不管交不交得起學費，他都願意教。」後人稱這種教學法為？',
    options: ['有教無類', '因材施教', '溫故知新', '以德服人'],
    correctAnswerIndex: 0,
    hint: '提示：不論貧富貴賤，願意學習的都願教。',
    trapProfile: 'vocab',
    source: 'sspa_reference',
  },
];

/** 固定閱讀理解選擇題（對標真題，無需 OCR） */
export const READING_FIXED_REFERENCE_TEMPLATES = [
  {
    id: 'read_fixed_mangrove_focus',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-4',
    questionText: '【紅樹林】下列哪一項是文章的重點？',
    options: [
      '說明紅樹的特性與對大自然的貢獻',
      '說明紅樹的名稱由來',
      '說明紅樹的作用',
      '鼓勵人們前往濕地公園參觀',
    ],
    correctAnswerIndex: 0,
    hint: '提示：文章重點須概括全文，而非單一細節。',
    trapProfile: 'theme',
    source: 'sspa_reference',
  },
  {
    id: 'read_fixed_mangrove_para',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-4',
    questionText: '【紅樹林】文中哪一段描述了「紅樹」面對的困難？',
    options: ['第一段', '第二段', '第三段', '第四段'],
    correctAnswerIndex: 0,
    hint: '提示：找出交代潮間帶惡劣環境的段落。',
    trapProfile: 'structure',
    source: 'sspa_reference',
  },
  {
    id: 'read_fixed_confucius_not',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-6',
    questionText: '【孔子】下列哪一項不是孔子的貢獻？',
    options: [
      '在世界各地興建孔廟',
      '創立了儒家思想',
      '開創了私學的風氣',
      '把所有重要的典籍進行搜集整理',
    ],
    correctAnswerIndex: 0,
    hint: '提示：興建孔廟是後人紀念，非孔子本人貢獻。',
    trapProfile: 'vocab',
    source: 'sspa_reference',
  },
  {
    id: 'read_fixed_alma_mater_purpose',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-5',
    questionText: '【重返母校】下列哪一項是作者寫這篇文章的主要目的？',
    options: [
      '通過回憶母校生活，抒發對同學的思念',
      '展望自己離開學校以後的生活',
      '描述校園活動以表達對母校的思念',
      '說明不能再像以往那樣開心地踢球',
    ],
    correctAnswerIndex: 2,
    hint: '提示：作者借回憶校園活動抒發對母校的情感。',
    trapProfile: 'intent',
    source: 'sspa_reference',
  },
  {
    id: 'read_fixed_alma_emotion',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-5',
    questionText: '【重返母校】作者在文章中抒發了哪些情感？（選一項）',
    options: [
      '懷念母校',
      '不滿自己的球技比不上別人',
      '後悔因喜歡踢球而忽略學業',
      '慨歎自己沒有珍惜同學之間的友誼',
    ],
    correctAnswerIndex: 0,
    hint: '提示：留意文中對母校、同學、舊日時光的懷念。',
    trapProfile: 'feeling',
    source: 'sspa_reference',
  },
  {
    id: 'read_fixed_antarctica_theme',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-7',
    questionText: '【南極洲】根據《南極條約》相關描述，作者最想傳遞什麼核心信息？',
    options: [
      '南極洲應受國際保護，作為和平與科學研究之用，而非領土爭端的對象',
      '鼓勵各國前往南極洲開採礦產資源',
      '證明法律條約在極地環境下完全無效',
      '說明南極洲的氣候已變得適合人類居住',
    ],
    correctAnswerIndex: 0,
    hint: '提示：結尾通常點出作者對和平利用南極的態度。',
    trapProfile: 'theme',
    source: 'sspa_reference',
  },
  {
    id: 'read_fixed_pistorius_para1',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-8',
    questionText: '【刀鋒跑手】文中第一段主要是？',
    options: [
      '記述比斯托利斯小時候的生活',
      '解釋比斯托利斯失去雙腳的原因',
      '說明比斯托利斯對參與奧運會的想法',
      '指出比斯托利斯與其他運動員不同的地方',
    ],
    correctAnswerIndex: 1,
    hint: '提示：首段多交代背景與人物特殊經歷。',
    trapProfile: 'summary',
    source: 'sspa_reference',
  },
  {
    id: 'read_fixed_pistorius_quote',
    category: REFERENCE_CATEGORIES.READING_FIXED,
    subType: '閱讀理解',
    passageId: 'read-8',
    questionText: '【刀鋒跑手】作者引述比斯托利斯的說話，目的是甚麼？',
    options: [
      '說明比斯托利斯有不肯認輸的性格',
      '指出比斯托利斯能比別人優勝的原因',
      '指出比斯托利斯能豁然面對自己的缺憾',
      '解釋比斯托利斯能和常人一樣運動的原因',
    ],
    correctAnswerIndex: 2,
    hint: '提示：引述對話常為突顯人物面對缺憾的積極態度。',
    trapProfile: 'technique',
    source: 'sspa_reference',
  },
];

/** 全部參考樣版 */
export const SSPA_REFERENCE_TEMPLATES = [
  ...PUNCTUATION_REFERENCE_TEMPLATES,
  ...LANGUAGE_KNOWLEDGE_TEMPLATES,
  ...READING_FIXED_REFERENCE_TEMPLATES,
];

export const SSPA_REFERENCE_IDS = SSPA_REFERENCE_TEMPLATES.map((t) => t.id);

/** 轉為 Admin / mockDatabase 匯入格式 */
export function referenceTemplatesToMockPool(templates = SSPA_REFERENCE_TEMPLATES) {
  return templates.map((tpl) => ({
    id: tpl.id,
    category: tpl.category,
    questionText: tpl.questionText,
    options: [...tpl.options],
    correctAnswerIndex: tpl.correctAnswerIndex,
    hint: tpl.hint,
    trapProfile: tpl.trapProfile ?? 'theme',
    subType: tpl.subType,
    source: tpl.source ?? 'sspa_reference',
  }));
}

/** 閱讀理解參考樣版 — 附文章 metadata 供單元測驗顯示原文 */
function readingPassageFieldsForTemplate(tpl) {
  if (tpl.category !== REFERENCE_CATEGORIES.READING_FIXED || !tpl.passageId) return {};
  const meta = getReadingReferencePassage(tpl.passageId);
  if (!meta?.passage?.length) return {};
  return {
    passageId: meta.passageId,
    passageTitle: meta.passageTitle,
    genre: meta.genre,
    passage: [...meta.passage],
    requiresPassage: true,
  };
}

/** 轉為常考易混淆字形辨析（quiz）格式 */
export function referenceTemplatesToQuizPool(templates = SSPA_REFERENCE_TEMPLATES) {
  const keys = ['A', 'B', 'C', 'D'];
  return templates.map((tpl, idx) => ({
    id: `ref-quiz-${String(idx + 1).padStart(3, '0')}`,
    text: tpl.questionText,
    hint: tpl.hint?.replace(/^提示：/, '') ?? '',
    options: tpl.options.map((word, i) => ({
      key: keys[i],
      word,
      detail: i === tpl.correctAnswerIndex ? '答對了！' : '',
    })),
    correctKey: keys[tpl.correctAnswerIndex] ?? 'A',
    explanation: tpl.hint ?? '',
    isReferenceTemplate: true,
    referenceId: tpl.id,
    ...readingPassageFieldsForTemplate(tpl),
  }));
}

/** 合併預設進階題庫：寫作手法 + 參考樣版 */
export function buildDefaultAdvancedQuestionPool(examMethodPool = []) {
  const seen = new Set();
  const merged = [];
  [...examMethodPool, ...referenceTemplatesToMockPool()].forEach((item) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    merged.push(item);
  });
  return merged;
}
