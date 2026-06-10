import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'xinghang_color_mode_v3';

const listeners = new Set();
let currentMode = null;

function notifyColorModeListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeColorMode(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getColorMode() {
  if (currentMode == null) currentMode = loadColorMode();
  return currentMode;
}

/** 日間 — 暖米黃護眼底 + 暖白內容卡（低飽和、減眩光） */
const DAY_BRIGHT = {
  shell: 'bg-[#F5F0E6] text-stone-700',
  header: 'bg-[#EDE6D8] border-stone-300/60 text-stone-700 shadow-sm',
  sidebar: 'bg-[#E5DDD0] border-stone-300/60 text-stone-700',
  card: 'bg-[#FFFCF7] border-orange-200/80 text-stone-700 shadow-md shadow-stone-300/30',
  navActive: 'bg-[#FFFCF7] border-orange-300 text-stone-800 shadow-sm ring-1 ring-orange-200',
  navIdle: 'text-stone-600/80 border-transparent',
  badge: 'bg-orange-100 text-orange-900 border-orange-200',
  hint: 'bg-[#FFFCF7] text-stone-700 border-orange-200 shadow-sm',
  select: 'border-orange-300 bg-[#FFFCF7] text-stone-800',
  isNight: false,
};

/** 夜間 — 暖色低藍光護眼 */
const NIGHT_EYE = {
  shell: 'bg-[#1c1917] text-stone-100',
  header: 'bg-[#292524] border-stone-600 text-stone-100',
  sidebar: 'bg-[#1f1c1a] border-stone-600 text-stone-100',
  card: 'bg-[#292524] border-stone-600 text-stone-100 shadow-lg shadow-black/20',
  navActive: 'bg-stone-600 border-stone-500 text-amber-100',
  navIdle: 'text-stone-400 border-transparent',
  badge: 'bg-stone-700 text-amber-100 border-stone-500',
  accent: 'text-amber-200',
  btn: 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-stone-900',
  hint: 'bg-stone-800 text-stone-200 border-stone-600',
  select: 'border-stone-500 bg-stone-800 text-stone-100',
  isNight: true,
};

/** 各區塊底色 — inline style 用 */
const DAY_SURFACE_TEXT = {
  shell: '#44403c',
  header: '#44403c',
  sidebar: '#44403c',
  main: '#44403c',
  card: '#44403c',
};

export const SURFACE_BG = {
  day: {
    shell: '#F5F0E6',
    header: '#EDE6D8',
    sidebar: '#E5DDD0',
    main: '#F5F0E6',
    card: '#FFFCF7',
  },
  night: {
    shell: '#1c1917',
    header: '#292524',
    sidebar: '#1f1c1a',
    main: '#1c1917',
    card: '#292524',
  },
};

export function normalizeColorMode(mode) {
  return mode === 'night' ? 'night' : 'day';
}

export function getSurfaceBg(colorMode) {
  return SURFACE_BG[normalizeColorMode(colorMode)];
}

/** 日間：統一明亮白底；夜間：護眼深色（保留科目按鈕 accent / btn） */
export function applyColorMode(theme, colorMode) {
  const isNight = normalizeColorMode(colorMode) === 'night';
  if (isNight) {
    return { ...theme, ...NIGHT_EYE, isNight: true };
  }
  return {
    ...theme,
    ...DAY_BRIGHT,
    accent: theme.accent,
    btn: theme.btn,
    isNight: false,
  };
}

export function loadColorMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'night') return 'night';
    if (v === 'day') return 'day';
    ['xinghang_color_mode', 'xinghang_color_mode_v2'].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_KEY, 'day');
    return 'day';
  } catch {
    return 'day';
  }
}

export function saveColorMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, normalizeColorMode(mode));
  } catch {
    /* ignore */
  }
}

const DAY_SURFACE_MAP = [
  ['.xh-app-shell', 'shell'],
  ['.xh-app-header', 'header'],
  ['.xh-app-sidebar', 'sidebar'],
  ['.xh-app-main', 'main'],
  ['.xh-app-card', 'card'],
];

/** 日間：強制套用明亮底色（僅在 mode=day 時執行，避免與夜間 rAF 競態） */
export function paintDaySurfaces() {
  if (getColorMode() !== 'day') return;
  const surfaces = SURFACE_BG.day;
  DAY_SURFACE_MAP.forEach(([selector, key]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.setProperty('background-color', surfaces[key], 'important');
      el.style.setProperty('color', DAY_SURFACE_TEXT[key], 'important');
    });
  });
}

function clearSurfaceOverrides() {
  DAY_SURFACE_MAP.forEach(([selector]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.removeProperty('background-color');
      el.style.removeProperty('color');
    });
  });
}

export function syncDocumentTheme({ colorMode, isSEN } = {}) {
  const root = document.documentElement;
  if (colorMode) {
    const mode = normalizeColorMode(colorMode);
    currentMode = mode;
    const isNight = mode === 'night';
    const surfaces = SURFACE_BG[mode];
    root.dataset.colorMode = mode;
    root.style.backgroundColor = surfaces.shell;
    root.style.color = isNight ? '#f5f5f4' : '#44403c';
    if (document.body) document.body.style.backgroundColor = surfaces.shell;
    const appRoot = document.getElementById('root');
    if (appRoot) appRoot.style.backgroundColor = surfaces.shell;
    if (isNight) clearSurfaceOverrides();
    else paintDaySurfaces();
    root.style.setProperty('--xh-page-bg', surfaces.shell);
    root.style.setProperty('--xh-shell-bg', surfaces.shell);
    root.style.setProperty('--xh-header-bg', surfaces.header);
    root.style.setProperty('--xh-sidebar-bg', surfaces.sidebar);
    root.style.setProperty('--xh-card-bg', surfaces.card);
    root.style.setProperty('--xh-text', isNight ? '#f5f5f4' : '#44403c');
    notifyColorModeListeners();
  }
  if (typeof isSEN === 'boolean') {
    root.dataset.sen = isSEN ? 'true' : 'false';
  }
}

export function setColorMode(mode) {
  const normalized = normalizeColorMode(mode);
  saveColorMode(normalized);
  syncDocumentTheme({ colorMode: normalized });
}

/** 與 <html data-color-mode> 同步，避免外殼日間、內容深夜的割裂狀態 */
export function getColorModeSnapshot() {
  try {
    const dom = document.documentElement.dataset.colorMode;
    if (dom === 'day' || dom === 'night') {
      if (currentMode !== dom) currentMode = dom;
      return dom;
    }
  } catch {
    /* ignore */
  }
  return getColorMode();
}

export function useColorMode() {
  const mode = useSyncExternalStore(subscribeColorMode, getColorModeSnapshot, () => 'day');
  return {
    mode,
    isNight: mode === 'night',
    setMode: setColorMode,
  };
}
