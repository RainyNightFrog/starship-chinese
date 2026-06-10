import React, { useEffect, useState, useCallback } from 'react';
import { BilingualLabel } from './BilingualLabel';
import { getMutedTextClass } from './readableStyles';
import { useColorMode } from './colorMode';

const BASE_SECONDS = 45;
const EXTEND_SECONDS = 30;

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 默書計時 — 每詞倒數 + 總用時；播放語音時暫停
 */
export default function DictationTimer({
  wordKey,
  isSEN,
  speaking,
  paused,
  onTimeUp,
}) {
  const { isNight } = useColorMode();
  const wordLimit = BASE_SECONDS;
  const [wordLeft, setWordLeft] = useState(wordLimit);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [timeUp, setTimeUp] = useState(false);

  const resetWordTimer = useCallback(() => {
    setWordLeft(wordLimit);
    setTimeUp(false);
  }, [wordLimit]);

  useEffect(() => {
    resetWordTimer();
  }, [wordKey, resetWordTimer]);

  useEffect(() => {
    if (paused || speaking) return undefined;

    const tick = setInterval(() => {
      setSessionElapsed((e) => e + 1);
      setWordLeft((t) => {
        if (t <= 0) return 0;
        const next = t - 1;
        if (next === 0) {
          setTimeUp(true);
          onTimeUp?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [paused, speaking, onTimeUp]);

  const extendTime = () => {
    setWordLeft((t) => t + EXTEND_SECONDS);
    setTimeUp(false);
  };

  const pct = wordLimit > 0 ? Math.round((wordLeft / wordLimit) * 100) : 0;
  const urgent = wordLeft <= 10 && wordLeft > 0;
  const expired = wordLeft === 0;

  const timerFaceClass = expired
    ? (isNight ? 'border-rose-500 text-rose-200 bg-rose-950/50' : 'border-rose-400 text-rose-600 bg-rose-50')
    : urgent
      ? (isNight ? 'border-amber-500 text-amber-200 bg-amber-950/40 animate-pulse' : 'border-amber-400 text-amber-700 bg-amber-50 animate-pulse')
      : (isNight ? 'border-sky-500 text-sky-200 bg-stone-900' : 'border-sky-400 text-sky-700 bg-white');

  return (
    <div className={`rounded-xl border-2 p-3 ${isNight ? 'bg-stone-800/60 border-stone-600' : 'xh-day-timer'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`relative flex items-center justify-center rounded-full border-4 font-black tabular-nums
              ${isSEN ? 'w-16 h-16 text-lg' : 'w-14 h-14 text-base'}
              ${timerFaceClass}`}
            role="timer"
            aria-live="polite"
            aria-label={`本詞剩餘 ${wordLeft} 秒`}
          >
            {wordLeft}
          </div>
          <div>
            <BilingualLabel
              zh="⏱️ 本詞倒數"
              en="Word Timer"
              size={isSEN ? 'md' : 'sm'}
              className={isNight ? '[&_span:first-child]:text-stone-200 [&_span:last-child]:text-stone-400' : '[&_span:first-child]:text-slate-700 [&_span:last-child]:text-slate-500'}
            />
            <BilingualLabel
              zh={`限時 ${wordLimit} 秒 · 總用時 ${formatTime(sessionElapsed)}`}
              en={`Limit ${wordLimit}s · Total ${formatTime(sessionElapsed)}`}
              size="sm"
              className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-xs' : 'text-[10px]')}`}
            />
          </div>
        </div>

        {expired && (
          <button
            type="button"
            onClick={extendTime}
            className={`rounded-xl font-black border-2 bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-500
              transition active:scale-[0.98] ${isSEN ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'}`}
          >
            <BilingualLabel
              zh={`⏱️ 加時 ${EXTEND_SECONDS} 秒`}
              en={`+${EXTEND_SECONDS} sec`}
              size="sm"
              center
              className="[&_span:last-child]:text-amber-900/70"
            />
          </button>
        )}
      </div>

      <div className={`mt-2 w-full rounded-full overflow-hidden ${isNight ? 'bg-stone-700' : 'bg-slate-200'} ${isSEN ? 'h-2.5' : 'h-2'}`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear
            ${expired ? 'bg-rose-400' : urgent ? 'bg-amber-400' : 'bg-sky-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {timeUp && (
        <BilingualLabel
          zh="時間到！慢慢寫也可以，或按「加時」再聽一次 🔊"
          en="Time's up! Take your time, or tap '+30 sec' to hear again 🔊"
          size={isSEN ? 'md' : 'sm'}
          center
          className={`mt-2 font-bold ${isSEN ? 'text-sm' : 'text-xs'} ${isNight ? 'text-amber-300 [&_span:last-child]:text-amber-400/80' : 'text-amber-700 [&_span:last-child]:text-amber-600/80'}`}
        />
      )}

      {speaking && (
        <BilingualLabel
          zh="🔊 播放語音中，計時暫停"
          en="Speaking — timer paused"
          size="sm"
          center
          className={`mt-1 font-bold ${getMutedTextClass(isNight, isSEN ? 'text-xs' : 'text-[10px]')}`}
        />
      )}
    </div>
  );
}
