/**
 * 答錯題目記錄 — localStorage 持久化，供錯誤重溫 + 家長錯題本
 */
const STORAGE_KEY = 'xinghang_wrong_answers';
const MAX_PER_TASK = 40;

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function trimTaskEntries(all, taskId) {
  const taskEntries = Object.values(all)
    .filter((e) => e.taskId === taskId)
    .sort((a, b) => new Date(b.lastWrong) - new Date(a.lastWrong));
  if (taskEntries.length <= MAX_PER_TASK) return;
  taskEntries.slice(MAX_PER_TASK).forEach((e) => {
    delete all[e.id];
  });
}

/** 記錄一次答錯的題目（同題累計次數） */
export function recordWrongAnswer({
  taskId,
  questionId,
  stem,
  wrongAnswer,
  correctAnswer,
  hint,
  hintEn,
  wrongOptionIndex,
  wrongOptionId,
  hesitationMs,
  uploadScope,
  sourceType = 'school',
  similarQuestionIds = [],
}) {
  if (!taskId || !questionId) return loadAllAsList();

  const all = loadAll();
  const id = `${taskId}::${questionId}`;
  const prev = all[id] ?? {
    id,
    taskId,
    questionId,
    stem: '',
    wrongAnswer: '',
    correctAnswer: '',
    hint: '',
    hintEn: '',
    count: 0,
    lastWrong: null,
    masteredAt: null,
    similarProgress: { total: 0, mastered: 0 },
    sourceType: 'school',
    uploadScope: '',
  };

  all[id] = {
    ...prev,
    stem: stem || prev.stem,
    wrongAnswer: wrongAnswer ?? prev.wrongAnswer,
    correctAnswer: correctAnswer ?? prev.correctAnswer,
    hint: hint ?? prev.hint,
    hintEn: hintEn ?? prev.hintEn,
    wrongOptionIndex: wrongOptionIndex ?? prev.wrongOptionIndex,
    wrongOptionId: wrongOptionId ?? prev.wrongOptionId,
    lastHesitationMs: hesitationMs ?? prev.lastHesitationMs,
    uploadScope: uploadScope ?? prev.uploadScope,
    sourceType: sourceType ?? prev.sourceType,
    similarQuestionIds: similarQuestionIds.length
      ? similarQuestionIds
      : prev.similarQuestionIds ?? [],
    similarProgress: prev.similarProgress ?? { total: 2, mastered: 0 },
    count: prev.count + 1,
    lastWrong: new Date().toISOString(),
  };

  trimTaskEntries(all, taskId);
  saveAll(all);
  return loadAllAsList();
}

/** 學生答對相似題後 — 標記弱項已突破 */
export function markAnswerMastered(taskId, questionId) {
  if (!taskId || !questionId) return loadAllAsList();
  const all = loadAll();
  const id = `${taskId}::${questionId}`;
  if (!all[id]) return loadAllAsList();

  const prev = all[id].similarProgress ?? { total: 2, mastered: 0 };
  all[id] = {
    ...all[id],
    masteredAt: new Date().toISOString(),
    similarProgress: {
      total: Math.max(prev.total, 2),
      mastered: Math.min(prev.total, prev.mastered + 1),
    },
  };
  saveAll(all);
  return loadAllAsList();
}

/** 依 questionId 查詢是否曾錯過（供答對時自動突破） */
export function wasPreviouslyWrong(taskId, questionId) {
  const all = loadAll();
  const id = `${taskId}::${questionId}`;
  return Boolean(all[id] && !all[id].masteredAt);
}

export function loadAllAsList() {
  return Object.values(loadAll()).sort(
    (a, b) => new Date(b.lastWrong) - new Date(a.lastWrong),
  );
}

export function getByTask(taskId) {
  return loadAllAsList().filter((e) => e.taskId === taskId);
}

export function clearByTask(taskId) {
  const all = loadAll();
  Object.keys(all).forEach((key) => {
    if (all[key].taskId === taskId) delete all[key];
  });
  saveAll(all);
  return loadAllAsList();
}
