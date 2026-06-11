/**
 * 呈分試參考題庫 — 網上練習整理版真題手法（米・端午節等）
 * 供固定樣版（單元測驗附文）、動態 OCR 出題、Admin 進階題庫共用
 */

import { OPTION_MODES } from './readingTypeSafeOptions.js';
import { inferArticleProfile } from './readingArticleProfiler.js';

/** 題型手法標籤（供篩選／統計） */
export const WORKSHEET_TECHNIQUE_TAGS = {
  IDIOM_TRANSFER: 'idiom_transfer',
  FOUR_CHAR_MEANING: 'four_char_meaning',
  DETAIL_REASON: 'detail_reason',
  POEM_CITATION: 'poem_citation',
  AUTHOR_PURPOSE: 'author_purpose',
  PARAGRAPH_DETAIL: 'paragraph_detail',
  CUSTOM_ORIGIN: 'custom_origin',
  NEGATIVE_FACT: 'negative_fact',
  MAIN_THEME: 'main_theme',
};

/** 參考文章《米》— 對標 beasmartc9 小五閱讀理解(43) 上文 */
export const RICE_EXPOSITORY_PASSAGE = [
  '在香港，米飯是我們的主要食糧。即使香港有著多元的飲食文化，在大部分人的家庭裡，米飯仍然是飯桌上的主角。不過，你對米又有多少認識呢？',
  '所謂「米」，現在一般都是指稻米，也就是從收成的稻穀打出來的顆粒；更準確地說，就是一種穀物的種子去皮之後的穀實。根據典籍記載，除了稻這種植物之外，其他穀物如黍、稷、粱和大豆，它們的種子在去殼後，同樣也稱作「米」。',
  '除了穀物有別外，我們還可以從米的黏性高低來把米分類。例如：我們日常在香港吃到的米，黏性最低，澱粉含量高。至於粳米，黏性比較高，米粒也較短而圓，主要在中國北方種植。糯米的黏性最高，營養價值也較豐富，除了可做成各種各樣的食物外，甚至可以與其他食物搭配來治病，確實是「一米多用」。',
  '米在收成以後，便需要加工去殼，才能成為食材。我們日常接觸到的白米，其實是經過多重加工精製而成的，去除了稻殼、糠層和胚，只保留胚乳，也就是最潔白的那部分。糙米則是只去除稻殼，其營養價值比白米高，但浸水和煮食時間也相對較長。此外，還有預熟米、發芽米、營養強化米、速食米、免淘洗米等等，不勝枚舉。',
  '米作為食材，當然不只可以煮成飯和粥這兩種最普遍的食品。以米製成的食品可謂五花八門。單是麵條，便有米粉、河粉、金邊粉、瀨粉等等，其做法主要是把米磨成粉後，再製成麵條狀，大部分在製作的過程中已經煮熟，因此煮食時只需以熱水燙熱便可食用。此外，米還可以製成不同的糕點小吃，例如：鍋巴、米通、米餅。以糯米製成的食品就更多了，元宵節必吃的湯圓，在茶樓很受食客歡迎的糯米雞，端午節的應節食品粽子，以及香港人喜歡的地道小吃糯米糍和糖不甩……「米」，的確是世上最變化多端的食材。',
  '「誰知盤中飧，粒粒皆辛苦」，既然米有這麼多用處，我們就更應該好好珍惜，不要隨意浪費。',
];

/** 文中可考察的四字詞語（定義 → 詞語） */
export const FOUR_CHAR_IDIOM_PATTERNS = [
  { word: '變化多端', meaning: '變化極多、變化很大', test: /變化多端/ },
  { word: '五花八門', meaning: '種類繁多、式樣極多', test: /五花八門/ },
  { word: '不勝枚舉', meaning: '數量太多，無法一一舉出', test: /不勝枚舉/ },
  { word: '粒粒皆辛苦', meaning: '每一粒都來之不易', test: /粒粒皆辛苦/ },
];

function structured(correct, distractors, correctIndex = 0) {
  const opts = [correct, ...distractors].filter(Boolean);
  const unique = [...new Set(opts)];
  while (unique.length < 4) unique.push(`與文章內容不符的敘述（干擾${unique.length}）`);
  const fixedCorrectIndex = unique.indexOf(correct);
  return {
    correct,
    structuredOptions: unique.slice(0, 4),
    fixedCorrectIndex: fixedCorrectIndex >= 0 ? fixedCorrectIndex : correctIndex,
    optionMode: OPTION_MODES.STRUCTURED_CHOICE,
  };
}

/** 固定參考選擇題（附 read-19 文章）— 對標真題 Q2–Q5 */
export const WORKSHEET43_READING_FIXED_TEMPLATES = [
  {
    id: 'read_fixed_rice_four_char',
    passageId: 'read-19',
    technique: WORKSHEET_TECHNIQUE_TAGS.FOUR_CHAR_MEANING,
    questionText: '【米】文中哪一個四字詞語有「變化極多、變化很大」的意思？',
    options: ['變化多端', '不勝枚舉', '粒粒皆辛苦', '五花八門'],
    correctAnswerIndex: 0,
    hint: '提示：留意形容「米」作為食材用途廣泛的句子，勿與「種類多」混淆。',
    trapProfile: 'vocab',
    source: 'worksheet_ref_43',
  },
  {
    id: 'read_fixed_rice_glutinous_reason',
    passageId: 'read-19',
    technique: WORKSHEET_TECHNIQUE_TAGS.DETAIL_REASON,
    questionText: '【米】作者認為糯米是「一米多用」，因為',
    options: [
      '糯米的黏性最高。',
      '糯米既能做成食物，又能治病。',
      '糯米可以製成多種美食。',
      '糯米的種植地方與其他米不同。',
    ],
    correctAnswerIndex: 1,
    hint: '提示：「一米多用」強調用途多元；文中除食物外還提到可搭配治病。',
    trapProfile: 'cause',
    source: 'worksheet_ref_43',
  },
  {
    id: 'read_fixed_rice_poem_purpose',
    passageId: 'read-19',
    technique: WORKSHEET_TECHNIQUE_TAGS.POEM_CITATION,
    questionText: '【米】作者在文中引用了詩句「誰知盤中飧，粒粒皆辛苦」，目的是',
    options: [
      '表達作者對人們浪費米的不滿。',
      '說明古人已知道米有多種用途。',
      '證明古人也明白不應隨意浪費米。',
      '總結米是有多元用途，不應浪費。',
    ],
    correctAnswerIndex: 3,
    hint: '提示：結尾引用古詩，通常呼應全文主旨——認識米的價值並珍惜食糧。',
    trapProfile: 'technique',
    source: 'worksheet_ref_43',
  },
  {
    id: 'read_fixed_rice_main_purpose',
    passageId: 'read-19',
    technique: WORKSHEET_TECHNIQUE_TAGS.AUTHOR_PURPOSE,
    questionText: '【米】作者寫這篇文章的主要目的是',
    options: [
      '從不同方面介紹米。',
      '說明米的食用價值。',
      '探討米的營養價值。',
      '指責人們對米的浪費。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：文章從定義、分類、加工到製成食品多方面說明，目的須能概括全文。',
    trapProfile: 'intent',
    source: 'worksheet_ref_43',
  },
];

/** 成語遷移題（真題 Q1 手法：依語境選四字詞語） */
export const WORKSHEET43_IDIOM_TRANSFER_TEMPLATE = {
  id: 'lang_idiom_wu_hua_ba_men',
  technique: WORKSHEET_TECHNIQUE_TAGS.IDIOM_TRANSFER,
  questionText: '「市面上的智能電話種類可謂__________，購買時必須謹慎選擇適合自己的產品。」句中橫線應填入？',
  options: ['五花八門', '不勝枚舉', '變化多端', '粒粒皆辛苦'],
  correctAnswerIndex: 0,
  hint: '提示：形容種類繁多、式樣極多；本文亦以「五花八門」形容米製食品。',
  trapProfile: 'vocab',
  source: 'worksheet_ref_43',
};

/** 動態 OCR 樣版 — 依正文關鍵詞自動套用真題手法 */
export const WORKSHEET43_DYNAMIC_TEMPLATES = [
  {
    id: 'ws43_four_char_meaning',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.FOUR_CHAR_MEANING,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      const hit = FOUR_CHAR_IDIOM_PATTERNS.find((p) => p.test.test(text));
      if (!hit) return null;
      const others = FOUR_CHAR_IDIOM_PATTERNS.filter((p) => p.word !== hit.word).map((p) => p.word);
      const built = structured(hit.word, others);
      return {
        questionText: `文中哪一個四字詞語有「${hit.meaning}」的意思？`,
        ...built,
        hint: '提示：把各選項放回原文相關句子，對照語境判斷詞語的準確含義。',
        trapProfile: 'vocab',
        worksheetRef: 'worksheet_ref_43',
      };
    },
  },
  {
    id: 'ws43_quoted_term_reason',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.DETAIL_REASON,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/一米多用/.test(text) && !/糯米/.test(text)) return null;
      const built = structured(
        '糯米既能做成食物，又能治病。',
        [
          '糯米的黏性最高。',
          '糯米可以製成多種美食。',
          '糯米的種植地方與其他米不同。',
        ],
      );
      return {
        questionText: '作者認為糯米是「一米多用」，因為',
        ...built,
        hint: '提示：找出文中直接說明「一米多用」理由的句子，勿只選部分用途。',
        trapProfile: 'cause',
        worksheetRef: 'worksheet_ref_43',
      };
    },
  },
  {
    id: 'ws43_poem_citation_purpose',
    category: 'rhetoric',
    technique: WORKSHEET_TECHNIQUE_TAGS.POEM_CITATION,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/誰知盤中飧|粒粒皆辛苦/.test(text)) return null;
      const p = inferArticleProfile(ctx);
      const correct = p.quotePurpose?.includes('珍惜')
        ? '總結米是有多元用途，不應浪費。'
        : (p.quotePurpose ?? '總結全文主旨，呼籲讀者珍惜食糧。');
      const built = structured(correct, [
        '表達作者對人們浪費米的不滿。',
        '說明古人已知道米有多種用途。',
        '證明古人也明白不應隨意浪費米。',
      ]);
      return {
        questionText: '作者在文中引用了詩句「誰知盤中飧，粒粒皆辛苦」，目的是',
        ...built,
        hint: '提示：引用古詩常與結尾呼應，思考它如何總結全文關於「米」的論述。',
        trapProfile: 'technique',
        worksheetRef: 'worksheet_ref_43',
      };
    },
  },
  {
    id: 'ws43_author_purpose_aspects',
    category: 'main_theme',
    technique: WORKSHEET_TECHNIQUE_TAGS.AUTHOR_PURPOSE,
    build(ctx) {
      const p = inferArticleProfile(ctx);
      if (p.genre !== 'expository' || !/米|穀物|稻米/.test((ctx.lines ?? []).join(''))) return null;
      const built = structured(
        '從不同方面介紹米。',
        [
          '說明米的食用價值。',
          '探討米的營養價值。',
          '指責人們對米的浪費。',
        ],
      );
      return {
        questionText: '作者寫這篇文章的主要目的是',
        ...built,
        hint: '提示：說明文若從定義、分類、加工、用途等多方面論述，目的應能概括全文。',
        trapProfile: 'intent',
        worksheetRef: 'worksheet_ref_43',
      };
    },
  },
];

export const WORKSHEET43_TEMPLATE_IDS = [
  ...WORKSHEET43_READING_FIXED_TEMPLATES.map((t) => t.id),
  WORKSHEET43_IDIOM_TRANSFER_TEMPLATE.id,
  ...WORKSHEET43_DYNAMIC_TEMPLATES.map((t) => t.id),
];

/** 參考文章《端午節》— beasmartc9 閱讀理解真題上文 */
export const DUANWU_EXPOSITORY_PASSAGE = [
  '農曆五月初五是端午節，端午節的由來與傳說有很多，但流傳最廣的是紀念屈原的傳說。楚國大臣屈原主張聯合齊國對抗秦國，但他的主張遭到楚國貴族的反對。後來秦軍攻打楚國，楚國滅亡。屈原看到國家覆亡，便在五月初五投汨羅江自殺殉國。',
  '傳說屈原死後，楚國百姓爭相划船打撈屈原，逐漸發展成龍舟競渡的習俗。有個百姓將米團、雞蛋等扔進江裏，說是讓魚蝦吃飽就不會糟蹋屈原的身體，後來發展成人們吃粽子的習俗。還有位老醫師拿來雄黃酒倒進江裏，說是要把蛟龍、水獸弄暈，免得牠們傷害屈原，後來就有了端午節喝雄黃酒的習俗。屈原的愛國精神深入人心，所以大部分人把端午節的習俗與紀念屈原聯繫在一起。',
  '端午節除了以上習俗，還有佩戴香囊，在門口插艾草等習俗。總之，端午節的風俗有很多，因地區不同而截然不同。',
  '在香港，除了吃粽子、龍舟競渡，還有獨具特色的「大澳龍舟遊涌」。相傳在一百多年前，大澳出現瘟疫，漁民用龍舟載着神像巡遊水道，使瘟疫得以消除。此後就有了「龍舟遊涌」的傳統。',
  '每年端午節，大澳三個傳統漁業行會（扒艇行、鮮魚行和合心堂）都會舉辦「龍舟遊涌」的活動。行會成員前往大澳的四間廟宇請出小神像，接回各行會供奉祭祀。在五月初五的早上，扒艇行成員划龍舟採集青草後將草放進龍口，即「採青」。行會的長老又把雄雞血混到白酒裏，然後灑到龍頭、龍尾及船身上，這被稱為「喝龍」，有驅邪的意思。之後的活動就是「遊涌」，又被稱為「遊神」，由龍舟載着神像巡遊各水道，同時棚屋居民也朝着巡遊的龍舟焚香拜祭，祈求平安。「遊涌」完畢後，三條龍舟進行競渡表演，來娛樂神明。到了下午，各行會再「送神」，把神像送回各廟宇。',
  '對於端午節，你是不是有了更多了解呢？',
];

/** 固定參考選擇題（附 read-20 文章）— 對標真題 Q3–Q6 */
export const WORKSHEET_DUANWU_READING_FIXED_TEMPLATES = [
  {
    id: 'read_fixed_duanwu_zongzi_reason',
    passageId: 'read-20',
    technique: WORKSHEET_TECHNIQUE_TAGS.PARAGRAPH_DETAIL,
    questionText: '【端午節】根據第二段，為甚麼百姓將米糰、雞蛋扔到江水中？',
    options: [
      '因為他們要飼養魚蝦。',
      '因為他們不想讓魚蝦餓着。',
      '因為他們想供奉水中的神獸。',
      '因為他們想保護屈原的身體。',
    ],
    correctAnswerIndex: 3,
    hint: '提示：文中說讓魚蝦吃飽，以免糟蹋屈原的身體。',
    trapProfile: 'cause',
    source: 'worksheet_ref_duanwu',
  },
  {
    id: 'read_fixed_duanwu_tai_o_plague',
    passageId: 'read-20',
    technique: WORKSHEET_TECHNIQUE_TAGS.CUSTOM_ORIGIN,
    questionText: '【端午節】一百多年前大澳漁民用龍舟載着神像巡遊水道的原因是',
    options: [
      '消除瘟疫。',
      '供奉神明。',
      '向市民展覽神像。',
      '讓更多大澳居民認識神像。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：第四段交代大澳遊涌起源與消除瘟疫有關。',
    trapProfile: 'cause',
    source: 'worksheet_ref_duanwu',
  },
  {
    id: 'read_fixed_duanwu_negative_parade',
    passageId: 'read-20',
    technique: WORKSHEET_TECHNIQUE_TAGS.NEGATIVE_FACT,
    questionText: '【端午節】根據第五段，下列哪一項不符合對「龍舟遊涌」的描述？',
    options: [
      '龍舟載着神像巡遊各水道。',
      '五條龍舟進行競渡表演娛樂神明。',
      '行會成員前往大澳四間廟宇請出小神像。',
      '行會長老把雄雞血混到白酒灑到龍頭、龍尾及船身上。',
    ],
    correctAnswerIndex: 1,
    hint: '提示：文中寫「三條龍舟」競渡，並非五條；其餘選項均可在第五段找到。',
    trapProfile: 'vocab',
    source: 'worksheet_ref_duanwu',
  },
  {
    id: 'read_fixed_duanwu_main_theme',
    passageId: 'read-20',
    technique: WORKSHEET_TECHNIQUE_TAGS.MAIN_THEME,
    questionText: '【端午節】這篇文章的主旨是',
    options: [
      '介紹端午節的由來和各種習俗。',
      '記述屈原以身殉國的經過。',
      '記述「龍舟遊涌」的經過。',
      '描寫大澳不同的神像。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：全文由屈原傳說、一般習俗寫到大澳特色，主旨須概括全篇。',
    trapProfile: 'theme',
    source: 'worksheet_ref_duanwu',
  },
];

/** 動態 OCR 樣版 — 端午節／習俗說明文 */
export const WORKSHEET_DUANWU_DYNAMIC_TEMPLATES = [
  {
    id: 'ws_duanwu_zongzi_throw_reason',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.PARAGRAPH_DETAIL,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/屈原/.test(text) || !/米[團糰]|粽子|雞蛋/.test(text)) return null;
      const built = structured(
        '因為他們想保護屈原的身體。',
        [
          '因為他們要飼養魚蝦。',
          '因為他們不想讓魚蝦餓着。',
          '因為他們想供奉水中的神獸。',
        ],
        0,
      );
      return {
        questionText: '根據文章，為甚麼百姓將米糰、雞蛋扔到江水中？',
        ...built,
        hint: '提示：找出文中說明投擲米糰、雞蛋目的的句子，留意因果關係。',
        trapProfile: 'cause',
        worksheetRef: 'worksheet_ref_duanwu',
      };
    },
  },
  {
    id: 'ws_duanwu_tai_o_origin',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.CUSTOM_ORIGIN,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/大澳/.test(text) || !/瘟疫|遊涌/.test(text)) return null;
      const built = structured(
        '消除瘟疫。',
        ['供奉神明。', '向市民展覽神像。', '讓更多大澳居民認識神像。'],
      );
      return {
        questionText: '一百多年前大澳漁民用龍舟載着神像巡遊水道的原因是',
        ...built,
        hint: '提示：找出交代「龍舟遊涌」起源的段落，區分「原因」與「後來的習俗」。',
        trapProfile: 'cause',
        worksheetRef: 'worksheet_ref_duanwu',
      };
    },
  },
  {
    id: 'ws_duanwu_negative_parade_fact',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.NEGATIVE_FACT,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/龍舟遊涌|大澳/.test(text)) return null;
      const countMatch = text.match(/([三四五六])條龍舟進行競渡/);
      if (!countMatch) return null;
      const correctCount = countMatch[1];
      const wrongCount = ['三', '四', '五', '六'].find((c) => c !== correctCount) ?? '五';
      const built = structured(
        `${wrongCount}條龍舟進行競渡表演娛樂神明。`,
        [
          '龍舟載着神像巡遊各水道。',
          '行會成員前往大澳四間廟宇請出小神像。',
          '行會長老把雄雞血混到白酒灑到龍頭、龍尾及船身上。',
        ],
        0,
      );
      return {
        questionText: '下列哪一項不符合對「龍舟遊涌」的描述？',
        ...built,
        hint: '提示：逐項對照原文數字、步驟與用語，找出與文章不符的選項。',
        trapProfile: 'vocab',
        worksheetRef: 'worksheet_ref_duanwu',
      };
    },
  },
  {
    id: 'ws_duanwu_main_theme',
    category: 'main_theme',
    technique: WORKSHEET_TECHNIQUE_TAGS.MAIN_THEME,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/端午節/.test(text) || !/屈原|龍舟|粽子/.test(text)) return null;
      const built = structured(
        '介紹端午節的由來和各種習俗。',
        [
          '記述屈原以身殉國的經過。',
          '記述「龍舟遊涌」的經過。',
          '描寫大澳不同的神像。',
        ],
      );
      return {
        questionText: '這篇文章的主旨是',
        ...built,
        hint: '提示：主旨須概括全文（由來、習俗、地方特色），勿只取其中一段。',
        trapProfile: 'theme',
        worksheetRef: 'worksheet_ref_duanwu',
      };
    },
  },
];

export const WORKSHEET_DUANWU_TEMPLATE_IDS = [
  ...WORKSHEET_DUANWU_READING_FIXED_TEMPLATES.map((t) => t.id),
  ...WORKSHEET_DUANWU_DYNAMIC_TEMPLATES.map((t) => t.id),
];

/** 全部試卷參考樣版（固定附文 + 動態 OCR） */
export const WORKSHEET_READING_FIXED_TEMPLATES = [
  ...WORKSHEET43_READING_FIXED_TEMPLATES,
  ...WORKSHEET_DUANWU_READING_FIXED_TEMPLATES,
];

export const WORKSHEET_DYNAMIC_TEMPLATES = [
  ...WORKSHEET43_DYNAMIC_TEMPLATES,
  ...WORKSHEET_DUANWU_DYNAMIC_TEMPLATES,
];

export const WORKSHEET_TEMPLATE_IDS = [
  ...WORKSHEET43_TEMPLATE_IDS,
  ...WORKSHEET_DUANWU_TEMPLATE_IDS,
];
