/** AI 分析引擎 — 模擬弱項診斷、相似題生成、家長週報 */

import { applyExamPaperUpload } from './examPaperGenerator';

export const COIN_REWARD = 10;

/** 模擬「不合格試卷」上載後的 AI 分析結果（可匯出供 examPaperGenerator 使用） */
export function buildFailedExamAnalysis() {
  return {
    analyzedAt: new Date().toISOString(),
    weakAreas: ['形近錯別字（悟/語）', '句子結構紊亂'],
    weakAreasEn: ['Similar-character errors (悟 vs 語)', 'Disordered sentence structure'],
    parentAdviceZh:
      '張同學本次試卷顯示：①「恍然大悟」常誤寫「語」字，屬形近字混淆；②重組句子時主語與副詞位置顛倒。建議本週先完成 AI 生成的 2 道相似題，再進行默書鞏固。',
    parentAdviceEn:
      'Cheung scored weak on: (1) 悟 vs 語 in 恍然大悟; (2) sentence word order. Complete 2 AI similar questions this week, then dictation.',
    scaffoldHint:
      '「悟」意思是心裡明白、頓悟；「語」意思是說話、語言。恍然大悟 = 突然完全明白，所以用「悟」不用「語」。',
    scaffoldHintEn: '悟 = understand; 語 = speech. 恍然大悟 uses 悟, not 語.',
    weeklyReport: buildWeeklyReport(),
  };
}

/** 香港小六呈分試 — AI 專家週報（給家長） */
export function buildWeeklyReport() {
  return {
    titleZh: '張小明 · 小六呈分試 AI 週報',
    titleEn: 'Cheung Siu-ming · P6 SSPA AI Weekly Report',
    sections: [
      {
        headingZh: '📊 本次錯題歸因分析',
        headingEn: 'Error Attribution Analysis',
        bodyZh:
          '① 字形辨析：在「恍然大悟」一題選了「語」，屬高頻形近字陷阱（呈分試語文卷每年約占 8–12%）。② 語序：將「常常」置於句首，未掌握「主語 + 副詞 + 動詞」的基本結構。',
        bodyEn:
          '① Character confusion: chose 語 instead of 悟 in 恍然大悟 (8–12% of exam traps). ② Word order: placed 常常 at sentence start.',
      },
      {
        headingZh: '🎯 本週特訓方向',
        headingEn: 'This Week\'s Focus',
        bodyZh:
          '週一、三：完成 AI 相似錯題（形近字專項 + 句子重組各 1 組）。週五：家長上載學校默書單，進行校本詞彙聽寫。建議每次練習 15 分鐘，配合 SEN 加時模式。',
        bodyEn:
          'Mon/Wed: AI similar questions (character + sentence). Fri: school dictation upload. 15 min sessions with SEN extra time.',
      },
      {
        headingZh: '💡 家長行動建議',
        headingEn: 'Parent Action Items',
        bodyZh:
          '① 不必當面指出「錯了」，改用 App 內「護盾提示」引導再試。② 答對後立即給予金幣獎勵，強化正向連結。③ 週末可切換 NCS 模式，讓孩子對照英文理解字義。',
        bodyEn:
          '① Use in-app shield hints instead of direct correction. ② Reward coins on success. ③ Try NCS bilingual mode on weekends.',
      },
    ],
  };
}

/** 依弱項動態生成高仿真相似錯題，灌入 assignedContent */
export function generateSimilarQuestions(aiAnalysis) {
  const hint = aiAnalysis.scaffoldHint;

  const quiz = {
    id: 'ai-quiz-悟語',
    isAiGenerated: true,
    text: '讀完這篇課文，我對作者的做法________，終於明白他為什麼堅持原則。（形近字專項）',
    hint,
    aiHint: hint,
    options: [
      { key: 'A', word: '語', detail: '「語」指語言，語重心長才用「語」。' },
      { key: 'B', word: '悟', detail: '答對了！「深悟」= 深刻領悟，與「恍然大悟」的「悟」同一字族。' },
      { key: 'C', word: '誤', detail: '「誤」指錯誤，語境不符。' },
      { key: 'D', word: '務', detail: '「務」指事務，如「任務」。' },
    ],
    correctKey: 'B',
    explanation: '本題考查「悟」與「語」辨析。「深悟」表示深刻領悟，不可寫成「深語」。',
  };

  const quiz2 = {
    id: 'ai-quiz-悟語-2',
    isAiGenerated: true,
    text: '經過老師解釋，我才________，原來這個成語不能亂用「語」字代替。',
    hint,
    aiHint: hint,
    options: [
      { key: 'A', word: '悟', detail: '答對了！「頓悟」= 突然明白。' },
      { key: 'B', word: '語', detail: '形近易混！此處需「領悟」之意，用「悟」。' },
      { key: 'C', word: '物', detail: '「頓物」不是詞語。' },
      { key: 'D', word: '務', detail: '「頓務」不是詞語。' },
    ],
    correctKey: 'A',
    explanation: '「頓悟」強調突然明白，字形選「悟」；切勿與「語」混淆。',
  };

  const sentence = {
    id: 'ai-sentence-order',
    isAiGenerated: true,
    words: ['努力學習', '老師', '我們', '常常', '啟發'],
    correctOrder: ['老師', '啟發', '常常', '我們', '努力學習'],
    hint: '中文句子習慣：誰（主語）→ 做什麼（動詞）→ 怎樣做（副詞）→ 對象。試試把「老師」放句首。',
    aiHint: aiAnalysis.scaffoldHint,
    explanation: '正確語序：老師 / 啟發 / 常常 / 我們 / 努力學習。',
  };

  return { quiz, quiz2, sentence };
}

/** 套用不合格試卷分析 — 回傳完整 parentConfig（相容舊 API） */
export function applyFailedExamUpload(currentConfig) {
  return applyExamPaperUpload(currentConfig, {
    fileName: '模擬試卷.pdf',
    source: 'legacy',
    seed: Date.now(),
  }).config;
}

export { applyExamPaperUpload } from './examPaperGenerator';
