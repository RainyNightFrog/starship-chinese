import React from 'react';
import { BilingualLabel } from './BilingualLabel';

/**
 * 🔊 語音播放按鈕 — 按需觸發，顯示「讀取中 / 播放中」狀態
 * SEN 友善：緩慢 pulse，無強烈閃爍
 */
export default function SpeechPlayButton({
  label,
  labelEn,
  loadingLabel = '⏳ 讀取中…',
  loadingLabelEn = 'Loading…',
  playingLabel,
  playingLabelEn = 'Playing…',
  isLoading = false,
  isPlaying = false,
  disabled = false,
  onClick,
  variant = 'primary',
  isSEN = false,
  fullWidth = false,
  className = '',
}) {
  const busy = isLoading || isPlaying;
  const labelSize = isSEN ? 'lg' : 'md';
  const zh = isLoading ? loadingLabel : (isPlaying && playingLabel) ? playingLabel : label;
  const en = isLoading ? loadingLabelEn : (isPlaying && playingLabel) ? playingLabelEn : labelEn;

  const variants = {
    primary: 'text-white border-2 bg-sky-500 hover:bg-sky-600 border-sky-600',
    theme: '', // 由 className 傳入 theme.btn
    violet: 'text-white border-2 bg-violet-500 hover:bg-violet-600 border-violet-600',
    indigo: 'text-white border-2 bg-indigo-500 hover:bg-indigo-600 border-indigo-600',
    pill: '', // theme.btn 圓角
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`font-black transition-all duration-300 active:scale-[0.98]
        ${fullWidth ? 'w-full' : ''}
        ${variant === 'pill' ? 'rounded-full' : 'rounded-xl'}
        ${isSEN ? (fullWidth ? 'py-4 text-lg' : 'text-base px-4 py-2') : (fullWidth ? 'py-3 text-base' : 'text-sm px-3 py-1.5')}
        ${busy ? 'opacity-80' : 'hover:opacity-90'}
        ${isLoading ? 'animate-[gentlePulse_1.5s_ease-in-out_infinite]' : ''}
        ${isPlaying && !isLoading ? 'animate-pulse' : ''}
        ${variants[variant] ?? variants.primary}
        ${className}`}
    >
      {en ? (
        <BilingualLabel
          zh={zh}
          en={en}
          size={labelSize}
          center
          className={variant === 'theme' || variant === 'primary' || variant === 'violet' || variant === 'indigo'
            ? '[&_span:last-child]:!text-white/80'
            : ''}
        />
      ) : zh}
    </button>
  );
}
