/**
 * 試卷 AI 解析與孿生類似題程序化生成引擎
 * ─────────────────────────────────────────────
 * 模擬 OCR 後的弱項診斷，批量生成呈分試級別的校本克隆題。
 */

import { getUploadImageCount, mergeUploadImagesIntoContent } from './uploadMetaUtils';
import { ingestFromExamPatterns, generateContributorLabel } from './mockDatabase';

/** AI 解析動畫步驟（約 3 秒，由 UI 定時播放） */
export const EXAM_PARSE_STEPS = [
  { text: '正在辨識考卷版面...', progress: 12 },
  { text: 'OCR 擷取試題文字區塊...', progress: 28 },
  { text: '偵測到名校考點：「形近錯別字辨析」', progress: 45 },
  { text: '偵測到呈分試高頻：成語填空 × 3', progress: 58 },
  { text: '正在鎖定弱項：「句子結構與語序障礙」', progress: 72 },
  { text: '比對歷屆評估報告數據庫...', progress: 85 },
  { text: '正在批量生成孿生類似題...', progress: 96 },
  { text: '✅ 解析完成，同步至學生端', progress: 100 },
];

/** 呈分試常考成語／詞語模板 — 含形近字扣分陷阱 */
const IDIOM_PATTERNS = [
  {
    idiom: '恍然大悟',
    keyword: '悟',
    traps: ['語', '物', '誤'],
    hint: '突然徹底明白、頓悟（注意「語」形近陷阱）',
    hintEn: 'Sudden realization — use 悟 not 語',
    py: 'huǎng rán dà wù',
    jp: 'fong2 jin4 daai6 ng6',
    contexts: [
      '聽完解說後，我終於恍然大____，明白這道難題的關鍵。',
      '讀到結局那一刻，我才恍然大____，原來作者早有伏筆。',
      '經過反覆溫習，我對這個成語用法恍然大____。',
    ],
  },
  {
    idiom: '並肩作戰',
    keyword: '並肩作戰',
    traps: ['並肩作战', '並肩作战', '并肩作戰'],
    hint: '肩膀靠著肩膀，團結一致共同戰鬥',
    hintEn: 'Fight shoulder to shoulder',
    py: 'bìng jiān zuò zhàn',
    jp: 'bing3 gin1 zok3 zin3',
    sspaContexts: [
      '面對颱風，全港市民________，齊心守護家園。',
      '球隊成員________，終於在決賽中反勝對手。',
    ],
    isFullWord: true,
  },
  {
    idiom: '中流砥柱',
    keyword: '中流砥柱',
    traps: ['中劉砥柱', '中流抵柱', '中流礎柱'],
    hint: '比喻堅強獨立、能起支柱作用的人或力量',
    hintEn: 'Pillar of strength in crisis',
    py: 'zhōng liú dǐ zhù',
    jp: 'zung1 lau4 dai2 zyu3',
    sspaContexts: [
      '在動盪年代，他成為社區的________，安定人心。',
      '這位科學家被譽為研究團隊的________。',
    ],
    isFullWord: true,
  },
  {
    idiom: '扣人心弦',
    keyword: '扣人心弦',
    traps: ['扣人心旋', '扣人弦心', '扣心人弦'],
    hint: '形容詩文、表演等十分動人',
    hintEn: 'Deeply moving',
    py: 'kòu rén xīn xián',
    jp: 'kau3 jan4 sam1 jin4',
    sspaContexts: [
      '這齣話劇情節________，觀眾無不動容。',
      '她的朗誦聲線________，全場鴉雀無聲。',
    ],
    isFullWord: true,
  },
  {
    idiom: '不寒而慄',
    keyword: '慄',
    traps: ['栗', '慄', '懍'],
    hint: '沒有寒冷卻發抖，形容非常恐懼（「慄」字寫法）',
    hintEn: 'Shiver with fear — note 慄',
    py: 'bù hán ér lì',
    jp: 'bat1 hon4 ji4 leot6',
    contexts: [
      '聽到那驚悚的故事，我不寒而____，渾身發抖。',
      '深夜獨行暗巷，我不禁不寒而____。',
    ],
  },
  {
    idiom: '百折不撓',
    keyword: '撓',
    traps: ['惱', '擾', '橈'],
    hint: '比喻意志堅強，不受挫折（「撓」非「惱」）',
    hintEn: 'Persevering — 撓 not 惱',
    py: 'bǎi zhé bù náo',
    jp: 'baak3 zit3 bat1 naau4',
    contexts: [
      '他面對挫折百折不____，從不放棄。',
    ],
    sspaContexts: [
      '這位運動員________，終於在呈分試創下佳績。',
    ],
  },
];

const SENTENCE_VARIANTS = [
  {
    words: ['努力學習', '老師', '我們', '常常', '啟發'],
    correctOrder: ['老師', '啟發', '常常', '我們', '努力學習'],
    hint: '主語 → 動詞 → 副詞 → 對象 → 動作',
  },
  {
    words: ['每天', '為了', '同學們', '呈分試', '認真', '溫習'],
    correctOrder: ['為了', '呈分試', '同學們', '每天', '認真', '溫習'],
    hint: '「為了…」短語通常放句首',
  },
  {
    words: ['團結', '只要', '一致', '我們', '就', '能', '克服', '困難'],
    correctOrder: ['只要', '我們', '團結', '一致', '就', '能', '克服', '困難'],
    hint: '「只要…就…」關聯句式',
  },
];

const DISTRACTOR_IDIOMS = [
  { word: '不知不覺', py: 'bù zhī bù jué' },
  { word: '惟利是圖', py: 'wéi lì shì tú' },
  { word: '曇花一現', py: 'tán huā yī xiàn' },
  { word: '紙上談兵', py: 'zhǐ shàng tán bīng' },
  { word: '馬馬虎虎', py: 'mǎ mǎ hǔ hǔ' },
  { word: '半途而廢', py: 'bàn tú ér fèi' },
  { word: '一窍不通', py: 'yī qiào bù tōng' },
  { word: '糊裡糊塗', py: 'hú lǐ hú tú' },
];

function shuffleArray(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN(arr, n, seed) {
  return shuffleArray(arr, seed).slice(0, n);
}

/** 生成形近字單元測驗題（填空選項） */
function buildCharQuizVariant(pattern, context, index, seed) {
  const keys = ['A', 'B', 'C', 'D'];
  const correct = pattern.isFullWord ? pattern.keyword : pattern.keyword;
  const trapPool = pattern.isFullWord
    ? pattern.traps
    : [...pattern.traps, correct].filter((c, i, a) => a.indexOf(c) === i);

  const optionsRaw = pickN(
    [...new Set([correct, ...trapPool])],
    4,
    seed + index,
  );
  while (optionsRaw.length < 4) {
    optionsRaw.push(['物', '務', '誤', '語'][optionsRaw.length]);
  }

  const shuffled = shuffleArray(optionsRaw, seed + index * 7);
  const correctKey = keys[shuffled.indexOf(correct)] ?? 'A';

  const options = shuffled.map((word, i) => ({
    key: keys[i],
    word,
    detail: word === correct
      ? `答對了！${pattern.idiom} — ${pattern.hint}`
      : `「${word}」為形近干擾，請再想想。`,
  }));

  return {
    id: `ai-quiz-${seed}-${index}`,
    isAiGenerated: true,
    sourceIdiom: pattern.idiom,
    text: context,
    hint: pattern.hint,
    hintEn: pattern.hintEn,
    aiHint: pattern.hint,
    options,
    correctKey,
    explanation: `本題克隆「${pattern.idiom}」考點。${pattern.hint}`,
    py: pattern.py,
    jp: pattern.jp,
  };
}

/** 生成呈分試成語填空題 */
function buildSspaVariant(pattern, context, index, seed) {
  const correct = pattern.idiom;
  const distractors = pickN(
    DISTRACTOR_IDIOMS.filter((d) => d.word !== correct),
    3,
    seed + index * 3,
  ).map((d) => d.word);

  const allOptions = shuffleArray([correct, ...distractors], seed + index);
  const correctIndex = allOptions.indexOf(correct);

  return {
    id: `ai-sspa-${seed}-${index}`,
    isAiGenerated: true,
    sourceIdiom: pattern.idiom,
    text: context,
    hint: pattern.hint,
    hintEn: pattern.hintEn,
    options: allOptions,
    optionsPinyin: allOptions.map((opt) => {
      if (opt === correct) return pattern.py;
      const found = DISTRACTOR_IDIOMS.find((d) => d.word === opt);
      return found?.py ?? '';
    }),
    correctIndex,
    explanation: `${correct}：${pattern.hint}`,
    py: pattern.py,
    jp: pattern.jp,
  };
}

/**
 * 程序化批量生成孿生類似題（依上載圖片數量擴充）
 * @param {{ seed?: number, fileName?: string, fileCount?: number, files?: Array }} meta
 */
export function generateExamVariantPack(meta = {}) {
  const seed = meta.seed ?? Date.now();
  const imageCount = getUploadImageCount(meta);
  const targetQuiz = Math.min(5 + imageCount * 2, 36);
  const targetSspa = Math.min(3 + imageCount * 2, 18);
  const quizBank = [];
  const sspaBank = [];

  IDIOM_PATTERNS.forEach((pattern, pi) => {
    if (pattern.contexts?.length) {
      pattern.contexts.forEach((ctx, ci) => {
        if (quizBank.length >= targetQuiz) return;
        quizBank.push(buildCharQuizVariant(pattern, ctx, pi * 10 + ci, seed + ci));
      });
    }
    if (pattern.sspaContexts?.length) {
      pattern.sspaContexts.forEach((ctx, ci) => {
        if (sspaBank.length >= targetSspa) return;
        sspaBank.push(buildSspaVariant(pattern, ctx, pi * 10 + ci, seed + ci));
      });
    }
  });

  let guard = 0;
  while (quizBank.length < targetQuiz && guard < 50) {
    const p = IDIOM_PATTERNS[quizBank.length % IDIOM_PATTERNS.length];
    const ctx = p.contexts?.[quizBank.length % (p.contexts?.length || 1)]
      ?? `我對這個成語用法終於明白了。（${p.idiom}）`;
    quizBank.push(buildCharQuizVariant(p, ctx, 900 + quizBank.length, seed + guard));
    guard += 1;
  }

  guard = 0;
  while (sspaBank.length < targetSspa && guard < 30) {
    const p = IDIOM_PATTERNS[sspaBank.length % IDIOM_PATTERNS.length];
    const ctx = p.sspaContexts?.[0] ?? `我們________，齊心完成呈分試。（${p.idiom}）`;
    sspaBank.push(buildSspaVariant(p, ctx, 800 + sspaBank.length, seed + guard));
    guard += 1;
  }

  const sentenceBank = Array.from({ length: imageCount }, (_, i) => {
    const sentTpl = SENTENCE_VARIANTS[(seed + i) % SENTENCE_VARIANTS.length];
    return {
      id: `ai-sentence-${seed}-${i}`,
      isAiGenerated: true,
      words: [...sentTpl.words],
      correctOrder: [...sentTpl.correctOrder],
      hint: sentTpl.hint,
      aiHint: sentTpl.hint,
      explanation: `正確語序：${sentTpl.correctOrder.join(' / ')}`,
    };
  });

  const sentence = sentenceBank[0];

  return {
    quizBank: shuffleArray(quizBank, seed),
    sspaBank: shuffleArray(sspaBank, seed),
    sentenceBank,
    sentence,
    seed,
    imageCount,
    generatedAt: new Date().toISOString(),
    fileName: meta.fileName ?? null,
    source: meta.source ?? 'upload',
  };
}

/** 依上載檔案建立 AI 分析報告（含上載元數據） */
export function buildExamAnalysisFromUpload(meta = {}) {
  const imageCount = getUploadImageCount(meta);
  const quizCount = Math.min(5 + imageCount * 2, 36);
  const sspaCount = Math.min(3 + imageCount * 2, 18);
  return {
    analyzedAt: new Date().toISOString(),
    weakAreas: ['形近錯別字（悟/語）', '句子結構紊亂', '成語填空'],
    weakAreasEn: ['Similar-character errors (悟 vs 語)', 'Disordered sentence structure', 'Idiom fill-in'],
    parentAdviceZh:
      `本次上載 ${imageCount} 張試卷/圖片：①「恍然大悟」等成語形近字混淆；②重組句子語序錯誤。AI 已生成 ${quizCount} 道測驗 + ${sspaCount} 道呈分試類似題，建議本週完成後再進行默書鞏固。`,
    parentAdviceEn:
      'Uploaded paper shows character confusion and word-order errors. Complete AI variant questions this week.',
    scaffoldHint:
      '「悟」意思是心裡明白、頓悟；「語」意思是說話、語言。恍然大悟 = 突然完全明白，所以用「悟」不用「語」。',
    scaffoldHintEn: '悟 = understand; 語 = speech. 恍然大悟 uses 悟, not 語.',
    uploadMeta: {
      fileName: meta.fileName ?? '校本試卷',
      fileCount: imageCount,
      source: meta.source ?? 'file',
      mimeType: meta.mimeType ?? null,
      capturedAt: meta.capturedAt ?? null,
    },
    detectedTopics: ['形近錯別字辨析', '成語填空', '句子語序重組'],
    variantCount: { quiz: quizCount, sspa: sspaCount, sentence: imageCount },
    weeklyReport: {
      titleZh: '張小明 · 小六呈分試 AI 週報',
      titleEn: 'Cheung Siu-ming · P6 SSPA AI Weekly Report',
      sections: [
        {
          headingZh: '📊 本次錯題歸因分析',
          headingEn: 'Error Attribution Analysis',
          bodyZh: '① 字形辨析：恍然大悟常誤寫「語」。② 語序：副詞位置顛倒。③ 成語填空：並肩作戰、中流砥柱等需加強。',
          bodyEn: 'Character confusion, word order, idiom fill-in weaknesses detected.',
        },
        {
          headingZh: '🎯 本週特訓方向',
          headingEn: "This Week's Focus",
          bodyZh: '完成 AI 孿生類似題（單元測驗 + 呈分試 + 重組句子），再進行校本默書。',
          bodyEn: 'Complete AI variant quiz, SSPA, and sentence tasks.',
        },
        {
          headingZh: '💡 家長行動建議',
          headingEn: 'Parent Action Items',
          bodyZh: '① 使用 App 護盾提示引導再試。② 答對後給予金幣獎勵。③ 週末可切換 NCS 對照英文。',
          bodyEn: 'Use shield hints, reward coins, try NCS mode on weekends.',
        },
      ],
    },
  };
}

/**
 * 套用試卷上載結果至 parentConfig
 * @param {object} currentConfig
 * @param {{ fileName?, source?, mimeType?, seed? }} uploadMeta
 */
export function applyExamPaperUpload(currentConfig, uploadMeta = {}) {
  const seed = uploadMeta.seed ?? Date.now();
  const variants = generateExamVariantPack({ ...uploadMeta, seed });
  const aiAnalysis = buildExamAnalysisFromUpload(uploadMeta);
  const hint = aiAnalysis.scaffoldHint;

  // UGC 共享：試卷 OCR 辨識的新成語／詞彙自動匯入中央題庫（智能去重）
  const ugcIngest = ingestFromExamPatterns(IDIOM_PATTERNS, {
    seed,
    contributorLabel: generateContributorLabel(seed),
  });

  const vocabByTask = {
    ...(currentConfig.assignedContent?.vocabByTask || {}),
    dictation: [
      { id: `ai-d-${seed}-1`, tc: '悟', sc: '悟', py: 'wù', jp: 'ng6', en: 'Understand', isReview: true },
      { id: `ai-d-${seed}-2`, tc: '語', sc: '语', py: 'yǔ', jp: 'jyu5', en: 'Speech', isReview: true },
      { id: `ai-d-${seed}-3`, tc: '恍然大悟', sc: '恍然大悟', py: 'huǎng rán dà wù', jp: 'fong2 jin4 daai6 ng6', en: 'Epiphany', radical: '忄', body: '𡿺' },
      { id: `ai-d-${seed}-4`, tc: '並肩作戰', sc: '并肩作战', py: 'bìng jiān zuò zhàn', jp: 'bing3 gin1 zok3 zin3', en: 'Unity' },
      { id: `ai-d-${seed}-5`, tc: '中流砥柱', sc: '中流砥柱', py: 'zhōng liú dǐ zhù', jp: 'zung1 lau4 zyu3', en: 'Pillar' },
    ],
  };

  return {
    config: {
      ...currentConfig,
      activeTask: 'quiz',
      aiAnalysis: { ...aiAnalysis, ugcIngest },
      uploadLabel: `AI 試卷 · ${uploadMeta.fileName ?? '校本上載'}`,
      assignedContent: mergeUploadImagesIntoContent({
        ...currentConfig.assignedContent,
        vocabByTask,
        aiUploadSession: seed,
        quiz: { ...variants.quizBank[0], aiHint: hint },
        quizBank: variants.quizBank,
        sspa: variants.sspaBank[0] ? { ...variants.sspaBank[0] } : currentConfig.assignedContent?.sspa,
        sspaBank: variants.sspaBank,
        sentenceBank: variants.sentenceBank,
        sentence: {
          ...variants.sentence,
          words: [...variants.sentence.words],
          correctOrder: [...variants.sentence.correctOrder],
        },
      }, uploadMeta),
    },
    variants,
  };
}
