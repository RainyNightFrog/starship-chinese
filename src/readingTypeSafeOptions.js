/**
 * Type-Safe Options Pool — 題型與選項強綁定（呈分試閱讀理解）
 * 絕不盲目從正文抽句作為修辭／心態／主旨題的選項。
 */

import { trimAtPhraseBoundary, isValidOptionCandidate } from './readingTextQuality.js';

function fisherYatesShuffle(array, randInt) {
  const arr = [...array];
  const ri = randInt ?? ((n) => Math.floor(Math.random() * n));
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = ri(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 選項生成模式 */
export const OPTION_MODES = {
  RHETORIC_LABELS: 'rhetoric_labels',
  MINDSET_SHIFT: 'mindset_shift',
  ABSTRACT_THEME: 'abstract_theme',
  PASSAGE_DETAIL: 'passage_detail',
  FIXED_GOLDEN: 'fixed_golden',
  STRUCTURED_CHOICE: 'structured_choice',
  TRAP_ONLY: 'trap_only',
};

/** 標準修辭手法庫（修辭題 ABCD 僅能從此抽取） */
export const RHETORIC_OPTION_POOL = [
  '比喻', '擬人', '排比', '誇張', '反問', '設問', '對偶', '反覆',
];

const RHETORIC_DETECTORS = [
  { label: '比喻', signal: /像|如同|彷彿|好似|猶如|一般/ },
  { label: '擬人', signal: /輕撫|微笑|凝視|訴說|陪伴|悄悄|守護/ },
  { label: '誇張', signal: /萬分|極其|十分|不住|整晚|每一天|不停/ },
  { label: '排比', signal: /不但|不僅|一方面|另一方面|有的.*有的|既.*又/ },
  { label: '反問', signal: /難道|豈|何必|怎能/ },
  { label: '設問', signal: /為什麼|怎樣|如何|甚麼.*？/ },
  { label: '對偶', signal: /對仗|相對|一邊.*一邊/ },
];

/** 心態轉變題 — 四字詞組格式 */
export const MINDSET_SHIFT_POOL = [
  '由得意洋洋轉為慚愧內疚',
  '由十分憤怒轉為平靜溫和',
  '由極度恐懼轉為興高采烈',
  '由悲傷難過轉為驚喜萬分',
  '由困惑不安轉為堅定行動',
  '由緊張忐忑轉為從容自信',
  '由緊張忐忑轉為驚喜萬分',
  '由消極逃避轉為積極承擔',
  '由自卑退縮轉為勇敢面對',
];

/** 主旨深究題 — 高仿干擾句（禁止正文碎片） */
export const THEME_DISTRACTOR_POOL = [
  '說明了保護視力的重要性',
  '記述了主角在學校刻苦讀書的經歷',
  '描寫了美麗的郊外風景',
  '闡述了分享與互相幫助能帶來真正的快樂',
  '強調遵守交通規則的必要',
  '介紹了校園各項體育設施',
  '說明節約用水的重要',
  '記錄一次普通的放學活動',
  '描寫了優美的海邊景色',
  '呼籲同學多做運動保持健康',
  '說明誠實守信的重要',
  '記述了主角參加旅行團的見聞',
  '說明紅樹的名稱由來',
  '說明紅樹的特性與對大自然的貢獻',
  '鼓勵人們前往濕地公園參觀',
  '通過回憶母校生活，抒發對同學與校園的思念',
  '介紹孔子的生平、思想與對中華文化的貢獻',
  '記述主人公克服身體局限、堅持追夢的經歷',
  '描寫校園活動以表達對母校和同學的思念',
];

/** trap_profile 專用池（不含正文摘句） */
const TRAP_POOL_BY_PROFILE = {
  theme: [
    '著重描寫優美的校園風景，與全文主旨無關',
    '只記錄一次考試分數，未能帶出成長啟示',
    '強調玩樂娛樂，與作者反思態度相反',
    '把次要人物的故事當成全文中心',
  ],
  intent: [
    '批評同學不合作，但文中強調互助',
    '介紹學校設施，並非作者寫作目的',
    '炫耀個人成績，與謙虛反省的語氣不符',
    '呼籲取消默書，文中並無此意',
  ],
  summary: [
    '把後文論述的細節誤當成首段段意',
    '將結尾的總結啟示張冠李戴到本段',
    '只摘錄文中個別詞語，未能概括段意',
    '與本段時間順序或敘述重點不符',
  ],
  message: [
    '逃避困難才聰明，與作者態度相反',
    '運氣比努力重要，文中並無此論',
    '暗示不必溫習，與全文不符',
    '描寫校園花壇，與克服困難無關',
  ],
  title: [
    '美麗的校園風景',
    '一次普通的放學',
    '我喜歡的運動會項目',
    '與本文無關的科幻冒險',
  ],
  structure: [
    '概括全文主旨，總結作者的中心思想',
    '詳述人物後期的成就與深遠影響',
    '以具體事例論證觀點，層層深化論述',
    '描寫環境氣氛，為後文情節發展作鋪墊',
  ],
  relation: [
    '兩段互不相干，沒有邏輯聯繫',
    '後段否定前段，但文中為遞進關係',
    '因果顛倒，偷換概念',
    '僅並列兩個無關例子',
  ],
  transition: [
    '表示列舉同類事例',
    '表示直接否定前文',
    '僅作時間標記，無轉折',
    '與連接詞常見用法相反',
  ],
  technique: [
    '只下定義，不舉例子',
    '大量引用對話，並非借事例說理',
    '與文中先敘事後議論的手法不同',
    '純列舉成語，沒有展開',
  ],
  scene: [
    '單純介紹校園設施',
    '為旅遊指南作宣傳',
    '與人物情感無關的風景堆砌',
    '記錄天氣預報',
  ],
  emphasis: [
    '削弱人物決心，與語氣相反',
    '強調逃避責任',
    '只為諷刺老師',
    '與反覆出現的意象無關',
  ],
  vocab: [
    '望文生義，忽略上下文',
    '解釋成與本文無關的專有名詞',
    '與句中實際語境相反',
    '只按字面當成外語翻譯',
  ],
  character: [
    '驕傲自大，不願聽取意見',
    '遇到困難立刻放棄',
    '只顧玩樂，不顧學業',
    '與主角行為相反',
  ],
  implication: [
    '暗示不必努力',
    '與結尾啟示相反',
    '純粹描述天氣',
    '與事件無關的道德說教',
  ],
};

const UNIVERSAL_TRAPS = [
  '主角感到十分沮喪，不願面對現實',
  '記述了一段令人深思的經歷',
  '偷換概念，把甲事件說成乙事件',
  '與文章基調相反，故意曲解作者',
];

/** 從全文偵測最可能出現的修辭 */
export function detectRhetoricInText(text = '') {
  const hit = RHETORIC_DETECTORS.find((r) => r.signal.test(text));
  return hit?.label ?? '比喻';
}

/** 依文章語意推斷心態轉變正確項 */
export function inferMindsetShift(ctx = {}) {
  const text = (ctx.lines ?? []).join('');
  if (/生日|驚喜|開心|高興|哈哈大笑/.test(text)) {
    return '由緊張忐忑轉為驚喜萬分';
  }
  if (/分享|幫助|合作|互助|照顧/.test(text)) {
    return '由十分憤怒轉為平靜溫和';
  }
  if (/困難|挫折|失敗|懷疑/.test(text)) {
    return '由困惑不安轉為堅定行動';
  }
  if (/雖然|然而|但是|起初|後來|漸漸/.test(text)) {
    return '由消極逃避轉為積極承擔';
  }
  return '由自卑退縮轉為勇敢面對';
}

function pickUniqueFromPool(pool, correct, count, randInt) {
  const shuffled = fisherYatesShuffle(
    pool.filter((item) => item !== correct),
    randInt,
  );
  const picked = [];
  const seen = new Set([correct]);
  shuffled.forEach((item) => {
    if (picked.length >= count) return;
    if (!seen.has(item)) {
      picked.push(item);
      seen.add(item);
    }
  });
  return picked;
}

function finalizeOptions(correct, distractors, randInt) {
  const opts = [correct, ...distractors.slice(0, 3)];
  while (opts.length < 4) {
    opts.push(`（備選 ${opts.length}）`);
  }
  const shuffled = fisherYatesShuffle(opts.slice(0, 4), randInt);
  return {
    options: shuffled,
    correctAnswerIndex: Math.max(0, shuffled.indexOf(correct)),
  };
}

/** 修辭題：ABCD = 比喻／擬人／排比／誇張… */
function buildRhetoricLabelOptions(built, ctx) {
  const correct = built.rhetoricCorrect
    ?? detectRhetoricInText((ctx.lines ?? []).join(''));
  const pool = RHETORIC_OPTION_POOL.includes(correct)
    ? RHETORIC_OPTION_POOL
    : [correct, ...RHETORIC_OPTION_POOL];
  const distractors = pickUniqueFromPool(pool, correct, 3, ctx.randInt);
  return finalizeOptions(correct, distractors, ctx.randInt);
}

/** 心態轉變題：ABCD = 「由…轉為…」 */
function buildMindsetShiftOptions(built, ctx) {
  const correct = built.mindsetCorrect ?? inferMindsetShift(ctx);
  const pool = MINDSET_SHIFT_POOL.includes(correct)
    ? MINDSET_SHIFT_POOL
    : [correct, ...MINDSET_SHIFT_POOL];
  const distractors = pickUniqueFromPool(pool, correct, 3, ctx.randInt);
  return finalizeOptions(correct, distractors, ctx.randInt);
}

/** 主旨／意圖題：正確項 + 高仿主題干擾句 */
function buildAbstractThemeOptions(built, ctx) {
  const correct = built.correct;
  const topicDistractors = THEME_DISTRACTOR_POOL.filter((d) => d !== correct);
  const profilePool = TRAP_POOL_BY_PROFILE[built.trapProfile] ?? UNIVERSAL_TRAPS;
  const combined = fisherYatesShuffle(
    [...topicDistractors, ...profilePool, ...UNIVERSAL_TRAPS],
    ctx.randInt,
  );
  const distractors = [];
  const seen = new Set([correct]);
  combined.forEach((item) => {
    if (distractors.length >= 3) return;
    if (!item || seen.has(item)) return;
    distractors.push(item);
    seen.add(item);
  });
  return finalizeOptions(correct, distractors, ctx.randInt);
}

/** 細節考察題：唯一允許使用正文句子 */
function buildPassageDetailOptions(built, ctx) {
  const correct = trimAtPhraseBoundary(built.correct, 36);
  const lines = (ctx.lines ?? [])
    .map((l) => trimAtPhraseBoundary(l, 36))
    .filter((l) => isValidOptionCandidate(l, correct) && l !== correct);
  const distractors = pickUniqueFromPool(lines, correct, 3, ctx.randInt);
  while (distractors.length < 3) {
    const filler = UNIVERSAL_TRAPS[distractors.length % UNIVERSAL_TRAPS.length];
    if (filler !== correct && !distractors.includes(filler)) distractors.push(filler);
    else break;
  }
  return finalizeOptions(correct, distractors, ctx.randInt);
}

/** 其餘題型：僅 trap 池，禁止正文摘句 */
function buildTrapOnlyOptions(built, ctx) {
  const correct = built.correct;
  const profilePool = TRAP_POOL_BY_PROFILE[built.trapProfile] ?? [];
  const combined = fisherYatesShuffle(
    [...profilePool, ...UNIVERSAL_TRAPS],
    ctx.randInt,
  );
  const distractors = pickUniqueFromPool(
    combined.filter((d) => d !== correct),
    correct,
    3,
    ctx.randInt,
  );
  return finalizeOptions(correct, distractors, ctx.randInt);
}

/** 呈分試合成選項：structuredOptions + Fisher-Yates 洗牌 */
function buildStructuredChoiceOptions(built, ctx) {
  const options = built.structuredOptions ?? built.fixedOptions ?? [];
  if (options.length < 4) return null;
  const correctIdx = built.fixedCorrectIndex ?? 0;
  const correct = options[correctIdx] ?? built.correct;
  if (!correct) return null;
  const shuffled = fisherYatesShuffle(options.slice(0, 4), ctx.randInt);
  return {
    options: shuffled,
    correctAnswerIndex: Math.max(0, shuffled.indexOf(correct)),
  };
}

/** 四大黃金樣版：固定 options + Fisher-Yates 洗牌（正確索引隨洗牌更新） */
function buildFixedGoldenOptions(built, ctx) {
  const options = built.fixedOptions ?? [];
  if (options.length < 4) return null;
  const correctIdx = built.fixedCorrectIndex ?? 0;
  const correct = options[correctIdx] ?? built.correct;
  if (!correct) return null;
  const shuffled = fisherYatesShuffle(options.slice(0, 4), ctx.randInt);
  return {
    options: shuffled,
    correctAnswerIndex: Math.max(0, shuffled.indexOf(correct)),
  };
}

/**
 * 題型-選項強綁定主入口
 * @param {object} built — template.build() 回傳
 * @param {object} ctx
 * @returns {{ options: string[], correctAnswerIndex: number }|null}
 */
export function buildTypeSafeOptions(built, ctx) {
  if (!built?.correct) return null;

  const mode = built.optionMode ?? OPTION_MODES.TRAP_ONLY;

  switch (mode) {
    case OPTION_MODES.RHETORIC_LABELS:
      return buildRhetoricLabelOptions(built, ctx);
    case OPTION_MODES.MINDSET_SHIFT:
      return buildMindsetShiftOptions(built, ctx);
    case OPTION_MODES.ABSTRACT_THEME:
      return buildAbstractThemeOptions(built, ctx);
    case OPTION_MODES.PASSAGE_DETAIL:
      return buildPassageDetailOptions(built, ctx);
    case OPTION_MODES.FIXED_GOLDEN:
      return buildFixedGoldenOptions(built, ctx);
    case OPTION_MODES.STRUCTURED_CHOICE:
      return buildStructuredChoiceOptions(built, ctx);
    case OPTION_MODES.TRAP_ONLY:
    default:
      return buildTrapOnlyOptions(built, ctx);
  }
}
