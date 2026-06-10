/**
 * generateAIReport — 依上載範圍 + 最新錯題動態生成家長 AI 建議
 *
 * 數據 A：家長上載的校本考試範圍（uploadLabel / aiAnalysis / 閱讀標題）
 * 數據 B：學生端新產生的錯題、卡頓時間、干擾項選擇
 */

import { formatDurationMs } from './learningSessionStore';

const TASK_LABELS = {
  dictation: '默書特訓',
  prestudy: '新詞預習',
  quiz: '單元測驗',
  sspa: '呈分試模擬',
  sentence: '重組句子',
  reading: '閱讀理解',
};

function extractUploadScope(parentConfig = {}) {
  const ac = parentConfig.assignedContent ?? {};
  const parts = [];

  if (parentConfig.uploadLabel) parts.push(parentConfig.uploadLabel);
  if (ac.readingBank?.[0]?.passageTitle) parts.push(ac.readingBank[0].passageTitle);
  if (parentConfig.aiAnalysis?.weakAreas?.length) {
    parts.push(parentConfig.aiAnalysis.weakAreas.join('、'));
  }

  const label = parts.filter(Boolean).join(' · ') || '校本中文呈分試範圍';
  const isSchoolUpload = Boolean(
    ac.aiUploadSession || ac.readingUploadSession || ac.vocabUploadSession,
  );

  return {
    label,
    isSchoolUpload,
    taskFocus: parentConfig.activeTask ?? 'quiz',
  };
}

function buildMicroActions({ uploadScope, recentErrors, recentSessions, studentName }) {
  const actions = [];

  recentErrors.slice(0, 3).forEach((err, idx) => {
    const taskLabel = TASK_LABELS[err.taskId] ?? err.taskId;
    const hesitation = err.hesitationMs ?? err.lastHesitationMs;
    const hesitationText = hesitation ? formatDurationMs(hesitation) : null;

    if (err.taskId === 'reading' && hesitationText) {
      actions.push({
        id: `micro-read-${idx}`,
        priority: 'high',
        icon: '📖',
        titleZh: `${studentName} · 閱讀理解卡頓偵測`,
        bodyZh: `系統偵測到${studentName}在閱讀理解「${err.stem?.slice(0, 24) ?? '第二行'}」出現了 ${hesitationText} 的卡頓。建議家長今晚在「家長神秘禮物」中，為他解鎖「防跳行聚焦遮罩」，陪他閱讀 3 分鐘。`,
        bodyEn: `Reading hesitation detected (${hesitationText}). Unlock line-focus mask for 3-min paired reading.`,
        highlight: hesitationText,
      });
    } else if (err.taskId === 'sentence') {
      actions.push({
        id: `micro-sent-${idx}`,
        priority: 'medium',
        icon: '🔀',
        titleZh: `${studentName} · 重組句子語序弱項`,
        bodyZh: `在「${uploadScope.label}」範圍內，${studentName}重組句子時${hesitationText ? `卡頓 ${hesitationText}` : '次序出錯'}。建議先完成 1 組 AI 句子重組，再用護盾提示引導主語置前。`,
        bodyEn: 'Sentence order weakness — complete 1 AI reorder set with shield hints.',
        highlight: '重組句子',
      });
    } else if (err.wrongAnswer && err.correctAnswer) {
      actions.push({
        id: `micro-quiz-${idx}`,
        priority: 'high',
        icon: '✏️',
        titleZh: `${studentName} · 形近字 / 選項混淆`,
        bodyZh: `校本範圍「${uploadScope.label}」：${studentName}將「${err.wrongAnswer}」誤選為「${err.correctAnswer}」的正確答案（${taskLabel}）。建議今晚完成 2 道 AI 同類型相似題，答對後給予金幣獎勵。`,
        bodyEn: `Confused ${err.wrongAnswer} vs ${err.correctAnswer}. Complete 2 similar AI drills tonight.`,
        highlight: `${err.wrongAnswer} → ${err.correctAnswer}`,
      });
    }
  });

  const slowReading = recentSessions.find(
    (s) => s.taskId === 'reading' && (s.hesitationMs ?? 0) >= 60000,
  );
  if (slowReading && !actions.some((a) => a.id.startsWith('micro-read'))) {
    actions.push({
      id: 'micro-read-slow',
      priority: 'high',
      icon: '⏱️',
      titleZh: `${studentName} · 閱讀節奏偏慢`,
      bodyZh: `最近一次閱讀理解耗時 ${formatDurationMs(slowReading.hesitationMs)}。建議使用「逐行聚焦」模式，每次只讀 1 行，共 3 分鐘。`,
      bodyEn: 'Slow reading pace — use line-focus mode for 3 minutes.',
      highlight: formatDurationMs(slowReading.hesitationMs),
    });
  }

  if (!actions.length) {
    actions.push({
      id: 'micro-default',
      priority: 'low',
      icon: '🌟',
      titleZh: `${studentName} · 本週保持節奏`,
      bodyZh: `已對準校本範圍「${uploadScope.label}」練習。建議每週 3 次、每次 15 分鐘，配合金幣獎勵強化正向連結。`,
      bodyEn: 'Maintain 3×15min weekly rhythm with coin rewards.',
      highlight: uploadScope.label,
    });
  }

  return actions.slice(0, 4);
}

/**
 * 動態生成 AI 分析報告（綁定數據 A + B）
 */
export function generateAIReport({
  parentConfig = {},
  wrongAnswerReviews = [],
  wrongWordReminders = [],
  learningSessions = [],
  studentName = '張同學',
} = {}) {
  const uploadScope = extractUploadScope(parentConfig);
  const recentErrors = wrongAnswerReviews.slice(0, 8);
  const recentSessions = learningSessions.slice(0, 20);

  const weakFromWords = wrongWordReminders.slice(0, 3).map((w) => `${w.tc}（×${w.count}）`);
  const weakFromAnswers = recentErrors.slice(0, 2).map(
    (e) => `${e.wrongAnswer}→${e.correctAnswer}`,
  );

  const microActions = buildMicroActions({
    uploadScope,
    recentErrors,
    recentSessions,
    studentName,
  });

  const attributionZh = [
    `📎 校本範圍：${uploadScope.label}`,
    weakFromWords.length ? `📌 常錯字：${weakFromWords.join('、')}` : null,
    weakFromAnswers.length ? `❌ 最新錯選：${weakFromAnswers.join('；')}` : null,
  ].filter(Boolean).join('\n');

  return {
    analyzedAt: new Date().toISOString(),
    uploadScope,
    weakAreas: wrongWordReminders.map((w) => w.tc).slice(0, 5),
    weakAreasEn: wrongWordReminders.map((w) => w.tc).slice(0, 5),
    parentAdviceZh: microActions[0]?.bodyZh ?? `請依校本範圍「${uploadScope.label}」持續特訓。`,
    parentAdviceEn: microActions[0]?.bodyEn ?? 'Continue targeted practice.',
    scaffoldHint: recentErrors[0]?.hint ?? parentConfig.aiAnalysis?.scaffoldHint ?? '',
    scaffoldHintEn: recentErrors[0]?.hintEn ?? '',
    microActions,
    weeklyReport: {
      titleZh: `${studentName} · 小六呈分試 AI 週報`,
      titleEn: `${studentName} · P6 SSPA AI Weekly Report`,
      sections: [
        {
          headingZh: '📊 錯題歸因（數據 A + B 強綁定）',
          headingEn: 'Error Attribution (Upload Scope + Live Errors)',
          bodyZh: attributionZh || '尚無足夠錯題數據，請完成一組練習後再查看。',
          bodyEn: 'Complete a practice set to populate live error data.',
        },
        {
          headingZh: '🎯 本週微行動方案（Micro-actions）',
          headingEn: 'Weekly Micro-actions',
          bodyZh: microActions.map((a, i) => `${i + 1}. ${a.bodyZh}`).join('\n\n'),
          bodyEn: microActions.map((a, i) => `${i + 1}. ${a.bodyEn}`).join('\n'),
        },
        {
          headingZh: '💡 家長操作指引',
          headingEn: 'Parent Playbook',
          bodyZh: '① 用護盾提示代替直接糾正。② 答對即給金幣。③ 錯題本綠勾 = 已突破弱項，可減少重複練習。',
          bodyEn: 'Use shield hints, reward coins, green check = weakness overcome.',
        },
      ],
    },
  };
}
