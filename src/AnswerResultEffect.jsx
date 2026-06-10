import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';

const CONFETTI_COUNT = 10;

/**
 * 答題視覺特效 — 答對／答錯瞬間全屏動畫（無聲音，SEN 友善）
 * @param {'correct' | 'wrong'} type
 */
export default function AnswerResultEffect({ type, isSEN = false, isNight = false }) {
  const particles = useMemo(
    () => Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: 20 + (i * 7) % 60,
      delay: (i * 0.04) % 0.35,
      hue: i % 3,
    })),
    [],
  );

  if (!type) return null;

  const isCorrect = type === 'correct';

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <div
        className={`absolute inset-0 animate-[answerFlash_0.75s_ease-out_forwards]
          ${isCorrect
            ? isNight ? 'bg-emerald-500/30' : 'bg-emerald-400/22'
            : isNight ? 'bg-sky-600/25' : 'bg-amber-300/18'}`}
      />

      {isCorrect && (
        <>
          <span
            className={`absolute rounded-full border-4 animate-[correctRing_0.9s_ease-out_forwards]
              ${isSEN ? 'w-40 h-40' : 'w-32 h-32'}
              ${isNight ? 'border-emerald-400/70' : 'border-emerald-500/60'}`}
          />
          <span
            className={`absolute rounded-full border-2 animate-[correctRing_0.9s_ease-out_0.12s_forwards]
              ${isSEN ? 'w-52 h-52' : 'w-44 h-44'}
              ${isNight ? 'border-emerald-300/50' : 'border-emerald-400/45'}`}
          />
        </>
      )}

      <div
        className={`relative flex flex-col items-center gap-2
          ${isCorrect
            ? 'animate-[correctPop_0.85s_ease-out_forwards]'
            : 'animate-[wrongShake_0.75s_ease-out_forwards]'}`}
      >
        {isCorrect ? (
          <>
            <span
              className={`font-black leading-none drop-shadow-lg
                ${isSEN ? 'text-8xl' : 'text-7xl'}
                ${isNight ? 'text-emerald-300' : 'text-emerald-600'}`}
            >
              ✓
            </span>
            <span
              className={`font-black tracking-wide animate-[fadeSlideIn_0.35s_ease-out]
                ${isSEN ? 'text-xl' : 'text-lg'}
                ${isNight ? 'text-emerald-200' : 'text-emerald-700'}`}
            >
              答對了！
            </span>
            {particles.map((p) => (
              <span
                key={p.id}
                className={`absolute w-2 h-2 rounded-full animate-[confettiBurst_0.9s_ease-out_forwards]
                  ${p.hue === 0
                    ? 'bg-emerald-400'
                    : p.hue === 1
                      ? 'bg-amber-400'
                      : 'bg-sky-400'}`}
                style={{
                  left: `${p.left}%`,
                  top: '48%',
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </>
        ) : (
          <>
            <span className={isSEN ? 'text-6xl' : 'text-5xl'}>🛡️</span>
            <span
              className={`font-black tracking-wide
                ${isSEN ? 'text-lg' : 'text-base'}
                ${isNight ? 'text-sky-200' : 'text-sky-700'}`}
            >
              再想想看
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/** 觸發特效並在動畫結束後自動清除 */
export function useAnswerResultFx(durationMs = 900) {
  const [fx, setFx] = useState(null);
  const timerRef = useRef(null);

  const trigger = useCallback((type) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFx(type);
    timerRef.current = setTimeout(() => {
      setFx(null);
      timerRef.current = null;
    }, durationMs);
  }, [durationMs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { fx, trigger };
}
