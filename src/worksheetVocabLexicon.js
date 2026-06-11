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

  // ── 字詞表頁 3（四字成語）──
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
};

/** 四字成語錨點 — 判斷該頁應以 4 字切分 */
export const WORKSHEET_IDIOM_ANCHORS = [
  '汗流浹背', '鰥寡孤獨', '彬彬有禮', '微不足道', '語重心長',
  '百折不回', '百折不撓', '眾目睽睽', '形形色色', '不約而同',
  '恍然大悟', '自暴自棄',
];

export const ALL_WORKSHEET_WORDS = new Set([
  ...Object.keys(WORKSHEET_VOCAB_HINTS),
  ...WORKSHEET_IDIOM_ANCHORS,
  '了解',
]);

/** 字詞表頁面順序 — 供 OCR 子串掃描（OCR 順序錯亂時仍能找回校本詞） */
export const WORKSHEET_ORDERED_WORDS = [
  '廉潔', '輝煌', '平凡', '烹調', '遺產', '精細', '菜餚', '美觀',
  '講究', '祈求', '滋味', '記載', '汪洋', '瞭解', '了解', '學識',
  '預報', '永恆', '沈積', '珊瑚', '蔚藍', '招牌', '陰森', '輕盈', '籠罩',
  '消散', '仿佛', '彷彿', '規律', '複雜', '依靠', '氣候', '覆蓋',
  '扭曲', '留神', '威脅', '研製', '依賴', '屢次', '頒發', '獎勵',
  '資產', '傳媒', '創建', '義務', '敬慕', '尊嚴', '宗旨', '服侍', '愛戴',
  '汗流浹背', '鰥寡孤獨', '彬彬有禮', '微不足道', '語重心長', '百折不回',
  '百折不撓', '眾目睽睽', '形形色色', '不約而同', '恍然大悟', '自暴自棄',
];
