import React, { useMemo } from 'react';
import { makeDisplayText } from './chineseScript';
import { BilingualLabel } from './BilingualLabel';
import { getVocabChar } from './useSpeech';
import { useColorMode } from './colorMode';

/** 常錯字溫習提醒 — 下次練習前顯示（支援深夜模式高對比） */
export default function WrongWordReminder({
  reminders,
  activeTask,
  isSEN,
  isNCS,
  language = 'zh-HK',
  studentType,
  onDismiss,
}) {
  const { isNight } = useColorMode();
  const dt = useMemo(() => makeDisplayText(language, studentType), [language, studentType]);

  if (!reminders?.length) return null;

  const relevant = reminders
    .filter((w) => !w.lastTaskId || w.lastTaskId === activeTask || activeTask === 'dictation' || activeTask === 'quiz')
    .slice(0, 5);

  if (!relevant.length) return null;

  return (
    <div
      role="note"
      className={`rounded-xl border-2 animate-[fadeSlideIn_0.35s_ease-out]
        ${isNight ? 'border-rose-500/70 bg-rose-950/50 text-rose-50' : 'xh-day-panel border-rose-300 bg-rose-50 text-rose-950'}
        ${isSEN ? 'p-5 space-y-3' : 'p-4 space-y-2.5'}`}
    >
      <div className="flex justify-between items-start gap-2">
        <BilingualLabel
          zh={dt('📌 溫習提醒 · 上次常錯的字')}
          en="Review Reminder · Words You Missed"
          size={isSEN ? 'lg' : 'md'}
          className={`leading-snug ${isNight ? '[&_span:first-child]:text-rose-50' : ''}`}
        />
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`shrink-0 font-bold rounded-lg border px-2 py-1 transition-colors
              ${isSEN ? 'text-sm' : 'text-xs'}
              ${isNight
                ? 'text-rose-100 border-rose-600 bg-rose-900/40 hover:bg-rose-900/60'
                : 'text-rose-700 border-rose-300 bg-white hover:bg-rose-100'}`}
          >
            <BilingualLabel zh={dt('知道了')} en="Got it" size="sm" center />
          </button>
        )}
      </div>
      <BilingualLabel
        zh={dt('以下字詞曾答錯，今日練習請特別留意：')}
        en="These words were wrong before — pay extra attention today:"
        size={isSEN ? 'md' : 'sm'}
        className={`font-bold leading-relaxed ${isNight ? '[&_span:first-child]:text-rose-100' : '[&_span:first-child]:text-rose-800'}`}
      />
      <div className={`flex flex-wrap ${isSEN ? 'gap-3' : 'gap-2.5'}`}>
        {relevant.map((w) => (
          <span
            key={w.tc}
            className={`inline-flex flex-col rounded-xl border-2 font-black leading-tight
              ${isNight ? 'bg-stone-900/80 border-rose-600 text-rose-50' : 'xh-day-chip'}
              ${isSEN ? 'px-4 py-2.5 min-w-[5.5rem]' : 'px-3 py-2 min-w-[4.5rem]'}`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`${isSEN ? 'text-xl' : 'text-lg'} ${isNight ? 'text-rose-200' : 'text-rose-700'}`}>
                {getVocabChar({ tc: w.tc, sc: w.sc }, { language, studentType })}
              </span>
              <span className={`tabular-nums ${isSEN ? 'text-sm' : 'text-xs'} ${isNight ? 'text-rose-300' : 'text-rose-500'}`}>
                ×{w.count}
              </span>
            </span>
            {w.relatedCorrect && (
              <span className={`mt-1 flex items-center gap-1 ${isSEN ? 'text-sm' : 'text-xs'} font-bold ${isNight ? 'text-sky-200' : 'text-sky-700'}`}>
                <span aria-hidden className={isSEN ? 'text-base' : 'text-sm'}>≠</span>
                <span>{dt(w.relatedCorrect)}</span>
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
