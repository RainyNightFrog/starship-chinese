import React, { useMemo, useState } from 'react';
import { BilingualLabel } from '../BilingualLabel';
import { sanitizePassageForDisplay } from '../readingDisplayGuard';
import { getReadingLineClasses } from '../readableStyles';

/**
 * 內嵌閱讀文章 — 供單元測驗等模式在選擇題上方顯示原文
 */
export default function InlineReadingPassage({
  passage = [],
  passageTitle = '',
  genre = '',
  isSEN = false,
  isNight = false,
  theme,
  dt = (t) => t,
}) {
  const [hoveredLine, setHoveredLine] = useState(null);
  const [pinnedLine, setPinnedLine] = useState(null);
  const activeLine = hoveredLine ?? pinnedLine;

  const displayPassage = useMemo(
    () => sanitizePassageForDisplay(passage),
    [passage],
  );

  if (!displayPassage.length) return null;

  const passageScrollClass = isSEN ? 'max-h-64' : 'max-h-52';
  const passageTextClass = isSEN ? 'text-base leading-relaxed' : 'text-sm leading-relaxed';

  return (
    <section className="flex flex-col gap-2 min-w-0">
      {passageTitle && (
        <p className={`text-center font-bold ${isNight ? 'text-amber-200' : theme?.accent ?? 'text-amber-800'} ${isSEN ? 'text-sm' : 'text-xs'}`}>
          📚 {dt(passageTitle)}
          {genre ? ` · ${dt(genre)}` : ''}
        </p>
      )}
      <BilingualLabel
        zh={dt('📄 閱讀文章')}
        en="Reading Passage"
        size={isSEN ? 'md' : 'sm'}
        center
        className={`font-black ${isNight ? 'text-amber-200' : theme?.accent ?? 'text-amber-800'}`}
      />
      <BilingualLabel
        zh={dt('💡 滑鼠移到句子可逐行高亮；點一下可固定該行')}
        en="Hover to highlight a line; click to pin it"
        size={isSEN ? 'md' : 'sm'}
        center
        className={`font-bold ${isNight ? 'text-stone-400' : 'text-slate-500'} ${isSEN ? 'text-sm' : 'text-xs'}`}
      />
      <div
        className={`rounded-xl border-2 overflow-y-auto xh-scroll w-full space-y-2
          ${passageScrollClass}
          ${isNight ? 'xh-scroll--dark border-stone-600 bg-stone-900/40' : 'xh-scroll border-stone-200 bg-white'}
          ${theme?.hint ?? ''} ${isSEN ? 'p-5' : 'p-4'} ${passageTextClass} font-bold`}
      >
        {displayPassage.map((line, idx) => (
          <p
            key={`passage-line-${idx}`}
            role="button"
            tabIndex={0}
            onMouseEnter={() => setHoveredLine(idx)}
            onMouseLeave={() => setHoveredLine(null)}
            onClick={() => setPinnedLine((prev) => (prev === idx ? null : idx))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPinnedLine((prev) => (prev === idx ? null : idx));
              }
            }}
            className={`rounded-lg transition-all duration-200 px-3 py-3 cursor-pointer select-none
              ${activeLine === idx ? 'scale-[1.01]' : ''}
              ${getReadingLineClasses(isNight, activeLine, idx)}`}
          >
            {dt(line)}
          </p>
        ))}
      </div>
    </section>
  );
}
