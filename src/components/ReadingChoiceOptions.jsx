import React, { useMemo } from 'react';
import { getChoiceOptionClasses } from '../readableStyles';
import { cleanReadingOptionLabels } from '../readingOptionPrefixCleaner';

/**
 * 閱讀理解 — 右側多項選擇題選項按鈕列
 *
 * · 剝除 LLaVA 回傳的 A./B、前綴，避免「A. A.」重複
 * · 字母序號由前端統一渲染為 A. B. C. D.
 * · 點擊後透過 onChoose 聯動 handleChoice → 金幣獎勵 / 連擊紀錄 / 護盾反饋
 */
export default function ReadingChoiceOptions({
  options = [],
  correctIndex = 0,
  attempt = null,
  completed = false,
  showShield = false,
  isNight = false,
  isSEN = false,
  dt = (t) => t,
  onChoose,
}) {
  /** 渲染前清洗：選項順序已在 questionEngineCore 洗牌並同步 correctIndex */
  const cleanedLabels = useMemo(
    () => cleanReadingOptionLabels(options),
    [options],
  );

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isSEN ? 'gap-4' : ''}`}>
      {cleanedLabels.map((label, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isCorrect = idx === correctIndex;
        const isSelected = attempt === idx;

        return (
          <button
            key={idx}
            type="button"
            disabled={completed || showShield}
            aria-pressed={isSelected}
            aria-label={dt(`${letter}. ${label}`)}
            onClick={() => onChoose?.(idx, label)}
            className={`w-full text-left rounded-xl border-2 font-bold flex items-start gap-3
              transition-[background-color,border-color,transform,box-shadow,ring-color] duration-300 ease-out
              hover:shadow-md active:scale-[0.98] disabled:cursor-default disabled:active:scale-100
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70
              ${isSEN ? 'p-4 text-base' : 'p-3.5 text-sm'}
              ${getChoiceOptionClasses(isNight, { completed, isCorrect, isSelected, showShield })}`}
          >
            {/* 左側字母徽章 — 序號唯一來源，不再寫入選項正文 */}
            <span
              className={`shrink-0 flex items-center justify-center rounded-lg font-black
                transition-colors duration-300
                ${isSEN ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs'}
                ${isSelected && (completed || showShield)
                  ? isCorrect
                    ? isNight ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-500 text-white'
                    : isNight ? 'bg-sky-700 text-sky-100' : 'bg-sky-400 text-white'
                  : isNight ? 'bg-stone-700 text-amber-300' : 'bg-amber-100 text-amber-800'
                }`}
            >
              {letter}.
            </span>
            {/* 剝除前綴後的純選項文字 */}
            <span className="flex-1 pt-0.5 leading-snug">{dt(label)}</span>
            {(completed || showShield) && isCorrect && (
              <span className="shrink-0 self-center text-emerald-400 animate-[fadeSlideIn_0.35s_ease-out]">
                ✓
              </span>
            )}
            {showShield && isSelected && !isCorrect && (
              <span className={`shrink-0 self-center animate-[fadeSlideIn_0.35s_ease-out] ${isNight ? 'text-sky-300' : 'text-sky-500'}`}>
                ○
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
