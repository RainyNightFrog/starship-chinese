import React from 'react';
import { useColorMode } from './colorMode';
import { BilingualLabel } from './BilingualLabel';

/** 右上角日間 / 夜間 — 雙按鈕 */
export default function ColorModeToggle({ isSEN }) {
  const { mode, setMode, isNight } = useColorMode();
  const btnSize = isSEN ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs';

  const dayActive = 'bg-amber-400 border-amber-600 text-amber-950 shadow-md ring-2 ring-amber-300';
  const nightActive = 'bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-300';
  const idleClass = isNight
    ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
    : 'bg-stone-200/80 text-stone-600 hover:bg-stone-300/80';

  return (
    <div
      className={`inline-flex rounded-xl border-2 border-stone-300 overflow-hidden font-black ${isSEN ? 'text-sm' : 'text-xs'}`}
      role="group"
      aria-label="日間或夜間護眼模式"
    >
      <button
        type="button"
        aria-pressed={mode === 'day'}
        onClick={() => setMode('day')}
        className={`flex flex-col items-center transition-colors duration-200 border-r border-stone-300 ${btnSize} ${mode === 'day' ? dayActive : idleClass}`}
      >
        <span aria-hidden>☀️</span>
        <BilingualLabel zh="日間" en="Day" size="sm" center />
      </button>
      <button
        type="button"
        aria-pressed={mode === 'night'}
        onClick={() => setMode('night')}
        className={`flex flex-col items-center transition-colors duration-200 ${btnSize} ${mode === 'night' ? nightActive : idleClass}`}
      >
        <span aria-hidden>🌙</span>
        <BilingualLabel zh="夜間" en="Night" size="sm" center className={mode === 'night' ? '[&_span:last-child]:!text-indigo-200/80' : ''} />
      </button>
    </div>
  );
}
