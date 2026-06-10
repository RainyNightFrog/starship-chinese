import React from 'react';
import CoinIcon from './CoinIcon';
import { BilingualLabel } from './BilingualLabel';

/**
 * 答錯反饋 — 顯示正確答案與解析，引導前往下一題（SEN 無壓設計，無大紅叉）
 */
export function ShieldFeedback({
  correctAnswer,
  explanation,
  hint,
  hintEn,
  onNext,
  onSpeakHint,
  speakingHint,
  isSEN,
  isNCS,
  isNight = false,
}) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="shield-title"
      className={`rounded-2xl border-2 shadow-lg animate-[fadeSlideIn_0.35s_ease-out] text-center
        ${isNight ? 'border-sky-600 bg-sky-950/45 text-sky-100' : 'border-sky-300 bg-sky-50 text-sky-900'}
        ${isSEN ? 'p-6 space-y-4' : 'p-5 space-y-3'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className={`${isSEN ? 'text-3xl' : 'text-2xl'}`} aria-hidden>🛡️</span>
        <div>
          <BilingualLabel
            zh="這題答錯了，看看正確答案吧"
            en="Not quite — check the correct answer"
            size={isSEN ? 'lg' : 'md'}
            center
            className={isNight ? '[&_span:first-child]:text-sky-100 [&_span:last-child]:text-sky-300/80' : '[&_span:first-child]:text-sky-800 [&_span:last-child]:text-sky-600/80'}
          />
          <BilingualLabel
            zh="進度不會被扣除，記住答案後繼續下一題"
            en="Your progress is safe — review and move on"
            size="sm"
            center
            className={`mt-1 font-bold ${isNight ? '[&_span:first-child]:text-sky-300 [&_span:last-child]:text-sky-400/70' : '[&_span:first-child]:text-sky-600 [&_span:last-child]:text-sky-500/70'}`}
          />
        </div>
      </div>

      <div className={`rounded-xl border-2 font-bold leading-relaxed text-center
        ${isNight ? 'bg-stone-900 border-emerald-700 text-emerald-100' : 'bg-white border-emerald-300 text-emerald-900'}
        ${isSEN ? 'p-4 text-base' : 'p-3 text-sm'}`}>
        <BilingualLabel
          zh={`✅ 正確答案：${correctAnswer}`}
          en={`Correct answer: ${correctAnswer}`}
          size={isSEN ? 'md' : 'sm'}
          center
          className={isNight ? '[&_span:first-child]:text-emerald-100 [&_span:last-child]:text-emerald-300/80' : '[&_span:first-child]:text-emerald-900 [&_span:last-child]:text-emerald-700/80'}
        />
        {explanation && (
          <p className={`mt-2 ${isNight ? 'text-stone-200' : 'text-stone-700'}`}>
            📖 {explanation}
          </p>
        )}
      </div>

      {hint && (
        <div className={`rounded-xl border-2 font-bold leading-relaxed text-center
          ${isNight ? 'bg-stone-900 border-sky-700 text-stone-100' : 'bg-white border-sky-200'}
          ${isSEN ? 'p-4 text-base' : 'p-3 text-sm'}`}>
          <div className="flex flex-col items-center gap-2">
            <div>
              <BilingualLabel
                zh={`💡 字義提示：${hint}`}
                en="Meaning Hint"
                size={isSEN ? 'md' : 'sm'}
                center
                className={isNight ? '[&_span:first-child]:text-stone-100' : ''}
              />
              {hintEn && (
                <p className={`mt-1.5 text-sm font-bold ${isNight ? 'text-purple-300' : 'text-purple-700'}`}>
                  Eng: {hintEn}
                </p>
              )}
            </div>
            {onSpeakHint && (
              <button
                type="button"
                onClick={onSpeakHint}
                disabled={speakingHint}
                className={`rounded-lg font-black border-2 bg-violet-500 hover:bg-violet-600 text-white border-violet-600
                  transition disabled:opacity-50 ${isSEN ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
              >
                <BilingualLabel zh="🔊 聽提示" en="Hear Hint" size="sm" center className="[&_span:last-child]:!text-white/80" />
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className={`w-full rounded-xl font-black text-white bg-sky-500 hover:bg-sky-600 border-2 border-sky-600
          transition transform active:scale-[0.98] ${isSEN ? 'py-3 text-base' : 'py-2.5 text-sm'}`}
      >
        <BilingualLabel zh="下一題 →" en="Next Question →" size={isSEN ? 'md' : 'sm'} center className="[&_span:last-child]:!text-white/80" />
      </button>
    </div>
  );
}

/**
 * ✅ 答對慶祝 — 簡明解析 + 金幣獎勵提示
 */
export function CorrectCelebration({ explanation, coinAmount, onDismiss, isSEN, isNight = false }) {
  return (
    <div
      role="dialog"
      aria-labelledby="celebrate-title"
      className={`rounded-2xl border-2 shadow-lg animate-[fadeSlideIn_0.35s_ease-out] text-center
        ${isNight ? 'border-emerald-600 bg-emerald-950/45 text-emerald-100' : 'border-emerald-400 bg-emerald-50 text-emerald-900'}
        ${isSEN ? 'p-6 space-y-4' : 'p-5 space-y-3'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className={isSEN ? 'text-3xl' : 'text-2xl'} aria-hidden>✨</span>
        <BilingualLabel
          zh="太棒了！答對了！"
          en="Great job — correct!"
          size={isSEN ? 'lg' : 'md'}
          center
          className={isNight ? '[&_span:first-child]:text-emerald-100 [&_span:last-child]:text-emerald-300/80' : ''}
        />
      </div>

      {explanation && (
        <p className={`rounded-xl border font-bold text-center
          ${isNight ? 'bg-stone-900 border-emerald-700 text-stone-100' : 'bg-white border-emerald-200'}
          ${isSEN ? 'p-4 text-base' : 'p-3 text-sm'}`}>
          📖 {explanation}
        </p>
      )}

      <div className={`font-black flex flex-col items-center gap-2 ${isNight ? 'text-amber-300' : 'text-amber-700'}`}>
        <CoinIcon size={isSEN ? 'md' : 'sm'} glow spin />
        <BilingualLabel
          zh={`獲得努力能量金幣 +${coinAmount}`}
          en={`Earned +${coinAmount} effort coins`}
          size={isSEN ? 'md' : 'sm'}
          center
          className={isNight ? '[&_span:last-child]:text-amber-400/80' : '[&_span:last-child]:text-amber-600/80'}
        />
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className={`w-full rounded-xl font-black border-2 transition
          ${isNight
            ? 'text-emerald-100 bg-emerald-800 hover:bg-emerald-700 border-emerald-600'
            : 'text-emerald-800 bg-emerald-200 hover:bg-emerald-300 border-emerald-400'}
          ${isSEN ? 'py-3 text-base' : 'py-2.5 text-sm'}`}
      >
        <BilingualLabel zh="繼續練習" en="Keep Practising" size={isSEN ? 'md' : 'sm'} center />
      </button>
    </div>
  );
}

/** 進度條 — 僅答對時推進，答錯不後退 */
export function ProgressBar({ current, total, isSEN, isNight = false }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className={`space-y-1 text-center ${isSEN ? 'mb-4' : 'mb-3'}`}>
      <div className={`flex flex-col items-center gap-0.5 text-xs font-bold ${isNight ? 'text-stone-300' : 'opacity-70'}`}>
        <BilingualLabel zh="溫習進度" en="Study Progress" size="sm" center />
        <span>{current}/{total}</span>
      </div>
      <div className={`w-full rounded-full overflow-hidden ${isNight ? 'bg-stone-700' : 'bg-slate-200'} ${isSEN ? 'h-3' : 'h-2'}`}>
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
