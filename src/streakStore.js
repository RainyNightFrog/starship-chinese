/**
 * 打卡連擊狀態 — localStorage 持久化
 * 含 SEN 友善「連擊護盾」：漏登一天時自動消耗護盾，避免挫敗感
 */

const STORAGE_KEY = 'xinghang_streak_v1';
const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

/** 今日 YYYY-MM-DD（本地時區） */
export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 本週一日期字串 */
export function getWeekMondayKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return todayKey(d);
}

/** 兩個日期字串相差天數 */
function daysBetween(fromKey, toKey) {
  const a = new Date(`${fromKey}T12:00:00`);
  const b = new Date(`${toKey}T12:00:00`);
  return Math.round((b - a) / 86400000);
}

/** 今日在週一至週日陣列中的索引（0=週一） */
export function getTodayWeekIndex(date = new Date()) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function defaultWeekCheckIns() {
  const idx = getTodayWeekIndex();
  return Array.from({ length: 7 }, (_, i) => i < idx);
}

function defaultState() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    streakCount: 6,
    streakShields: 1,
    lastClaimDate: todayKey(yesterday),
    weekStart: getWeekMondayKey(),
    weekCheckIns: defaultWeekCheckIns(),
    checkInDates: [],
    shieldUsedNotice: null,
  };
}

/** 確保 checkInDates 存在，並從舊版 weekCheckIns 遷移歷史紀錄 */
function ensureCheckInDates(state) {
  if (!Array.isArray(state.checkInDates)) {
    state.checkInDates = [];
  }
  if (state.checkInDates.length === 0 && state.weekStart && state.weekCheckIns?.some(Boolean)) {
    const monday = new Date(`${state.weekStart}T12:00:00`);
    for (let i = 0; i < 7; i += 1) {
      if (state.weekCheckIns[i]) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        state.checkInDates.push(todayKey(d));
      }
    }
  }
  if (state.lastClaimDate && !state.checkInDates.includes(state.lastClaimDate)) {
    state.checkInDates.push(state.lastClaimDate);
  }
  state.checkInDates = [...new Set(state.checkInDates)].sort();
}

function addCheckInDate(state, dateKey) {
  ensureCheckInDates(state);
  if (!state.checkInDates.includes(dateKey)) {
    state.checkInDates = [...state.checkInDates, dateKey].sort();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

/**
 * 載入並 reconcile 連擊狀態（處理跨日、漏登、護盾）
 */
export function loadStreakState() {
  let state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    state = defaultState();
  }
  return reconcileStreak(state);
}

function reconcileStreak(state) {
  ensureCheckInDates(state);
  const today = todayKey();
  const weekStart = getWeekMondayKey();

  // 新週重置週進度條
  if (state.weekStart !== weekStart) {
    state.weekStart = weekStart;
    state.weekCheckIns = [false, false, false, false, false, false, false];
  }

  if (!Array.isArray(state.weekCheckIns) || state.weekCheckIns.length !== 7) {
    state.weekCheckIns = [false, false, false, false, false, false, false];
  }

  state.shieldUsedNotice = null;

  if (!state.lastClaimDate) {
    saveState(state);
    return { ...state, claimedToday: false };
  }

  const gap = daysBetween(state.lastClaimDate, today);

  if (gap === 0) {
    const idx = getTodayWeekIndex();
    if (!state.weekCheckIns[idx]) {
      state.weekCheckIns[idx] = true;
    }
    addCheckInDate(state, today);
    saveState(state);
    return { ...state, claimedToday: true };
  }

  if (gap === 1) {
    saveState(state);
    return { ...state, claimedToday: false };
  }

  // 漏登至少一天
  if (gap === 2 && (state.streakShields ?? 0) > 0) {
    state.streakShields -= 1;
    state.shieldUsedNotice = '🛡️ 已自動使用 1 枚連擊護盾，連擊得以保留！';
    state.lastClaimDate = todayKey(new Date(Date.now() - 86400000));
    saveState(state);
    return { ...state, claimedToday: false };
  }

  // 護盾不足或漏登多天 → 重置連擊（不懲罰，從 0 重新開始）
  state.streakCount = 0;
  state.weekCheckIns = [false, false, false, false, false, false, false];
  saveState(state);
  return { ...state, claimedToday: false };
}

/** 今日打卡領取連擊 */
export function claimStreakToday(state) {
  const today = todayKey();
  if (state.lastClaimDate === today) {
    return { ...state, claimedToday: true };
  }

  const gap = daysBetween(state.lastClaimDate || today, today);
  const nextCount = gap <= 1 || state.streakCount === 0 ? state.streakCount + 1 : 1;

  const weekCheckIns = Array.isArray(state.weekCheckIns) && state.weekCheckIns.length === 7
    ? [...state.weekCheckIns]
    : [false, false, false, false, false, false, false];
  weekCheckIns[getTodayWeekIndex()] = true;

  const next = {
    ...state,
    streakCount: nextCount,
    lastClaimDate: today,
    weekCheckIns,
    claimedToday: true,
    shieldUsedNotice: null,
  };
  addCheckInDate(next, today);
  saveState(next);
  return next;
}

/**
 * 建立月曆格線（週一為首列），供打卡日曆 UI 使用
 * @returns {Array<Array<{ key, day, isCurrentMonth, isCheckedIn, isToday }>>}
 */
export function buildMonthGrid(year, month, checkInDates = []) {
  const checkInSet = new Set(Array.isArray(checkInDates) ? checkInDates : []);
  const today = todayKey();
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const mondayOffset = startDow === 0 ? 6 : startDow - 1;
  const startDate = new Date(year, month, 1 - mondayOffset);

  const grid = [];
  for (let week = 0; week < 6; week += 1) {
    const row = [];
    for (let day = 0; day < 7; day += 1) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + week * 7 + day);
      const key = todayKey(cellDate);
      row.push({
        key,
        day: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === month,
        isCheckedIn: checkInSet.has(key),
        isToday: key === today,
      });
    }
    grid.push(row);
  }
  return grid;
}

export { WEEK_LABELS };
