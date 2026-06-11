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
  NARRATOR_FEELING: 'narrator_feeling',
  EMAIL_PURPOSE: 'email_purpose',
  EXPRESS_FEELINGS: 'express_feelings',
  HUMAN_CONTRIBUTION: 'human_contribution',
  FRUIT_LOCATION: 'fruit_location',
  LETTER_PARAGRAPH: 'letter_paragraph',
  CHARACTER_TRAIT: 'character_trait',
  GIFT_DETAIL: 'gift_detail',
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
  '傳說屈原死後，楚國百姓爭相划船打撈屈原，逐漸發展成龍舟競渡的習俗。有個百姓將米團、雞蛋等扔進江裏，說是讓魚蝦吃飽就不會糟蹋屈原的身體，後來發展成人們吃粽子的習俗。還有位老醫師拿來雄黃酒倒進江裏，說是要把蛟龍、水獸弄暈，免得牠們傷害屈原，後來就有了端午節喝雄黃酒的習俗。屈原的愛國精神深入民心，所以大部分人把端午節的習俗與紀念屈原聯繫在一起。',
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

/** 參考文章《叔叔嬸嬸來港》— beasmartc9 敘事閱讀真題上文（正平） */
export const ZHENGPING_NARRATIVE_PASSAGE = [
  '星期天太清早，媽媽在我的耳邊大喊：「快起床呀！已經八點了。」我睡意正濃，趴在床上不肯起來。媽媽說：「叔叔和嬸嬸今天來香港，你的房間要騰出給他們住幾天呢！你趕快起來，我得收拾一下。」原本打算星期天可以睡到自然醒，但因為叔叔和嬸嬸藉着「五一黃金周」來「自由行」，我當時真有點不高興呢，但奶奶卻顯得非常興奮。',
  '五月一日是勞動節。前一天晚上我們一家人陪叔叔和嬸嬸夜遊太平山。很晚才睡，所以這天大家都遲了起床。爸爸提議到香港迪士尼樂園遊玩，這當然最合我心意了。叔叔嬸嬸好像有用不完的精力，一直陪我玩各種機動遊戲，大家都玩得不亦樂乎！',
  '星期二那天，媽媽費了很大勁，才把我弄醒。因為前兩天實在太疲累。我吃過早餐後，便拖着疲乏的身軀上學去。可是上課時，精神總是無法集中，昏頭腦脹地過了一天。',
  '星期三晚飯時，叔叔嬸嬸告訴我，他倆明天會搭中午的航班回內地。這時候，我真有點捨不得他們呢！叔叔嬸嬸又勉勵我要努力讀書，還叮囑我暑假到北京去探望他們，我都一一答應了。',
  '星期四放學回家，媽媽已把我的房間恢復了整潔的面貌。當我看到叔叔和嬸嬸送給我的禮物時，不禁想起這幾天跟他們玩樂的情景。',
  '星期五晚飯後，我開啟電腦，看見電腦正顯示有新的郵件。我立即打開電子郵箱，原來是叔叔給我的郵件：正平：在香港幾天的旅程，我和你嬸嬸都玩得十分高興。我們很感謝你們一家的熱情接待。暑假時，請你們務必到北京來，我來當「東道主」帶你們去玩！——叔叔',
  '我立即把郵件的內容告訴奶奶和爸爸媽媽，然後給叔叔回覆電郵。這個星期雖然休息得不怎麼好，但我的心情卻十分愉快。',
];

/** 固定參考選擇題（附 read-21 文章）— 對標真題 Q3–Q5、Q7 */
export const WORKSHEET_ZHENGPING_READING_FIXED_TEMPLATES = [
  {
    id: 'read_fixed_zhengping_sunday_unhappy',
    passageId: 'read-21',
    technique: WORKSHEET_TECHNIQUE_TAGS.NARRATOR_FEELING,
    questionText: '【叔叔嬸嬸來港】為甚麼「我」在星期天大清早有點不高興？',
    options: [
      '因為「我」不可以遲一點起床。',
      '因為「五一黃金周」已到來。',
      '因為國內的叔叔嬸嬸來了香港。',
      '因為媽媽要「我」收拾房間。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：首段寫原本打算睡到自然醒，卻被媽媽早早叫醒騰出房間。',
    trapProfile: 'cause',
    source: 'worksheet_ref_zhengping',
  },
  {
    id: 'read_fixed_zhengping_reluctant',
    passageId: 'read-21',
    technique: WORKSHEET_TECHNIQUE_TAGS.NARRATOR_FEELING,
    questionText: '【叔叔嬸嬸來港】為甚麼「我」有點捨不得叔叔嬸嬸？',
    options: [
      '因為叔叔嬸嬸送給「我」一份禮物。',
      '因為叔叔嬸嬸勉勵「我」要努力讀書。',
      '因為「我」想起這幾天跟叔叔嬸嬸玩樂的情景。',
      '因為叔叔嬸嬸讓「我」暑假到北京去探望他們。',
    ],
    correctAnswerIndex: 2,
    hint: '提示：捨不得與前幾天一起遊玩、建立感情的記憶有關。',
    trapProfile: 'feeling',
    source: 'worksheet_ref_zhengping',
  },
  {
    id: 'read_fixed_zhengping_email_not',
    passageId: 'read-21',
    technique: WORKSHEET_TECHNIQUE_TAGS.EMAIL_PURPOSE,
    questionText: '【叔叔嬸嬸來港】下列哪一項不是叔叔給正平發電郵的原因？',
    options: [
      '答謝正平借出房間。',
      '感謝正平一家的接待。',
      '告訴正平旅程十分愉快。',
      '邀請正平一家暑假到北京遊玩。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：對照郵件內容，找出文中未提及的答謝理由。',
    trapProfile: 'vocab',
    source: 'worksheet_ref_zhengping',
  },
  {
    id: 'read_fixed_zhengping_happiest_day',
    passageId: 'read-21',
    technique: WORKSHEET_TECHNIQUE_TAGS.PARAGRAPH_DETAIL,
    questionText: '【叔叔嬸嬸來港】叔叔嬸嬸來港這幾天裏，哪一天是作者最快樂的？',
    options: [
      '五月一日（勞動節），因為到迪士尼樂園玩機動遊戲。',
      '星期天，因為可以睡到自然醒。',
      '星期二，因為精神飽滿地上學。',
      '星期四，因為房間恢復整潔。',
    ],
    correctAnswerIndex: 0,
    hint: '提示：留意「最合我心意」「玩得不亦樂乎」等用語所在的段落。',
    trapProfile: 'cause',
    source: 'worksheet_ref_zhengping',
  },
  {
    id: 'read_fixed_zhengping_main_purpose',
    passageId: 'read-21',
    technique: WORKSHEET_TECHNIQUE_TAGS.EXPRESS_FEELINGS,
    questionText: '【叔叔嬸嬸來港】作者寫這篇文章的主要目的是甚麼？',
    options: [
      '記述自己要早起床的原因。',
      '說明叔叔嬸嬸從北京來港度假。',
      '描寫叔叔嬸嬸遊覽香港的情況。',
      '抒發自己對叔叔嬸嬸來港遊玩的感受。',
    ],
    correctAnswerIndex: 3,
    hint: '提示：全文以「我」的經歷與心情變化為主，不止記錄行程。',
    trapProfile: 'intent',
    source: 'worksheet_ref_zhengping',
  },
];

/** 動態 OCR 樣版 — 敘事／來港探親類文章 */
export const WORKSHEET_ZHENGPING_DYNAMIC_TEMPLATES = [
  {
    id: 'ws_zhengping_sunday_unhappy',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.NARRATOR_FEELING,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/叔叔|嬸嬸/.test(text) || !/不高興|不開心/.test(text)) return null;
      if (!/睡到自然醒|八點|起床/.test(text)) return null;
      const built = structured(
        '因為「我」不可以遲一點起床。',
        [
          '因為「五一黃金周」已到來。',
          '因為國內的叔叔嬸嬸來了香港。',
          '因為媽媽要「我」收拾房間。',
        ],
        0,
      );
      return {
        questionText: '為甚麼「我」在星期天大清早有點不高興？',
        ...built,
        hint: '提示：找出首段中「我」原本期望與實際處境的落差。',
        trapProfile: 'cause',
        worksheetRef: 'worksheet_ref_zhengping',
      };
    },
  },
  {
    id: 'ws_zhengping_reluctant_farewell',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.NARRATOR_FEELING,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/捨不得/.test(text) || !/叔叔|嬸嬸/.test(text)) return null;
      const built = structured(
        '因為「我」想起這幾天跟叔叔嬸嬸玩樂的情景。',
        [
          '因為叔叔嬸嬸送給「我」一份禮物。',
          '因為叔叔嬸嬸勉勵「我」要努力讀書。',
          '因為叔叔嬸嬸讓「我」暑假到北京去探望他們。',
        ],
        0,
      );
      return {
        questionText: '為甚麼「我」有點捨不得叔叔嬸嬸？',
        ...built,
        hint: '提示：聯繫前幾天一起遊玩、相處的描寫，理解情感來源。',
        trapProfile: 'feeling',
        worksheetRef: 'worksheet_ref_zhengping',
      };
    },
  },
  {
    id: 'ws_zhengping_email_not_reason',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.EMAIL_PURPOSE,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/電郵|郵件|電子郵箱/.test(text) || !/叔叔/.test(text)) return null;
      const built = structured(
        '答謝正平借出房間。',
        [
          '感謝正平一家的接待。',
          '告訴正平旅程十分愉快。',
          '邀請正平一家暑假到北京遊玩。',
        ],
        0,
      );
      return {
        questionText: '下列哪一項不是叔叔給正平發電郵的原因？',
        ...built,
        hint: '提示：逐項對照郵件原文，找出未提及的內容。',
        trapProfile: 'vocab',
        worksheetRef: 'worksheet_ref_zhengping',
      };
    },
  },
  {
    id: 'ws_zhengping_happiest_day',
    category: 'paragraph_logic',
    technique: WORKSHEET_TECHNIQUE_TAGS.PARAGRAPH_DETAIL,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/迪士尼|迪士尼樂園/.test(text) || !/叔叔|嬸嬸/.test(text)) return null;
      const built = structured(
        '五月一日（勞動節），因為到迪士尼樂園玩機動遊戲。',
        [
          '星期天，因為可以睡到自然醒。',
          '星期二，因為精神飽滿地上學。',
          '星期四，因為房間恢復整潔。',
        ],
      );
      return {
        questionText: '叔叔嬸嬸來港這幾天裏，哪一天是作者最快樂的？',
        ...built,
        hint: '提示：找出文中明確寫出「最合心意」「玩得不亦樂乎」的段落。',
        trapProfile: 'cause',
        worksheetRef: 'worksheet_ref_zhengping',
      };
    },
  },
  {
    id: 'ws_zhengping_narrative_purpose',
    category: 'main_theme',
    technique: WORKSHEET_TECHNIQUE_TAGS.EXPRESS_FEELINGS,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/叔叔|嬸嬸/.test(text) || !/香港/.test(text)) return null;
      if (!/我|正平/.test(text) && !/「我」/.test(text)) return null;
      const p = inferArticleProfile(ctx);
      if (p.genre === 'expository') return null;
      const built = structured(
        '抒發自己對叔叔嬸嬸來港遊玩的感受。',
        [
          '記述自己要早起床的原因。',
          '說明叔叔嬸嬸從北京來港度假。',
          '描寫叔叔嬸嬸遊覽香港的情況。',
        ],
        0,
      );
      return {
        questionText: '作者寫這篇文章的主要目的是甚麼？',
        ...built,
        hint: '提示：敘事文若以第一人稱寫親友來訪，常重在抒發個人感受與心情轉變。',
        trapProfile: 'intent',
        worksheetRef: 'worksheet_ref_zhengping',
      };
    },
  },
];

export const WORKSHEET_ZHENGPING_TEMPLATE_IDS = [
  ...WORKSHEET_ZHENGPING_READING_FIXED_TEMPLATES.map((t) => t.id),
  ...WORKSHEET_ZHENGPING_DYNAMIC_TEMPLATES.map((t) => t.id),
];

/** 參考文章《奇怪的樹》— beasmartc9 閱讀理解(47) 上文 */
export const STRANGE_TREES_EXPOSITORY_PASSAGE = [
  '大自然有許多稀奇古怪的植物，你有沒有見過？現在讓我向大家逐一介紹。',
  '在非洲的安哥拉，長著一種四季常綠的梓柯樹。如果有人在樹下點火弄出煙霧，或者點燃一堆火，樹上就會噴出大量汁液，把火撲熄。所以人們叫它做「滅火樹」。這究竟是怎麼一回事呢？原來，梓柯樹枝葉茂密，藏有許多饅頭般大小的節苞，節苞上密佈著網眼小孔，一旦有火光照耀，節苞裏的汁液就會噴出來。',
  '在菲律賓有一種會做「米」的樹，叫「西穀米樹」。它的樹幹粗直，有三五層樓高，開花後就會死去。人們在它開花之前將樹砍倒，把莖裏的澱粉刮出來，加工成像大米一樣的顆粒，這叫「西穀米」。用這種米煮出來的飯跟大米煮出來的飯沒有甚麼大的區別，所以可以代替大米。現在，中國南方也有這種樹了。',
  '在熱帶地方，還有種樹，能結出像麵包一樣的果實。每個果實有三至四斤重。把這種果實摘下來放到火上烤一烤，就會散發出陣陣香味，吃在口裏，酸中帶甜，很像麵包的味道，所以人們叫它「麵包樹」。一棵麵包樹一年裏有九個月能結果。在結果的季節，樹枝、樹幹、樹根上都會長出像足球一樣大小的果實來。通常是一批成熟了，另一批果實又結出來了。可不要小看它的結果量，一棵麵包樹能夠養活一至兩個人呢！或許可以解決全球糧食不足。',
  '世界上還有很多其他奇怪的樹，你有興趣知道嗎？',
];

/** 固定參考選擇題（附 read-22 文章）— 對標真題 Q2–Q5 */
export const WORKSHEET47_TREES_READING_FIXED_TEMPLATES = [
  {
    id: 'read_fixed_trees_zike_not',
    passageId: 'read-22',
    technique: WORKSHEET_TECHNIQUE_TAGS.NEGATIVE_FACT,
    questionText: '【奇怪的樹】下列哪項不是梓柯樹的特徵？',
    options: [
      '有許多節苞',
      '果實有三至四斤重',
      '有汁液噴出來',
      '節苞上有網眼小孔',
    ],
    correctAnswerIndex: 1,
    hint: '提示：「三至四斤重」是麵包樹果實的特徵，勿與滅火樹混淆。',
    trapProfile: 'vocab',
    source: 'worksheet_ref_47',
  },
  {
    id: 'read_fixed_trees_breadfruit_location',
    passageId: 'read-22',
    technique: WORKSHEET_TECHNIQUE_TAGS.FRUIT_LOCATION,
    questionText: '【奇怪的樹】麵包樹的果實會長在甚麼地方？',
    options: [
      '樹枝和樹幹上',
      '只在樹頂',
      '只在樹幹內部',
      '只在樹葉之間',
    ],
    correctAnswerIndex: 0,
    hint: '提示：文中寫結果季節時，果實可長在樹枝、樹幹及樹根上。',
    trapProfile: 'line_detail',
    source: 'worksheet_ref_47',
  },
  {
    id: 'read_fixed_trees_human_contribution',
    passageId: 'read-22',
    technique: WORKSHEET_TECHNIQUE_TAGS.HUMAN_CONTRIBUTION,
    questionText: '【奇怪的樹】下列哪一項是西穀米樹及麵包樹對人類的貢獻？',
    options: [
      '可供人類食用',
      '為人類製造麵包',
      '提供建築的材料',
      '可以撲滅森林大火',
    ],
    correctAnswerIndex: 0,
    hint: '提示：西穀米可代替大米，麵包樹果實可烤食；勿被「麵包樹」名稱誤導。',
    trapProfile: 'cause',
    source: 'worksheet_ref_47',
  },
  {
    id: 'read_fixed_trees_main_purpose',
    passageId: 'read-22',
    technique: WORKSHEET_TECHNIQUE_TAGS.MAIN_THEME,
    questionText: '【奇怪的樹】下列哪一項是作者寫這篇文章的主要目的？',
    options: [
      '記述作者認識的樹木',
      '描寫樹木的特徵',
      '介紹世界上一些奇怪的樹木',
      '說明樹木不同的生長情況',
    ],
    correctAnswerIndex: 2,
    hint: '提示：全文逐一介紹滅火樹、西穀米樹、麵包樹等奇特植物，目的須概括全篇。',
    trapProfile: 'intent',
    source: 'worksheet_ref_47',
  },
];

/** 動態 OCR 樣版 — 說明文／奇特植物類 */
export const WORKSHEET47_TREES_DYNAMIC_TEMPLATES = [
  {
    id: 'ws47_trees_zike_negative',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.NEGATIVE_FACT,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/梓柯樹|滅火樹/.test(text) || !/節苞/.test(text)) return null;
      const built = structured(
        '果實有三至四斤重',
        ['有許多節苞', '有汁液噴出來', '節苞上有網眼小孔'],
        0,
      );
      return {
        questionText: '下列哪項不是梓柯樹的特徵？',
        ...built,
        hint: '提示：逐項對照各段，找出屬於其他樹木的特徵。',
        trapProfile: 'vocab',
        worksheetRef: 'worksheet_ref_47',
      };
    },
  },
  {
    id: 'ws47_trees_breadfruit_location',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.FRUIT_LOCATION,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/麵包樹/.test(text) || !/樹枝.*樹幹|樹根/.test(text)) return null;
      const built = structured(
        '樹枝和樹幹上',
        ['只在樹頂', '只在樹幹內部', '只在樹葉之間'],
      );
      return {
        questionText: '麵包樹的果實會長在甚麼地方？',
        ...built,
        hint: '提示：找出描述麵包樹結果位置的句子。',
        trapProfile: 'line_detail',
        worksheetRef: 'worksheet_ref_47',
      };
    },
  },
  {
    id: 'ws47_trees_food_contribution',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.HUMAN_CONTRIBUTION,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/西穀米樹/.test(text) || !/麵包樹/.test(text)) return null;
      const built = structured(
        '可供人類食用',
        ['為人類製造麵包', '提供建築的材料', '可以撲滅森林大火'],
      );
      return {
        questionText: '下列哪一項是西穀米樹及麵包樹對人類的貢獻？',
        ...built,
        hint: '提示：兩種樹的果實或澱粉均可作為食糧，勿選名稱字面意思。',
        trapProfile: 'cause',
        worksheetRef: 'worksheet_ref_47',
      };
    },
  },
  {
    id: 'ws47_trees_expository_purpose',
    category: 'main_theme',
    technique: WORKSHEET_TECHNIQUE_TAGS.MAIN_THEME,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/樹|植物/.test(text) || !/稀奇|奇怪|介紹/.test(text)) return null;
      if (!/梓柯|西穀米|麵包樹|滅火樹/.test(text)) return null;
      const built = structured(
        '介紹世界上一些奇怪的樹木',
        [
          '記述作者認識的樹木',
          '描寫樹木的特徵',
          '說明樹木不同的生長情況',
        ],
        0,
      );
      return {
        questionText: '下列哪一項是作者寫這篇文章的主要目的？',
        ...built,
        hint: '提示：說明文若逐一介紹多種事物，目的應能概括全文而非只寫其中一種。',
        trapProfile: 'intent',
        worksheetRef: 'worksheet_ref_47',
      };
    },
  },
];

export const WORKSHEET47_TREES_TEMPLATE_IDS = [
  ...WORKSHEET47_TREES_READING_FIXED_TEMPLATES.map((t) => t.id),
  ...WORKSHEET47_TREES_DYNAMIC_TEMPLATES.map((t) => t.id),
];

/** 參考文章《致梁主任的信》— beasmartc9 書信閱讀真題上文（小炫） */
export const LIANG_LETTER_PASSAGE = [
  '親愛的梁主任：自去年暑假您退休以後，我們都很掛念您。在您的榮休晚會上，您為答謝校長、師生及家長的愛戴，更一展歌喉，這情景我們還歷歷在目。最近，余老師告訴我們關於您的近況。',
  '余老師說您現在經常乘坐飛機到世界各地遊覽。我記得以往您喜歡在課堂上跟我們分享旅遊見聞，帶領我們的思想走出刻板的課本世界。除了世界各地的奇風異俗，還有刺激的玩意，都吸引我們留心聽您講授，對於您所描述的世界美食，我們更聽得「垂涎三尺」呢！',
  '我們送給您的退休禮物，您還有用嗎？希望您走到世界各地，只要帶著我們送給您的「旅遊孖寶」，一定能無往不利。那枝登山手杖是否是個好助手？拿著它走路是不是十分省力呢？我想：它一定能陪伴您輕鬆走過艱辛的旅途。還有那個隨身環保暖包，不論走到多麼寒冷的地區，也能確保您不會著涼。',
  '這個學期快將結束了，我們打算期中試後一同前來探望您，好嗎？順道跟您分享我們的近況，聽聽您最新的旅遊見聞。',
  '祝身體健康！學生小炫上七月二日',
];

/** 固定參考選擇題（附 read-23 文章）— 對標真題 Q2–Q4 */
export const WORKSHEET_LIANG_LETTER_FIXED_TEMPLATES = [
  {
    id: 'read_fixed_liang_para2',
    passageId: 'read-23',
    technique: WORKSHEET_TECHNIQUE_TAGS.LETTER_PARAGRAPH,
    questionText: '【致梁主任的信】信中第二段主要內容是',
    options: [
      '說明梁主任的個性活潑好動。',
      '說明旅遊對梁主任的重要性。',
      '介紹梁主任以前活潑的教學方法。',
      '記述梁主任以前在課堂上講述旅遊的經歷。',
    ],
    correctAnswerIndex: 3,
    hint: '提示：第二段以「我記得以往您喜歡在課堂上……」回憶老師講述旅遊見聞。',
    trapProfile: 'summary',
    source: 'worksheet_ref_liang',
  },
  {
    id: 'read_fixed_liang_character',
    passageId: 'read-23',
    technique: WORKSHEET_TECHNIQUE_TAGS.CHARACTER_TRAIT,
    questionText: '【致梁主任的信】從信的內容可以知道梁主任是一個怎樣的人？',
    options: ['備受愛戴', '勤奮積極', '謙虛有禮', '可敬可畏'],
    correctAnswerIndex: 0,
    hint: '提示：榮休晚會上師生、家長的愛戴，以及學生掛念，都可見其受尊重。',
    trapProfile: 'character',
    source: 'worksheet_ref_liang',
  },
  {
    id: 'read_fixed_liang_travel_gifts',
    passageId: 'read-23',
    technique: WORKSHEET_TECHNIQUE_TAGS.GIFT_DETAIL,
    questionText: '【致梁主任的信】作者送給梁主任的「旅遊孖寶」是什麼？',
    options: [
      '登山手杖和隨身環保暖包',
      '登山手杖和登山背囊',
      '環保暖包和太陽傘',
      '相機和地圖',
    ],
    correctAnswerIndex: 0,
    hint: '提示：第三段逐一介紹「旅遊孖寶」兩件禮物的用途。',
    trapProfile: 'line_detail',
    source: 'worksheet_ref_liang',
  },
  {
    id: 'read_fixed_liang_letter_purpose',
    passageId: 'read-23',
    technique: WORKSHEET_TECHNIQUE_TAGS.EXPRESS_FEELINGS,
    questionText: '【致梁主任的信】作者寫這封信的主要目的是甚麼？',
    options: [
      '表達對退休梁主任的掛念與問候，並相約探望',
      '介紹世界各地的美食與風俗',
      '說明登山手杖的使用方法',
      '通知梁主任期中試的日期',
    ],
    correctAnswerIndex: 0,
    hint: '提示：書信開首掛念、末段相約探望，全文重在問候與關懷。',
    trapProfile: 'intent',
    source: 'worksheet_ref_liang',
  },
];

/** 動態 OCR 樣版 — 書信／致意類 */
export const WORKSHEET_LIANG_LETTER_DYNAMIC_TEMPLATES = [
  {
    id: 'ws_liang_letter_para2',
    category: 'paragraph_logic',
    technique: WORKSHEET_TECHNIQUE_TAGS.LETTER_PARAGRAPH,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/梁主任/.test(text) || !/課堂上.*旅遊|分享旅遊見聞/.test(text)) return null;
      const built = structured(
        '記述梁主任以前在課堂上講述旅遊的經歷。',
        [
          '說明梁主任的個性活潑好動。',
          '說明旅遊對梁主任的重要性。',
          '介紹梁主任以前活潑的教學方法。',
        ],
        0,
      );
      return {
        questionText: '信中第二段主要內容是',
        ...built,
        hint: '提示：歸納該段大意，留意是回憶課堂還是描述現況。',
        trapProfile: 'summary',
        worksheetRef: 'worksheet_ref_liang',
      };
    },
  },
  {
    id: 'ws_liang_character_trait',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.CHARACTER_TRAIT,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/梁主任/.test(text) || !/榮休|退休|愛戴|掛念/.test(text)) return null;
      const built = structured(
        '備受愛戴',
        ['勤奮積極', '謙虛有禮', '可敬可畏'],
      );
      return {
        questionText: '從信的內容可以知道梁主任是一個怎樣的人？',
        ...built,
        hint: '提示：從師生、家長的態度及學生用詞推斷人物受歡迎程度。',
        trapProfile: 'character',
        worksheetRef: 'worksheet_ref_liang',
      };
    },
  },
  {
    id: 'ws_liang_travel_gifts',
    category: 'vocab_inference',
    technique: WORKSHEET_TECHNIQUE_TAGS.GIFT_DETAIL,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/旅遊孖寶/.test(text) || !/登山手杖/.test(text)) return null;
      const built = structured(
        '登山手杖和隨身環保暖包',
        ['登山手杖和登山背囊', '環保暖包和太陽傘', '相機和地圖'],
      );
      return {
        questionText: '作者送給梁主任的「旅遊孖寶」是什麼？',
        ...built,
        hint: '提示：找出文中直接點名的兩件退休禮物。',
        trapProfile: 'line_detail',
        worksheetRef: 'worksheet_ref_liang',
      };
    },
  },
  {
    id: 'ws_liang_letter_purpose',
    category: 'main_theme',
    technique: WORKSHEET_TECHNIQUE_TAGS.EXPRESS_FEELINGS,
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      if (!/梁主任/.test(text) || !/親愛的|掛念|探望/.test(text)) return null;
      const built = structured(
        '表達對退休梁主任的掛念與問候，並相約探望',
        [
          '介紹世界各地的美食與風俗',
          '說明登山手杖的使用方法',
          '通知梁主任期中試的日期',
        ],
      );
      return {
        questionText: '作者寫這封信的主要目的是甚麼？',
        ...built,
        hint: '提示：書信常見目的包括問候、致意、相約；勿只取其中一段細節。',
        trapProfile: 'intent',
        worksheetRef: 'worksheet_ref_liang',
      };
    },
  },
];

export const WORKSHEET_LIANG_LETTER_TEMPLATE_IDS = [
  ...WORKSHEET_LIANG_LETTER_FIXED_TEMPLATES.map((t) => t.id),
  ...WORKSHEET_LIANG_LETTER_DYNAMIC_TEMPLATES.map((t) => t.id),
];

/** 全部試卷參考樣版（固定附文 + 動態 OCR） */
export const WORKSHEET_READING_FIXED_TEMPLATES = [
  ...WORKSHEET43_READING_FIXED_TEMPLATES,
  ...WORKSHEET_DUANWU_READING_FIXED_TEMPLATES,
  ...WORKSHEET_ZHENGPING_READING_FIXED_TEMPLATES,
  ...WORKSHEET47_TREES_READING_FIXED_TEMPLATES,
  ...WORKSHEET_LIANG_LETTER_FIXED_TEMPLATES,
];

export const WORKSHEET_DYNAMIC_TEMPLATES = [
  ...WORKSHEET43_DYNAMIC_TEMPLATES,
  ...WORKSHEET_DUANWU_DYNAMIC_TEMPLATES,
  ...WORKSHEET_ZHENGPING_DYNAMIC_TEMPLATES,
  ...WORKSHEET47_TREES_DYNAMIC_TEMPLATES,
  ...WORKSHEET_LIANG_LETTER_DYNAMIC_TEMPLATES,
];

export const WORKSHEET_TEMPLATE_IDS = [
  ...WORKSHEET43_TEMPLATE_IDS,
  ...WORKSHEET_DUANWU_TEMPLATE_IDS,
  ...WORKSHEET_ZHENGPING_TEMPLATE_IDS,
  ...WORKSHEET47_TREES_TEMPLATE_IDS,
  ...WORKSHEET_LIANG_LETTER_TEMPLATE_IDS,
];
