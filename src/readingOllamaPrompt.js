/**
 * Ollama 本地視覺大模型 — System / User Prompt（精簡版，省 Context 留給輸出）
 */

/** LLaVA 專用 — 禁止 Markdown / 前導廢話 */
export const OLLAMA_CRITICAL_JSON_RULE =
  'Return ONLY raw JSON starting with { ending with }. NO markdown, NO apology, NO explanation.';

/** 禁止複製占位符 */
export const OLLAMA_NO_PLACEHOLDER_RULE =
  'NEVER use placeholders like 文章標題/第一句/題幹 or options A,B,C,D. Use real OCR text from images.';

/** 精簡 System Prompt（勿嵌入整份 readingAiPrompt，4k context 會截斷輸出） */
export const OLLAMA_READING_SYSTEM_PROMPT = `香港小六閱讀理解專家。任務：① OCR 附圖繁體印刷正文 → articleLines（每句一行，≥8句）
② 依正文出 3 道四選一理解題（每題 4 個繁體選項）。
剔除校名、分數、頁碼、紅筆。contentTrack 固定 "A"。
${OLLAMA_NO_PLACEHOLDER_RULE}
${OLLAMA_CRITICAL_JSON_RULE}`;

/** 重試糾偏（極短，避免吃掉輸出 token） */
export function buildOllamaRetrySuffix(attempt = 2) {
  return `\n【重試${attempt}】直接輸出完整 JSON。articleLines≥8句，questions=3題。禁止道歉或 markdown。`;
}

/**
 * 組裝多圖 User Prompt
 * @param {number} attempt — 1-based 重試次數
 */
export function buildOllamaStitchUserPrompt(imageCount = 2, fileNames = [], attempt = 1) {
  const orderHint = fileNames.length
    ? fileNames.map((name, i) => `${i + 1}:${name}`).join('→')
    : `1→${imageCount}`;

  let prompt = `附圖 ${imageCount} 張（順序 ${orderHint}），同一篇跨頁正文。請 OCR 後輸出 JSON：
{"contentTrack":"A","articleTitle":"繁體標題","articleLines":["句1","句2",...≥8句],
"questions":[
 {"id":1,"questionText":"…","options":["…","…","…","…"],"correctAnswerIndex":0,"hint":"…"},
 {"id":2,...},{"id":3,...}
]}
全部填真實 OCR 文字。${OLLAMA_CRITICAL_JSON_RULE}`;

  if (attempt > 1) {
    prompt += buildOllamaRetrySuffix(attempt);
  }

  return prompt;
}

export function buildOllamaSingleUserPrompt(attempt = 1) {
  return buildOllamaStitchUserPrompt(1, ['p1'], attempt);
}

/** 偵測 LLaVA 占位符回應 */
export function isOllamaPlaceholderResponse(payload = {}) {
  const title = String(payload.articleTitle ?? '').trim();
  const lines = Array.isArray(payload.articleLines) ? payload.articleLines : [];
  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  const placeholderTitles = new Set(['文章標題', '标题', '標題', '文章标题']);
  const placeholderLines = new Set(['第一句', '第二句', '第一句話', '第二句話', '第三句']);
  const placeholderStems = new Set(['題幹', '题干', '题目', '題目']);

  if (placeholderTitles.has(title)) return true;
  if (lines.some((l) => placeholderLines.has(String(l).trim()))) return true;

  return questions.some((q) => {
    const stem = String(q?.questionText ?? q?.question ?? '').trim();
    if (placeholderStems.has(stem)) return true;
    const opts = q?.options ?? [];
    if (opts.length === 4) {
      const letters = opts.map((o) => String(o).trim().toUpperCase());
      if (letters.join(',') === 'A,B,C,D' || letters.every((o) => /^[A-DＡ-Ｄ]$/.test(o))) {
        return true;
      }
    }
    return false;
  });
}
