/**
 * 呈分試閱讀文章語意剖析 — 依 OCR 正文推斷文體、主旨與段意（對標真題）
 */

function pickKeyword(keywords = [], index = 0, fallback = '成長') {
  return keywords[index] ?? fallback;
}

const EXPO_DISTRACTORS = [
  '說明事物的名稱由來',
  '介紹景點的地理位置',
  '鼓勵讀者前往參觀旅遊',
  '記述作者一次普通的見聞',
];

const BIO_DISTRACTORS = [
  '記述人物小時候的生活細節',
  '介紹人物的出生地天氣',
  '說明人物喜歡的運動項目',
  '鼓勵讀者模仿人物的言行',
];

const NOSTALGIA_DISTRACTORS = [
  '展望離開學校以後的生活',
  '介紹校園各項體育設施',
  '說明不能再像以往那樣玩樂',
  '記述一次普通的放學活動',
];

const INSPIRE_DISTRACTORS = [
  '批評社會對殘疾人士的不公',
  '介紹各項田徑比賽規則',
  '說明運動員的訓練食譜',
  '記錄一次普通的體育課',
];

/** @typedef {object} ArticleProfile */
export function inferArticleProfile(ctx = {}) {
  const lines = ctx.lines ?? [];
  const text = lines.join('');
  const kw = ctx.keywords ?? [];
  const lineCount = Math.max(lines.length, 1);

  const profiles = [
    {
      test: /紅樹|濕地|潮汐|鹽腺|皮孔|丹寧|生態|紅樹林|露出的根/,
      genre: 'expository',
      subject: '紅樹林',
      articleFocus: '說明紅樹的特性與對大自然的貢獻',
      focusDistractors: [
        '說明紅樹的名稱由來',
        '說明紅樹在潮間帶的生存困難',
        '鼓勵人們前往濕地公園參觀',
      ],
      authorPurpose: '介紹紅樹林的生態價值，讓讀者認識這種特殊植物',
      purposeDistractors: EXPO_DISTRACTORS,
      difficultyAspect: '紅樹面對的生存困難',
      difficultyPara: Math.min(2, lineCount),
      emotions: ['讚賞大自然的奇妙', '敬佩紅樹的堅韌生命力', '關心環境保護'],
      emotionDistractors: ['不滿濕地公園的設施', '後悔沒有早點參觀'],
      quotePurpose: '借具體事例說明紅樹如何適應惡劣環境',
      paraIdeas: [
        '引出紅樹，提出讀者可能有的疑問',
        '說明紅樹名稱的由來與基本特徵',
        '描述紅樹面對的困難與獨特構造',
        '說明紅樹對環境與生態的貢獻',
        '總結並邀請讀者親身認識紅樹',
      ],
    },
    {
      test: /孔子|儒家|六經|論語|萬世師表|私學|仁|禮/,
      genre: 'biography',
      subject: '孔子',
      articleFocus: '介紹孔子的生平、思想與對中華文化的貢獻',
      focusDistractors: [
        '說明孔廟建築的特色',
        '記述孔子出生日的慶祝活動',
        '介紹孔子喜歡的飲食',
        '鼓勵讀者背誦《論語》全文',
      ],
      authorPurpose: '讓讀者認識孔子的地位與對教育、文化的深遠影響',
      purposeDistractors: BIO_DISTRACTORS,
      difficultyAspect: '孔子對教育的貢獻',
      difficultyPara: Math.min(3, lineCount),
      emotions: ['敬仰孔子的學問與人格', '引以為傲的文化認同'],
      emotionDistractors: ['對古代禮儀感到厭煩', '懷疑儒家思想的價值'],
      quotePurpose: '說明孔子有教無類、重視教育的理念',
      paraIdeas: [
        '交代孔子紀念日的背景，引出人物',
        '介紹孔子的身份與歷史地位',
        '說明孔子整理典籍與創立學說的貢獻',
        '闡述「仁」「禮」思想與辦學精神',
        '說明後人如何紀念與推崇孔子',
      ],
      notContribution: '在世界各地興建孔廟',
      contributionOptions: [
        '把所有重要的典籍進行搜集整理',
        '創立了儒家思想',
        '開創了私學的風氣',
        '在世界各地興建孔廟',
      ],
    },
    {
      test: /母校|畢業|操場|足球|禮堂|校歌|同學|懷念|舊日/,
      genre: 'nostalgic',
      subject: '母校',
      articleFocus: '通過回憶母校生活，抒發對同學與校園的思念',
      focusDistractors: NOSTALGIA_DISTRACTORS,
      authorPurpose: '描述校園活動以表達對母校和同學的思念',
      purposeDistractors: [
        '展望自己離開學校以後的生活',
        '介紹校園各項體育設施',
        '說明不能再像以往那樣開心地踢球',
        '記錄一次普通的放學活動',
      ],
      difficultyAspect: '主角小學時踢足球的經歷',
      difficultyPara: Math.min(2, lineCount),
      emotions: ['懷念母校', '想念舊日與朋友一起玩樂的情景'],
      emotionDistractors: ['不滿自己的球技比不上別人', '後悔因踢球而忽略學業'],
      quotePurpose: '借往事帶出對昔日校園生活的懷念',
      paraIdeas: [
        '交代回母校的原因與整體感受',
        '敘述在操場踢足球的舊日情景',
        '回憶雨天在體育室打乒乓球的經歷',
        '描寫畢業禮上的感動場面',
        '抒發對友誼與時光流逝的感慨',
      ],
    },
    {
      test: /殘疾|義肢|奧運|比賽|刀鋒|跑手|田徑|堅持|挫折/,
      genre: 'inspirational',
      subject: pickKeyword(kw, 0, '主人公'),
      articleFocus: '記述主人公克服身體局限、堅持追夢的經歷',
      focusDistractors: INSPIRE_DISTRACTORS,
      authorPurpose: '透過人物事蹟，鼓勵讀者面對困難時應堅毅不放棄',
      purposeDistractors: [
        '批評社會對殘疾人士的不公',
        '介紹各項田徑比賽規則',
        '說明運動員的訓練食譜',
        '炫耀個人運動成績',
      ],
      difficultyAspect: '主人公面對的挫折與挑戰',
      difficultyPara: Math.min(3, lineCount),
      emotions: ['敬佩主人公的堅毅', '受到鼓舞而充滿希望'],
      emotionDistractors: ['同情主人公的遭遇而悲傷', '認為努力也不會成功'],
      quotePurpose: '指出主人公能豁然面對自己的缺憾，展現積極人生態度',
      paraIdeas: [
        '介紹主人公的特殊經歷與背景',
        '交代失去雙腿或面對困難的原因',
        '描述主人公如何接納自己並愛上運動',
        '記述參賽受阻後堅持上訴與奮鬥的經過',
        '總結主人公帶給讀者的啟示',
      ],
    },
    {
      test: /爺爺|祖母|外公|外婆|生日|蛋糕|驚喜|邀請卡/,
      genre: 'narrative',
      subject: '家人',
      articleFocus: '記述為長輩籌備驚喜的溫馨過程',
      focusDistractors: [
        '說明生日蛋糕的製作方法',
        '介紹邀請卡的設計技巧',
        '描寫美麗的節日裝飾',
        '記錄一次普通的家庭聚餐',
      ],
      authorPurpose: '透過敘述為長輩慶生，表達家人之間的關愛與合作',
      purposeDistractors: EXPO_DISTRACTORS,
      difficultyAspect: '家人分工合作準備驚喜',
      difficultyPara: Math.min(2, lineCount),
      emotions: ['感到興奮期待', '體會家庭溫暖'],
      emotionDistractors: ['感到緊張不安', '對慶祝活動感到厭煩'],
      quotePurpose: '表現家人互相扶持、樂於付出的態度',
      paraIdeas: [
        '交代慶祝的起因與眾人商量的經過',
        '描述各人分工準備的細節',
        '記述慶祝當天的溫馨場面',
        '抒發對親情與分享的體會',
      ],
    },
    {
      test: /校園|温習|呈分|考試|模擬|圖書館|班主任/,
      genre: 'narrative',
      subject: '校園',
      articleFocus: '記述在校園克服學習困難、反省成長的經歷',
      focusDistractors: [
        '介紹校園各項體育設施',
        '說明保護視力的重要性',
        '描寫美麗的校園風景',
        '記錄一次普通的放學活動',
      ],
      authorPurpose: '鼓勵讀者面對挫折時應反省、求助與堅持',
      purposeDistractors: BIO_DISTRACTORS,
      difficultyAspect: '主角面對學習挫折',
      difficultyPara: Math.min(2, lineCount),
      emotions: ['由困惑轉為堅定', '體會堅毅與成長的重要'],
      emotionDistractors: ['感到沮喪而想放棄', '驕傲自滿不願改進'],
      quotePurpose: '帶出面對困難需要耐心與反省的道理',
      paraIdeas: [
        '交代主角遇到的學習困難',
        '描述調整方法與向他人請教',
        '記述努力後看見進步的經過',
        '總結從挫折中學到的態度',
      ],
    },
  ];

  const hit = profiles.find((p) => p.test.test(text));
  if (hit) return { ...hit, lineCount };

  const k1 = pickKeyword(kw, 0, '成長');
  const k2 = pickKeyword(kw, 1, '堅持');
  return {
    genre: 'narrative',
    subject: k1,
    lineCount,
    articleFocus: `全文圍繞與「${k1}」相關的經歷，帶出${k2}的道理`,
    focusDistractors: [
      '只記錄一件無關緊要的插曲',
      '著重描寫優美的自然風景',
      '介紹與本文無關的科學知識',
      '鼓勵讀者購買相關商品',
    ],
    authorPurpose: `透過敘述與「${k1}」相關的經歷，帶出${k2}的啟示`,
    purposeDistractors: NOSTALGIA_DISTRACTORS,
    difficultyAspect: `與「${k1}」相關的主要困難`,
    difficultyPara: Math.min(2, lineCount),
    emotions: ['感到溫暖而有所體會', '受到啟發而充滿希望'],
    emotionDistractors: ['感到無聊而厭煩', '對事件感到憤怒'],
    quotePurpose: `說明人物面對「${k1}」時的態度與想法`,
    paraIdeas: lines.map((_, i) => `交代第${i + 1}段的主要內容`),
  };
}

/** 段意選項（高仿干擾） */
export function buildParagraphIdeaOptions(profile, correct, ctx) {
  const ideas = profile.paraIdeas ?? [];
  const pool = [...new Set([correct, ...ideas, ...profile.focusDistractors ?? []])];
  const shuffled = pool.filter((x) => x && x !== correct);
  while (shuffled.length < 3) {
    shuffled.push(`只描述表面細節，未能概括段意（干擾${shuffled.length}）`);
  }
  return [correct, ...shuffled.slice(0, 3)];
}

/** 段落標籤選項 */
export function paragraphLabelOptions(lineCount) {
  const labels = ['第一段', '第二段', '第三段', '第四段', '第五段', '第六段'];
  return labels.slice(0, Math.min(Math.max(lineCount, 4), 6));
}

export function lineToParagraphIndex(lineIndex, lineCount) {
  if (lineCount <= 4) return lineIndex;
  const seg = Math.ceil(lineCount / 4);
  return Math.min(3, Math.floor(lineIndex / seg));
}
