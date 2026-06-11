/**
 * 小學高年級字詞表 — 校本 OCR 對照詞庫（含字義）
 * 供默書單 / 字詞表 OCR 精準配對，非呈分試 30 題池
 */

export const WORKSHEET_TITLE_PATTERN = /小學高年級字詞表|高年級字詞表|小學.*字詞表/;

/** @type {Record<string, { tc: string, sc: string, en: string }>} */
export const WORKSHEET_VOCAB_HINTS = {
  // ── 字詞表頁 1（雙字詞）──
  廉潔: { tc: '清白守正，不貪污', sc: '清白守正，不贪污', en: 'Honest and upright; incorruptible' },
  輝煌: { tc: '光彩燦爛；成就卓著', sc: '光彩灿烂；成就卓著', en: 'Brilliant; glorious' },
  平凡: { tc: '普通、平常', sc: '普通、平常', en: 'Ordinary; commonplace' },
  烹調: { tc: '煮食、調製菜餚', sc: '煮食、调制菜肴', en: 'To cook and prepare food' },
  遺產: { tc: '前人留下的事物或財產', sc: '前人留下的事物或财产', en: 'Heritage; legacy' },
  精細: { tc: '精密細緻', sc: '精密细致', en: 'Fine and meticulous' },
  菜餚: { tc: '配飯食用的菜色', sc: '配饭食用的菜色', en: 'Dishes served with rice' },
  美觀: { tc: '好看、漂亮', sc: '好看、漂亮', en: 'Beautiful; aesthetically pleasing' },
  講究: { tc: '注重、講求精緻', sc: '注重、讲求精致', en: 'To pay attention to quality; fastidious' },
  祈求: { tc: '懇切請求（多指向神明或上級）', sc: '恳切请求', en: 'To pray or earnestly request' },
  滋味: { tc: '味道；比喻感受或經歷', sc: '味道；比喻感受或经历', en: 'Taste; flavour; figurative experience' },
  記載: { tc: '把事情寫下來留傳', sc: '把事情写下来留传', en: 'To record in writing' },
  汪洋: { tc: '形容水勢浩大廣闊', sc: '形容水势浩大广阔', en: 'Vast (of water)' },
  瞭解: { tc: '知道、明白', sc: '了解、明白', en: 'To understand' },
  了解: { tc: '知道、明白', sc: '了解、明白', en: 'To understand' },
  學識: { tc: '知識與見解', sc: '知识与见解', en: 'Knowledge and learning' },
  預報: { tc: '預先報告（如天氣預報）', sc: '预先报告', en: 'Forecast; to predict in advance' },
  永恆: { tc: '永遠不變', sc: '永远不变', en: 'Eternal; everlasting' },
  沈積: { tc: '沉澱、累積（地理或水中顆粒）', sc: '沉积、累积', en: 'Sedimentation; to deposit' },
  珊瑚: { tc: '海洋中的腔腸動物及其骨骼', sc: '海洋中的腔肠动物及其骨骼', en: 'Coral' },
  蔚藍: { tc: '深藍色（多指天空或大海）', sc: '深蓝色', en: 'Azure; deep blue' },
  招牌: { tc: '商店標示；比喻名聲', sc: '商店标示；比喻名声', en: 'Shop sign; reputation' },
  陰森: { tc: '昏暗陰冷，令人害怕', sc: '昏暗阴冷，令人害怕', en: 'Gloomy and eerie' },
  輕盈: { tc: '輕巧靈活', sc: '轻巧灵活', en: 'Light and graceful' },
  籠罩: { tc: '像籠子一樣覆蓋', sc: '像笼子一样覆盖', en: 'To envelop; shroud' },

  // ── 字詞表頁 2（雙字詞）──
  消散: { tc: '分散消失', sc: '分散消失', en: 'To dissipate; fade away' },
  仿佛: { tc: '好像、似乎', sc: '好像、似乎', en: 'As if; seemingly' },
  彷彿: { tc: '好像、似乎', sc: '好像、似乎', en: 'As if; seemingly' },
  規律: { tc: '事物間必然的、反覆的關係', sc: '规律', en: 'Law; regular pattern' },
  複雜: { tc: '多而雜，不容易理解', sc: '复杂', en: 'Complex; complicated' },
  依靠: { tc: '憑藉、依賴', sc: '依靠', en: 'To rely on; depend on' },
  氣候: { tc: '一定地區長期的天氣狀況', sc: '气候', en: 'Climate' },
  覆蓋: { tc: '遮蓋、蓋住', sc: '覆盖', en: 'To cover; overlay' },
  扭曲: { tc: '扭轉變形；歪曲事實', sc: '扭曲', en: 'To twist; distort' },
  留神: { tc: '小心、注意', sc: '留神', en: 'To be careful; watch out' },
  威脅: { tc: '用威力逼迫、恐嚇', sc: '威胁', en: 'To threaten' },
  研製: { tc: '研究製造', sc: '研制', en: 'To research and develop' },
  依賴: { tc: '依靠、不能離開', sc: '依赖', en: 'To depend on' },
  屢次: { tc: '一次又一次', sc: '屡次', en: 'Repeatedly; time and again' },
  頒發: { tc: '正式發布、授予', sc: '颁发', en: 'To issue; confer officially' },
  獎勵: { tc: '給予榮譽或物質以鼓勵', sc: '奖励', en: 'Reward; incentive' },
  資產: { tc: '財產、資本', sc: '资产', en: 'Assets; property' },
  傳媒: { tc: '傳播訊息的媒介（如報紙、電視）', sc: '传媒', en: 'Media' },
  創建: { tc: '創立、建立', sc: '创建', en: 'To create; establish' },
  義務: { tc: '應盡的責任', sc: '义务', en: 'Duty; obligation' },
  敬慕: { tc: '尊敬仰慕', sc: '敬慕', en: 'To admire and respect' },
  尊嚴: { tc: '尊貴、莊嚴的名譽', sc: '尊严', en: 'Dignity' },
  宗旨: { tc: '主要的目的和意圖', sc: '宗旨', en: 'Purpose; aim' },
  服侍: { tc: '伺候、照顧他人', sc: '服侍', en: 'To serve; attend to' },
  愛戴: { tc: '衷心擁護、愛護', sc: '爱戴', en: 'To love and respect' },

  // ── 字詞表頁 3（雙字詞 · 落後～滋補）──
  落後: { tc: '落在後面；進度比別人慢', sc: '落后', en: 'To fall behind; backward' },
  明確: { tc: '清楚、不含糊', sc: '明确', en: 'Clear; explicit' },
  擅自: { tc: '未經允許而自作主張', sc: '擅自', en: 'Without permission; on one\'s own authority' },
  氣餒: { tc: '因失敗或挫折而失去信心', sc: '气馁', en: 'Discouraged; dejected' },
  勤奮: { tc: '努力用功', sc: '勤奋', en: 'Diligent; hardworking' },
  濃重: { tc: '（顏色、氣味等）又濃又重', sc: '浓重', en: 'Dense; thick; strong' },
  協調: { tc: '互相配合、調和', sc: '协调', en: 'To coordinate; harmonize' },
  感悟: { tc: '因有所觸動而領悟', sc: '感悟', en: 'To feel and comprehend' },
  安詳: { tc: '安詳寧靜（多形容臨終或神態）', sc: '安详', en: 'Peaceful; serene' },
  嘆息: { tc: '因感慨而長聲呼出', sc: '叹息', en: 'To sigh' },
  清理: { tc: '整理、清除', sc: '清理', en: 'To clean up; clear' },
  擦拭: { tc: '用布等擦抹乾淨', sc: '擦拭', en: 'To wipe; rub clean' },
  樹叢: { tc: '樹木聚集生長的地方', sc: '树丛', en: 'Thicket; cluster of trees' },
  使勁: { tc: '用力', sc: '使劲', en: 'To exert force; use strength' },
  故鄉: { tc: '家鄉', sc: '故乡', en: 'Hometown; native place' },
  盛開: { tc: '（花朵）開得很旺盛', sc: '盛开', en: 'In full bloom' },
  無論: { tc: '不管、不論', sc: '无论', en: 'Regardless; no matter' },
  新鮮: { tc: '沒有變質；新奇', sc: '新鲜', en: 'Fresh; novel' },
  趕緊: { tc: '抓緊時間，不加延誤', sc: '赶紧', en: 'Hurry; promptly' },
  適宜: { tc: '合適、相當', sc: '适宜', en: 'Suitable; appropriate' },
  奇異: { tc: '奇怪、特別', sc: '奇异', en: 'Strange; unusual' },
  允許: { tc: '答應、准許', sc: '允许', en: 'To allow; permit' },
  焦黃: { tc: '（顏色）黃而乾枯', sc: '焦黄', en: 'Scorched yellow' },
  滋補: { tc: '用有營養的食物補養身體', sc: '滋补', en: 'Nourishing; tonic' },

  // ── 字詞表頁 5（雙字詞 · 鬱悶～威迫）──
  鬱悶: { tc: '心情不暢、悶悶不樂', sc: '郁闷', en: 'Depressed; gloomy' },
  逍遙: { tc: '悠閒自在、無拘無束', sc: '逍遥', en: 'Carefree; leisurely' },
  拖拽: { tc: '用力拉、拖動', sc: '拖拽', en: 'To drag; pull' },
  擺佈: { tc: '安排、處置', sc: '摆布', en: 'To arrange; manipulate' },
  仰望: { tc: '抬頭向上看', sc: '仰望', en: 'To look up to' },
  單調: { tc: '平淡、缺乏變化', sc: '单调', en: 'Monotonous; dull' },
  暗淡: { tc: '光線微弱；不明亮', sc: '暗淡', en: 'Dim; gloomy' },
  拉扯: { tc: '拉來拉去；牽扯', sc: '拉扯', en: 'To pull back and forth' },
  承受: { tc: '接受並承擔', sc: '承受', en: 'To bear; endure' },
  跟隨: { tc: '跟在後面；隨同', sc: '跟随', en: 'To follow' },
  煩惱: { tc: '心中愁苦、憂慮的事', sc: '烦恼', en: 'Worry; vexation' },
  艷麗: { tc: '鮮豔美麗', sc: '艳丽', en: 'Gorgeous; showy' },
  內疚: { tc: '心中自責、慚愧', sc: '内疚', en: 'Guilt; remorse' },
  沉靜: { tc: '安靜、沉穩', sc: '沉静', en: 'Calm; composed' },
  彷徨: { tc: '猶豫不決、不知去向', sc: '彷徨', en: 'Hesitant; at a loss' },
  處境: { tc: '所處的環境或狀況', sc: '处境', en: 'Situation; circumstances' },
  推薦: { tc: '介紹、舉薦', sc: '推荐', en: 'To recommend' },
  闖禍: { tc: '惹出禍患、闖下大禍', sc: '闯祸', en: 'To cause trouble' },
  倒霉: { tc: '運氣不好、遭遇不幸', sc: '倒霉', en: 'Unlucky; jinxed' },
  珍藏: { tc: '珍重收藏', sc: '珍藏', en: 'To treasure and keep' },
  溶解: { tc: '（固體）化在液體中', sc: '溶解', en: 'To dissolve' },
  驚喜: { tc: '又驚又喜', sc: '惊喜', en: 'Pleasant surprise' },
  利誘: { tc: '用利益引誘', sc: '利诱', en: 'To lure with profit' },
  威迫: { tc: '以威力逼迫', sc: '威迫', en: 'To coerce by threat' },

  // ── 字詞表頁 4（四字成語）──
  汗流浹背: { tc: '汗水流滿背部；形容非常辛勞或緊張', sc: '汗流浃背', en: 'Sweating profusely from hard work or stress' },
  鰥寡孤獨: { tc: '沒有配偶、沒有父母、沒有子女的人', sc: '鳏寡孤独', en: 'The widowed, lonely and childless' },
  彬彬有禮: { tc: '形容文雅有禮貌', sc: '彬彬有礼', en: 'Polite and refined' },
  微不足道: { tc: '非常渺小，不值得一提', sc: '微不足道', en: 'Insignificant; trivial' },
  語重心長: { tc: '言語誠摯，情意深長', sc: '语重心长', en: 'Sincere and heartfelt words of advice' },
  百折不回: { tc: '無論受多少挫折都不退縮', sc: '百折不回', en: 'Unyielding despite repeated setbacks' },
  眾目睽睽: { tc: '在眾人注視之下', sc: '众目睽睽', en: 'Under public scrutiny' },
  形形色色: { tc: '種類繁多，各式各樣', sc: '形形色色', en: 'Of all kinds; diverse' },
  不約而同: { tc: '沒有事先商量而做法相同', sc: '不约而同', en: 'To act in unison without prior agreement' },
  自暴自棄: { tc: '甘心墮落，不求上進', sc: '自暴自弃', en: 'To give up on oneself; self-destructive' },

  // ── 字詞表頁（四字成語 · 第二組）──
  大發雷霆: { tc: '形容大發脾氣，聲勢猛烈', sc: '大发雷霆', en: 'To fly into a thunderous rage' },
  風吹雨打: { tc: '比喻遭受恶劣環境的侵襲或折磨', sc: '风吹雨打', en: 'To endure wind and rain; hardship' },
  憤憤不平: { tc: '心中不服，感到憤怒', sc: '愤愤不平', en: 'Indignant and resentful' },
  目不暇接: { tc: '形容事物太多，來不及看', sc: '目不暇接', en: 'Too much to take in at once' },
  波瀾壯闊: { tc: '比喻聲勢浩大或規模宏偉', sc: '波澜壮阔', en: 'Magnificent and sweeping' },
  不知不覺: { tc: '沒有察覺到', sc: '不知不觉', en: 'Unconsciously; without noticing' },
  奔流不息: { tc: '形容水流不斷，也比喻連續不斷', sc: '奔流不息', en: 'Flowing ceaselessly' },
  永無止境: { tc: '永遠沒有盡頭', sc: '永无止境', en: 'Endless; without limit' },
  星羅棋佈: { tc: '像星星和棋子一樣散布，形容數量多而廣', sc: '星罗棋布', en: 'Scattered like stars and chess pieces' },
  星羅棋布: { tc: '像星星和棋子一樣散布，形容數量多而廣', sc: '星罗棋布', en: 'Scattered like stars and chess pieces' },
  興致勃勃: { tc: '形容興致很高，情緒旺盛', sc: '兴致勃勃', en: 'In high spirits; enthusiastic' },
  連綿不斷: { tc: '連續不斷，沒有間斷', sc: '连绵不断', en: 'Continuous and unbroken' },
  夜以繼日: { tc: '日夜不停地做某事', sc: '夜以继日', en: 'Day and night without stop' },
};

/** 四字成語錨點 — 判斷該頁應以 4 字切分 */
export const WORKSHEET_IDIOM_ANCHORS = [
  '汗流浹背', '鰥寡孤獨', '彬彬有禮', '微不足道', '語重心長',
  '百折不回', '百折不撓', '眾目睽睽', '形形色色', '不約而同',
  '恍然大悟', '自暴自棄',
  '大發雷霆', '風吹雨打', '憤憤不平', '目不暇接', '波瀾壯闊', '不知不覺',
  '奔流不息', '永無止境', '星羅棋佈', '興致勃勃', '連綿不斷', '夜以繼日',
];

export const ALL_WORKSHEET_WORDS = new Set([
  ...Object.keys(WORKSHEET_VOCAB_HINTS),
  ...WORKSHEET_IDIOM_ANCHORS,
  '了解',
]);

/** 各頁詞表 — OCR 偵測頁面後只提取該頁詞彙（避免跨頁誤配） */
/** 雙字詞拼音 → 詞語（OCR 拼音行配對，無聲調） */
export const WORKSHEET_PINYIN_PAIRS = {
  lianjie: '廉潔', huihuang: '輝煌', pingfan: '平凡', pengtiao: '烹調',
  yichan: '遺產', jingxi: '精細', caiyao: '菜餚', meiguan: '美觀',
  jiangjiu: '講究', qiqiu: '祈求', ziwei: '滋味', jizai: '記載',
  wangyang: '汪洋', liaojie: '瞭解', liojie: '了解', xueshi: '學識',
  luohou: '落後', mingque: '明確', shanzi: '擅自', qinei: '氣餒',
  qinfen: '勤奮', nongzhong: '濃重', xietiao: '協調', ganwu: '感悟',
  anxiang: '安詳', tanxi: '嘆息', qingli: '清理', cashi: '擦拭',
  shucong: '樹叢', shijin: '使勁', guxiang: '故鄉', shengkai: '盛開',
  wulun: '無論', xinxian: '新鮮', ganjin: '趕緊', shiyi: '適宜',
  qiyi: '奇異', yunxu: '允許', jiaohuang: '焦黃', zibu: '滋補',
  yumen: '鬱悶', xiaoyao: '逍遙', tuozhuai: '拖拽', baibu: '擺佈',
  yangwang: '仰望', dandiao: '單調', andan: '暗淡', lache: '拉扯',
  chengshou: '承受', gensui: '跟隨', fannao: '煩惱', yanli: '艷麗',
  neijiu: '內疚', chenjing: '沉靜', panghuang: '彷徨', chujing: '處境',
  tuijian: '推薦', chuanghuo: '闖禍', daomei: '倒霉', zhencang: '珍藏',
  rongjie: '溶解', liyou: '利誘', weipo: '威迫',
};

/** 同音拼音組合 — 依鎖定詞表頁 disambiguate（如 jingxi → 精細 / 驚喜） */
export const WORKSHEET_PINYIN_COLLISIONS = {
  jingxi: ['精細', '驚喜'],
};

export const WORKSHEET_PAGES = [
  {
    id: 'page1',
    anchors: ['廉潔', '輝煌', '平凡', '烹調', '遺產', '精細'],
    words: [
      '廉潔', '輝煌', '平凡', '烹調', '遺產', '精細', '菜餚', '美觀',
      '講究', '祈求', '滋味', '記載', '汪洋', '瞭解', '了解', '學識',
      '預報', '永恆', '沈積', '珊瑚', '蔚藍', '招牌', '陰森', '輕盈', '籠罩',
    ],
  },
  {
    id: 'page2',
    anchors: ['消散', '仿佛', '規律', '複雜', '依靠', '氣候'],
    words: [
      '消散', '仿佛', '彷彿', '規律', '複雜', '依靠', '氣候', '覆蓋',
      '扭曲', '留神', '威脅', '研製', '依賴', '屢次', '頒發', '獎勵',
      '資產', '傳媒', '創建', '義務', '敬慕', '尊嚴', '宗旨', '服侍', '愛戴',
    ],
  },
  {
    id: 'page3',
    anchors: ['落後', '明確', '擅自', '氣餒', '勤奮', '濃重'],
    words: [
      '落後', '明確', '擅自', '氣餒', '勤奮', '濃重', '協調', '感悟',
      '安詳', '嘆息', '清理', '擦拭', '樹叢', '使勁', '故鄉', '盛開',
      '無論', '新鮮', '趕緊', '適宜', '奇異', '允許', '焦黃', '滋補',
    ],
  },
  {
    id: 'idioms1',
    anchors: ['汗流浹背', '鰥寡孤獨', '恍然大悟', '百折不回'],
    words: [
      '汗流浹背', '鰥寡孤獨', '彬彬有禮', '微不足道', '語重心長', '百折不回',
      '百折不撓', '眾目睽睽', '形形色色', '不約而同', '恍然大悟', '自暴自棄',
    ],
  },
  {
    id: 'idioms2',
    anchors: ['大發雷霆', '風吹雨打', '目不暇接', '星羅棋佈'],
    words: [
      '大發雷霆', '風吹雨打', '憤憤不平', '目不暇接', '波瀾壯闊', '不知不覺',
      '奔流不息', '永無止境', '星羅棋佈', '星羅棋布', '興致勃勃', '連綿不斷', '夜以繼日',
    ],
  },
  {
    id: 'page5',
    anchors: ['鬱悶', '逍遙', '拖拽', '擺佈', '仰望', '單調'],
    words: [
      '鬱悶', '逍遙', '拖拽', '擺佈', '仰望', '單調', '暗淡', '拉扯',
      '承受', '跟隨', '煩惱', '艷麗', '內疚', '沉靜', '彷徨', '處境',
      '推薦', '闖禍', '倒霉', '珍藏', '溶解', '驚喜', '利誘', '威迫',
    ],
  },
];

/** 字詞表頁面順序 — 供 OCR 子串掃描（OCR 順序錯亂時仍能找回校本詞） */
export const WORKSHEET_ORDERED_WORDS = [
  '廉潔', '輝煌', '平凡', '烹調', '遺產', '精細', '菜餚', '美觀',
  '講究', '祈求', '滋味', '記載', '汪洋', '瞭解', '了解', '學識',
  '預報', '永恆', '沈積', '珊瑚', '蔚藍', '招牌', '陰森', '輕盈', '籠罩',
  '消散', '仿佛', '彷彿', '規律', '複雜', '依靠', '氣候', '覆蓋',
  '扭曲', '留神', '威脅', '研製', '依賴', '屢次', '頒發', '獎勵',
  '資產', '傳媒', '創建', '義務', '敬慕', '尊嚴', '宗旨', '服侍', '愛戴',
  '落後', '明確', '擅自', '氣餒', '勤奮', '濃重', '協調', '感悟',
  '安詳', '嘆息', '清理', '擦拭', '樹叢', '使勁', '故鄉', '盛開',
  '無論', '新鮮', '趕緊', '適宜', '奇異', '允許', '焦黃', '滋補',
  '鬱悶', '逍遙', '拖拽', '擺佈', '仰望', '單調', '暗淡', '拉扯',
  '承受', '跟隨', '煩惱', '艷麗', '內疚', '沉靜', '彷徨', '處境',
  '推薦', '闖禍', '倒霉', '珍藏', '溶解', '驚喜', '利誘', '威迫',
  '汗流浹背', '鰥寡孤獨', '彬彬有禮', '微不足道', '語重心長', '百折不回',
  '百折不撓', '眾目睽睽', '形形色色', '不約而同', '恍然大悟', '自暴自棄',
  '大發雷霆', '風吹雨打', '憤憤不平', '目不暇接', '波瀾壯闊', '不知不覺',
  '奔流不息', '永無止境', '星羅棋佈', '星羅棋布', '興致勃勃', '連綿不斷', '夜以繼日',
];
