/**
 * 閱讀 OCR 常見誤判修復 — 呈分試掃描 / Tesseract chi_tra 高頻錯字
 * 在 sanitize / 顯示 / 出題前統一套用
 */

/** 整詞替換（長模式優先） */
const PHRASE_FIXES = [
  ['生倩備', '準備'],
  ['生倩', '準'],
  ['準倩', '準'],
  ['悄倩', '悄悄'],
  ['好好珍惜真不要', '好好珍惜，不要'],
  ['用途處，', '用途，'],
  ['用途處。', '用途。'],
  ['深入了解呢2', '深入了解呢？'],
  ['更多了解呢2', '更多了解呢？'],
  ['深入人心', '深入民心'],
  // 紅樹林／說明文常見 OCR 誤讀
  ['火類、魚類', '鳥類、魚類'],
  ['火類，魚類', '鳥類，魚類'],
  ['蝦、融', '蝦、蟹'],
  ['蝦，融', '蝦，蟹'],
  ['節省篩養', '節省飼養'],
  ['篩養成本', '飼養成本'],
  ['看野這月', '看望這片'],
  ['這月特別的樹林', '這片特別的樹林'],
  ['樹林呸', '樹林啊'],
  ['樹林呸！', '樹林啊！'],
  ['土，源輕', '能減輕'],
  ['源輕水土', '減輕水土'],
  ['異曲同宮', '異曲同工'],
  ['異曲同功', '異曲同工'],
  ['鹽線', '鹽腺'],
  // 通用形近字
  ['己經', '已經'],
  ['以後', '以後'],
  ['在次', '再次'],
  ['做品', '作品'],
  ['自已', '自己'],
  ['因該', '應該'],
  ['必需要', '必須'],
  ['其它', '其他'],
];

/** 依上下文 regex 修復（chi_tra 高頻形近誤判） */
const CONTEXT_REGEX_FIXES = [
  [/火類(?=[、，,]\s*魚類)/g, '鳥類'],
  [/蝦[、，,]\s*融(?=[^融]|$)/g, '蝦、蟹'],
  [/節省.{0,2}篩養/g, '節省飼養'],
  [/篩養成本/g, '飼養成本'],
  [/看野這[月片野]/g, '看望這片'],
  [/這[月野]特別的樹林/g, '這片特別的樹林'],
  [/樹林[呸呸！!]/g, '樹林啊'],
  [/土[，,]\s*源輕/g, '能減輕'],
  [/源輕水土流失/g, '減輕水土流失'],
  [/防止.{0,4}水土流失/g, (m) => m.replace(/源輕|土，源/g, '減輕')],
  [/異曲同[宮功工]/g, '異曲同工'],
  [/紅樹[釋释]/g, '紅樹釋'],
  [/有機物[和与]幼[蟲虫]/g, '有機物和幼蟲'],
  [/義[士土](?=[」」]|的|，|。|！)/g, '義士'],
  [/丹[寧宁寧]/g, '丹寧'],
  [/鹽線/g, '鹽腺'],
  [/皮[孔子](?=和|、|，)/g, '皮孔'],
  [/木[欖榄]/g, '木欖'],
  [/瑰[寶宝]/g, '瑰寶'],
  [/潮[間问]/g, '潮間'],
  [/排[鹽盐]/g, '排鹽'],
  [/生態[系統统]/g, '生態系統'],
  [/過濾[污污水]/g, '過濾污水'],
  [/千萬不要忘(?!了)看/g, '千萬不要忘了看'],
  [/呢[？?]?2$/gm, '呢？'],
  [/([。！？])呸/g, '$1啊'],
];

/** 行內 regex 修復 */
const REGEX_FIXES = [
  [/悄悄\s*[（(]\s*的\s*[\/／]\s*地\s*[）)]/g, '悄悄地'],
  [/([^\s，。！？；]{1,8})\s*[（(]\s*[的得]\s*[\/／]\s*[的地]\s*[）)]/g, '$1'],
  [/我還要\s*G@/gi, '我還要做'],
  [/要\s*G@/gi, '要做'],
  [/G@\s*(?=美味|三|薄)/g, '要做'],
  [/G@/g, '做'],
  [/修@/g, ''],
  [/([^\s])@([^\s])/g, '$1$2'],
];

/**
 * 修復 OCR 誤判字元（保留繁體標點「」、？）
 * @param {string} text
 * @returns {string}
 */
export function repairReadingOcrText(text = '') {
  let s = String(text ?? '');

  s = s.replace(/[①②③④⑤⑥⑦⑧⑨⑩⓪◯○]/g, '');

  PHRASE_FIXES.forEach(([wrong, right]) => {
    s = s.split(wrong).join(right);
  });

  REGEX_FIXES.forEach(([re, rep]) => {
    s = s.replace(re, rep);
  });

  CONTEXT_REGEX_FIXES.forEach((entry) => {
    const [re, rep] = entry;
    s = typeof rep === 'function' ? s.replace(re, rep) : s.replace(re, rep);
  });

  s = stripWorksheetWatermarks(s);
  s = stripTrailingQuestionNumberArtifacts(s);

  s = s.replace(
    /([\u4e00-\u9fff，「『：])([A-Za-z@#]{1,4})([\u4e00-\u9fff])/g,
    (all, before, mid, after) => {
      if (/^G@$/i.test(mid)) return `${before}做${after}`;
      if (/^[@#]+$/.test(mid)) return `${before}${after}`;
      if (/^[a-zA-Z]{1,3}$/.test(mid)) return `${before}${after}`;
      return all;
    },
  );

  return s;
}

/** 剝除黏在句尾的試題編號（如「呢2」← 下題「2.」誤黏） */
function stripTrailingQuestionNumberArtifacts(text = '') {
  let s = String(text ?? '');
  s = s.replace(/([呢吗嗎吧啊呀哇])([0-9０-９]{1,2})+$/g, '$1');
  s = s.replace(/([。！？；，])([0-9０-９]{1,2})+$/g, '$1');
  s = s.replace(/([\u4e00-\u9fff])([1-9１-９])$/g, '$1');
  s = s.replace(/是不是有了更多了解呢(?!([？?]))/g, '是不是有了更多了解呢？');
  return s;
}

/** 試卷頁腳水印（含 OCR 誤讀：更八練習、歡迎到一一） */
const WATERMARK_FULL = /[—\-–―─=\s]*更[多八][练練]?[習习]\s*[,，]?\s*歡迎到[\s\S]*?(?:免費下載|免费下载)/gi;
const WATERMARK_TAIL = /[，,。.]?[—\-–―─=\s]+更[多八八]?[练練]?[習习][,，]?\s*歡迎到[\u4e00-\u9fff\d\s—\-–_\.a-zA-Z一]*$/g;
const WATERMARK_WELCOME_TAIL = /[,，;；\s]*歡迎到[\s一\d—\-–_\.]{2,}$/g;
const WATERMARK_ONLY_LINE = /^[—\-–―─\s]*更[多八][练練]?[習习][,，]?\s*歡迎到.*$/gm;

function stripWatermarkFromSegment(text = '') {
  return String(text ?? '')
    .replace(/更多練習\s*[,，]?\s*歡迎到\s*www\.[a-zA-Z0-9.-]+\.[a-z]{2,}\s*免費下載/gi, '')
    .replace(/更多練習\s*[,，]?\s*歡迎到\s*[a-zA-Z0-9-]+\.(?:com|hk|org|net)\s*免費下載/gi, '')
    .replace(WATERMARK_FULL, '')
    .replace(WATERMARK_TAIL, '')
    .replace(WATERMARK_WELCOME_TAIL, '')
    .replace(/www\.[a-zA-Z0-9.-]+\.[a-z]{2,}/gi, '')
    .replace(/beasmartc9\.com/gi, '')
    .replace(/免費下載(?=[\u4e00-\u9fff「])/g, '')
    .replace(/([。！？；，])[—\-–―─=\s]+(?=[\u4e00-\u9fff「])/g, '$1')
    .trim();
}

/** 剝除試卷頁眉/頁腳水印（避免與正文黏連導致整段被誤判為無效行） */
export function stripWorksheetWatermarks(text = '') {
  const raw = String(text ?? '');
  const byLine = raw.includes('\n')
    ? raw.split('\n').map(stripWatermarkFromSegment).join('\n')
    : stripWatermarkFromSegment(raw);
  return stripWatermarkFromSegment(byLine.replace(WATERMARK_ONLY_LINE, ''));
}

/** 修復後是否仍含可疑 OCR 殘留 */
export function hasSuspiciousOcrArtifacts(text = '') {
  const s = String(text ?? '');
  return /G@|生倩|修@|[A-Za-z]{2,}@/.test(s);
}
