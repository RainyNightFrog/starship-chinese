/** 學生端全局主題 — 由 parentConfig.studentType 驅動 */
export const STUDENT_THEMES = {
  local: {
    label: '本地生模式',
    shell: 'bg-slate-50 text-slate-900',
    header: 'bg-blue-50 border-blue-200 text-blue-900',
    sidebar: 'bg-blue-50/60 border-blue-200 text-blue-950',
    card: 'bg-white border-blue-100 shadow-md',
    navActive: 'bg-blue-200 border-blue-400 text-blue-950',
    navIdle: 'text-blue-800/70 border-transparent',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    accent: 'text-blue-700',
    btn: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
    hint: 'bg-blue-50 text-blue-800 border-blue-200',
    select: 'border-blue-300 text-blue-900',
  },
  sen: {
    label: 'SEN 輔助模式',
    shell: 'bg-white text-amber-950',
    header: 'bg-white border-amber-100 text-amber-900',
    sidebar: 'bg-white border-stone-200 text-amber-950',
    card: 'bg-white border-amber-100 shadow-md',
    navActive: 'bg-amber-100 border-amber-300 text-amber-950',
    navIdle: 'text-stone-500 border-transparent',
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    accent: 'text-amber-700',
    btn: 'bg-amber-400 hover:bg-amber-300 border-amber-400 text-white',
    hint: 'bg-white text-stone-800 border-amber-200',
    select: 'border-amber-200 bg-white text-stone-900',
  },
  mainland: {
    label: '內地生模式',
    shell: 'bg-red-50/30 text-red-950',
    header: 'bg-red-50 border-red-200 text-red-900',
    sidebar: 'bg-red-50/60 border-red-200 text-red-950',
    card: 'bg-white border-red-100 shadow-md',
    navActive: 'bg-red-200 border-red-400 text-red-950',
    navIdle: 'text-red-900/70 border-transparent',
    badge: 'bg-red-100 text-red-800 border-red-200',
    accent: 'text-red-800',
    btn: 'bg-red-500 hover:bg-red-600 border-red-600',
    hint: 'bg-red-50 text-red-800 border-red-200',
    select: 'border-red-300 text-red-900',
  },
  ncs: {
    label: 'NCS 非華語模式',
    shell: 'bg-purple-50/30 text-purple-950',
    header: 'bg-purple-50 border-purple-200 text-purple-900',
    sidebar: 'bg-purple-50/60 border-purple-200 text-purple-950',
    card: 'bg-white border-purple-100 shadow-md',
    navActive: 'bg-purple-200 border-purple-400 text-purple-950',
    navIdle: 'text-purple-900/70 border-transparent',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    accent: 'text-purple-800',
    btn: 'bg-purple-500 hover:bg-purple-600 border-purple-600',
    hint: 'bg-purple-50 text-purple-800 border-purple-200',
    select: 'border-purple-300 text-purple-900',
  },
};

export const TASK_MENU = [
  { id: 'dictation', icon: '🎧', label: '默書特訓', sub: 'Dictation' },
  { id: 'quiz', icon: '📝', label: '單元測驗', sub: 'Quick Quiz' },
  { id: 'sspa', icon: '🏆', label: '呈分試模擬', sub: 'SSPA Mock' },
  { id: 'prestudy', icon: '🌱', label: '課文預習', sub: 'Pre-study' },
  { id: 'sentence', icon: '🧩', label: '重組句子', sub: 'Unscramble' },
  { id: 'reading', icon: '📖', label: '閱讀理解', sub: 'Reading' },
];

export function getTheme(studentType) {
  return STUDENT_THEMES[studentType] ?? STUDENT_THEMES.sen;
}
