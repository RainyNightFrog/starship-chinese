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
      test: /米飯|稻米|稻穀|穀物|澱粉|糯米|粳米|糙米|白米|誰知盤中飧/,
      genre: 'expository',
      subject: '米',
      articleFocus: '介紹「米」的種類、加工方式及多元用途，並呼籲珍惜食糧',
      focusDistractors: [
        '記述作者一次做蛋糕的經歷',
        '描寫校園運動會的熱鬧場面',
        '介紹香港各區的旅遊景點',
        '說明如何準備呈分試溫習計劃',
      ],
      authorPurpose: '讓讀者認識米的特性與用途，並體會珍惜食糧的重要',
      purposeDistractors: [
        '鼓勵讀者到濕地公園參觀',
        '記述主角與爺爺的生日會',
        '批評現代人浪費金錢',
        '介紹書法比賽規則',
      ],
      difficultyAspect: '米的加工方式與種類',
      difficultyPara: Math.min(3, lineCount),
      emotions: ['讚賞米的用途廣泛', '體會「粒粒皆辛苦」而珍惜食糧'],
      emotionDistractors: ['對米價上漲感到憤怒', '覺得文章枯燥乏味'],
      quotePurpose: '借古詩強調珍惜食糧、勿浪費',
      paraIdeas: [
        '以香港飲食文化引入，提出「你對米有多少認識」',
        '說明「米」的定義及典籍中不同穀物的用法',
        '按黏性把米分為日常米、粳米、糯米等',
        '說明白米、糙米及各式加工米的分別',
        '列舉以米製成的麵食、糕點與節日食品',
        '以「粒粒皆辛苦」作結，呼籲珍惜食糧',
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
  const inferredParaIdeas = lines.map((line, i) => inferLineParaIdea(line, i, { subject: k1 }, lines));
  return {
    genre: 'narrative',
    subject: k1,
    lineCount,
    articleFocus: `全文圍繞與「${k1}」相關的經歷，帶出${k2}的道理`,
    focusDistractors: [
      `詳述與「${k1}」無直接關係的次要情節`,
      `著重描寫環境，但未能帶出${k2}的啟示`,
      `只記錄表面活動，缺乏對人物內心的刻劃`,
      `把結尾的感悟誤當成開首段的內容`,
    ],
    authorPurpose: `透過敘述與「${k1}」相關的經歷，帶出${k2}的啟示`,
    purposeDistractors: [
      `介紹與本文無關的科普知識`,
      `記錄一次與「${k1}」無關的日常見聞`,
      `呼籲讀者購買相關商品或服務`,
      `批評社會現象，但文中並未提及`,
    ],
    difficultyAspect: `與「${k1}」相關的主要困難`,
    difficultyPara: Math.min(2, lineCount),
    emotions: ['感到溫暖而有所體會', '受到啟發而充滿希望'],
    emotionDistractors: ['感到無聊而厭煩', '對事件感到憤怒'],
    quotePurpose: `說明人物面對「${k1}」時的態度與想法`,
    paraIdeas: inferredParaIdeas,
  };
}

/** 段意選項（高仿干擾 — 優先同文其他段大意，呈分試陷阱感） */
export function buildParagraphIdeaOptions(profile, correct, ctx, paraIndex = null) {
  const randInt = ctx?.randInt ?? ((n) => Math.floor(Math.random() * n));
  const ideas = (profile.paraIdeas ?? []).filter(Boolean);
  const lines = ctx?.lines ?? [];

  let otherIdeas = ideas.filter((idea) => idea !== correct);

  if (paraIndex != null) {
    const adjacency = [
      ideas[paraIndex + 1],
      ideas[paraIndex + 2],
      ideas[paraIndex - 1],
      ...otherIdeas,
    ].filter((idea) => idea && idea !== correct);
    otherIdeas = [...new Set(adjacency)];
  }

  if (otherIdeas.length < 3 && lines.length) {
    lines.forEach((line, i) => {
      if (paraIndex != null && i === paraIndex) return;
      const inferred = inferLineParaIdea(line, i, profile, lines);
      if (inferred && inferred !== correct) otherIdeas.push(inferred);
    });
    otherIdeas = [...new Set(otherIdeas.filter((idea) => idea !== correct))];
  }

  const thematic = [
    ...(profile.focusDistractors ?? []),
    ...(profile.purposeDistractors ?? []),
    profile.articleFocus,
    profile.authorPurpose,
  ].filter((d) => d && d !== correct);

  const combined = fisherYatesShuffle([...otherIdeas, ...thematic], randInt);

  const distractors = [];
  const seen = new Set([correct]);

  fisherYatesShuffle(otherIdeas, randInt).forEach((item) => {
    if (distractors.length >= 3) return;
    if (!item || seen.has(item)) return;
    distractors.push(item);
    seen.add(item);
  });

  if (distractors.length < 3) {
    combined.forEach((item) => {
      if (distractors.length >= 3) return;
      if (!item || seen.has(item)) return;
      distractors.push(item);
      seen.add(item);
    });
  }

  const structureTraps = [
    '概括全文主旨，總結作者的中心思想',
    '詳述人物後期的成就與深遠影響',
    '以具體事例論證觀點，層層深化論述',
    '描寫環境氣氛，為後文情節發展作鋪墊',
  ].filter((t) => t !== correct && !seen.has(t));

  fisherYatesShuffle(structureTraps, randInt).forEach((item) => {
    if (distractors.length >= 3) return;
    if (seen.has(item)) return;
    distractors.push(item);
    seen.add(item);
  });

  return [correct, ...distractors.slice(0, 3)];
}

function fisherYatesShuffle(array, randInt) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 依段序取得段意（種子 profile 或正文推斷） */
export function inferParagraphIdeaAtIndex(profile, ctx, paraIndex = 0) {
  const lines = ctx?.lines ?? [];
  const ideas = profile.paraIdeas ?? [];
  if (ideas[paraIndex]) return ideas[paraIndex];
  return inferLineParaIdea(lines[paraIndex] ?? lines[0] ?? '', paraIndex, profile, lines);
}

function inferLineParaIdea(line, index, profile, allLines) {
  const text = String(line ?? '').trim();
  const subject = profile?.subject ?? '主人公';
  const fullText = (allLines ?? []).join('');

  if (index === 0) {
    if (/誕辰|紀念|節日|每年.*舉行|這一天/.test(text)) {
      const who = /孔子/.test(fullText) ? '孔子' : subject;
      return `交代${who}紀念活動或節日的背景，引出人物`;
    }
    if (/相傳|據說|從前|有一天|某年/.test(text)) return '以時間或情境開場，交代背景並引出後文';
    if (/是.*(代表|創始|創立|被譽|被稱)|是一位|身為/.test(text)) {
      return `介紹${subject}的身份、地位或整體概況`;
    }
    if (/我.*(回到|重返|來到)|再次/.test(text)) return '交代重返某地的緣由，奠定全篇基調';
  }

  if (/思想|學說|理念|「仁」|「禮」|教育/.test(text)) {
    return `闡述${subject}的思想主張或教育理念`;
  }
  if (/貢獻|影響|地位|創立|整理|編訂|六經|儒家/.test(text)) {
    return `說明${subject}的成就與對後世的貢獻`;
  }
  if (/雖然|但是|然而|卻|而/.test(text)) {
    return `透過轉折，呈現${subject}處境或心態的變化`;
  }
  if (/感到|十分|非常|懷念|思念|敬佩|讚賞/.test(text)) {
    return '抒發人物或作者的情感與感受';
  }
  if (/因此|所以|由此|可見|總之|總括/.test(text)) {
    return '歸納前文，帶出道理或啟示';
  }

  const snippet = text.replace(/[，。！？；、]/g, '').slice(0, 12);
  if (snippet.length >= 6) return `敘述與「${snippet}」相關的內容`;
  return `概括第${index + 1}段的主要內容`;
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
