import React from 'react';
import { BilingualLabel } from './BilingualLabel';

/** 字義提示 / AI 提示 語音播放按鈕 */
export default function HintSpeakButton({
  onClick,
  disabled,
  isSEN,
  label = '🔊 聽提示',
  labelEn = 'Hear Hint',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-lg font-black border-2 bg-violet-500 hover:bg-violet-600 text-white border-violet-600
        transition disabled:opacity-50 ${isSEN ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
    >
      {labelEn ? (
        <BilingualLabel zh={label} en={labelEn} size="sm" center className="[&_span:last-child]:!text-white/80" />
      ) : label}
    </button>
  );
}
