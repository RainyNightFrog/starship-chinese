/**
 * 題庫抽題引擎核心 — Fisher-Yates 洗牌 + 歷史去重
 * ─────────────────────────────────────────────────────────────
 * 不依賴 React，可單元測試。
 */

const STORAGE_KEY = 'xinghang_question_history';

/** Fisher-Yates 洗牌（原地打亂副本） */
export function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CHOICE_TASKS = new Set(['quiz', 'sspa', 'reading']);
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

/**
 * 洗牌單題選項，同步更新 correctIndex / correctKey（避免正確答案永遠在 A）
 * @param {object} item
 * @param {string} taskId — quiz | sspa | reading
 */
export function shuffleQuestionOptions(item, taskId) {
  if (!item || !CHOICE_TASKS.has(taskId)) return item;

  if (taskId === 'quiz') {
    const options = item.options;
    if (!Array.isArray(options) || options.length < 2) return item;
    const correctKey = item.correctKey;
    const correctOpt = options.find((o) => o.key === correctKey);
    if (!correctOpt) return item;

    const shuffled = fisherYatesShuffle(options);
    const newOptions = shuffled.map((opt, i) => ({
      ...opt,
      key: OPTION_KEYS[i] ?? String.fromCharCode(65 + i),
    }));
    const newCorrectKey = newOptions.find((o) => o.word === correctOpt.word)?.key ?? 'A';

    return { ...item, options: newOptions, correctKey: newCorrectKey };
  }

  if (taskId === 'sspa' || taskId === 'reading') {
    const options = item.options;
    if (!Array.isArray(options) || options.length < 2) return item;

    let correctIndex = Number(item.correctIndex ?? item.correctAnswerIndex ?? 0);
    if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;

    const correctVal = options[correctIndex];
    const hasPinyin = Array.isArray(item.optionsPinyin)
      && item.optionsPinyin.length === options.length;

    const pairs = options.map((opt, i) => ({
      opt,
      py: hasPinyin ? item.optionsPinyin[i] : undefined,
    }));
    const shuffledPairs = fisherYatesShuffle(pairs);
    const newOptions = shuffledPairs.map((p) => p.opt);
    const newPinyin = hasPinyin ? shuffledPairs.map((p) => p.py) : item.optionsPinyin;
    let newCorrectIndex = newOptions.indexOf(correctVal);
    if (newCorrectIndex < 0) newCorrectIndex = 0;

    return {
      ...item,
      options: newOptions,
      optionsPinyin: newPinyin,
      correctIndex: newCorrectIndex,
      ...(item.correctAnswerIndex != null ? { correctAnswerIndex: newCorrectIndex } : {}),
    };
  }

  return item;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * 打亂重組句子詞卡池 — 保證與正確語序不同
 * @param {string[]} words — 待選詞卡來源
 * @param {string[]} correctOrder — 正確語序（用於比對）
 */
export function shuffleSentencePool(words, correctOrder) {
  const pool = [...(words || [])];
  const target = [...(correctOrder || words || [])];
  if (pool.length <= 1) return pool;

  let shuffled = fisherYatesShuffle(pool);
  let guard = 0;
  while (arraysEqual(shuffled, target) && guard < 24) {
    shuffled = fisherYatesShuffle(pool);
    guard += 1;
  }
  if (arraysEqual(shuffled, target) && shuffled.length >= 2) {
    shuffled = [...shuffled];
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

/** 香港日期鍵 YYYY-MM-DD */
export function getTodayKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dateKey: getTodayKey(), completed: {} };
    const parsed = JSON.parse(raw);
    if (parsed.dateKey !== getTodayKey()) {
      return { dateKey: getTodayKey(), completed: {} };
    }
    return { dateKey: parsed.dateKey, completed: parsed.completed ?? {} };
  } catch {
    return { dateKey: getTodayKey(), completed: {} };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

/** 讀取某科目今日已完成題目 ID */
export function getCompletedIds(taskId) {
  const store = loadStore();
  return store.completed[taskId] ?? [];
}

/** 標記題目已完成（去重） */
export function markQuestionComplete(taskId, questionId) {
  if (!questionId) return getCompletedIds(taskId);
  const store = loadStore();
  const set = new Set(store.completed[taskId] ?? []);
  set.add(String(questionId));
  store.completed[taskId] = [...set];
  saveStore(store);
  return store.completed[taskId];
}

/** 取消標記（例如預習轉詞語時移除舊詞的已讀紀錄） */
export function unmarkQuestionComplete(taskId, questionId) {
  if (!questionId) return getCompletedIds(taskId);
  const store = loadStore();
  const set = new Set(store.completed[taskId] ?? []);
  set.delete(String(questionId));
  store.completed[taskId] = [...set];
  saveStore(store);
  return store.completed[taskId];
}

/** 清空某科目今日歷史（題庫耗盡時自動呼叫） */
export function clearTaskHistory(taskId) {
  const store = loadStore();
  store.completed[taskId] = [];
  saveStore(store);
}

const READING_Q_NUM = (item) => item?.questionNumberInPassage
  ?? Number(String(item?.id).match(/-q(\d+)$/i)?.[1])
  ?? 0;

/**
 * 建立今日可練習的洗牌題序
 * @param {string} taskId
 * @param {Array<{ id: string }>} pool
 * @returns {{ items: object[], reshuffled: boolean, totalPool: number }}
 */
export function buildShuffledDeck(taskId, pool) {
  if (!pool?.length) {
    return { items: [], reshuffled: false, totalPool: 0 };
  }

  const allIds = pool.map((q) => String(q.id));
  let completed = getCompletedIds(taskId);
  let remaining = allIds.filter((id) => !completed.includes(id));
  let reshuffled = false;

  if (remaining.length === 0) {
    clearTaskHistory(taskId);
    completed = [];
    remaining = [...allIds];
    reshuffled = true;
  }

  const idToItem = new Map(pool.map((q) => [String(q.id), q]));
  let orderedIds = remaining;

  /** 閱讀理解：同一篇文章內按 Q1→Q2→Q3 順序，避免索引卡死 */
  if (taskId === 'reading') {
    orderedIds = [...remaining].sort((idA, idB) => {
      const a = idToItem.get(idA);
      const b = idToItem.get(idB);
      const pa = a?.passageId ?? '';
      const pb = b?.passageId ?? '';
      if (pa !== pb) return pa.localeCompare(pb);
      return READING_Q_NUM(a) - READING_Q_NUM(b);
    });
  } else {
    orderedIds = fisherYatesShuffle(remaining);
  }

  const items = orderedIds
    .map((id) => idToItem.get(id))
    .filter(Boolean)
    .map((item) => shuffleQuestionOptions({ ...item }, taskId));

  return {
    items,
    reshuffled,
    totalPool: pool.length,
    completedCount: completed.length,
  };
}
