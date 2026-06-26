import React from 'react';

/** 家長端通用雙語標籤：中文主標 + 英文副標 */
export function BilingualLabel({
  zh,
  en,
  size = 'md',
  className = '',
  center = false,
  /** 家長端：手機預設只顯示中文，減少視覺負擔 */
  hideEnOnMobile = false,
}) {
  const sizes = {
    sm: { zh: 'text-sm', en: 'text-xs' },
    md: { zh: 'text-base', en: 'text-sm' },
    lg: { zh: 'text-lg', en: 'text-sm' },
    /** 家長端主按鈕 / 重要標題 */
    xl: { zh: 'text-lg sm:text-xl', en: 'text-sm' },
    parent: { zh: 'text-base sm:text-lg', en: 'text-xs sm:text-sm' },
  };
  const s = sizes[size] ?? sizes.md;
  const align = center ? 'text-center' : '';
  const enVisibility = hideEnOnMobile
    ? 'hidden sm:block'
    : '';

  return (
    <span className={`${align} ${className}`.trim()}>
      <span className={`block font-black leading-snug ${s.zh} ${align}`}>{zh}</span>
      {en && (
        <span className={`block font-medium text-slate-400 leading-snug mt-1 ${s.en} ${align} ${enVisibility}`}>
          {en}
        </span>
      )}
    </span>
  );
}

/** 區塊標題：序號 + 中英標題 */
export function SectionHeading({ step, zh, en, center = true, size = 'md' }) {
  const stepClass = size === 'lg'
    ? 'text-sm font-black uppercase tracking-wider text-slate-400'
    : 'text-xs font-black uppercase tracking-wider text-slate-400';

  return (
    <h3 className={`mb-4 ${center ? 'text-center' : ''}`}>
      <span className={stepClass}>{step}</span>
      <BilingualLabel
        zh={zh}
        en={en}
        size={size === 'lg' ? 'xl' : 'lg'}
        center={center}
        hideEnOnMobile
        className="mt-1.5"
      />
    </h3>
  );
}
