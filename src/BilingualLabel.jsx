import React from 'react';

/** 家長端通用雙語標籤：中文主標 + 英文副標 */
export function BilingualLabel({ zh, en, size = 'md', className = '', center = false }) {
  const sizes = {
    sm: { zh: 'text-xs', en: 'text-[10px]' },
    md: { zh: 'text-sm', en: 'text-xs' },
    lg: { zh: 'text-base', en: 'text-sm' },
  };
  const s = sizes[size] ?? sizes.md;
  const align = center ? 'text-center' : '';

  return (
    <span className={`${align} ${className}`.trim()}>
      <span className={`block font-black leading-snug ${s.zh} ${align}`}>{zh}</span>
      {en && (
        <span className={`block font-medium text-slate-400 leading-snug mt-0.5 ${s.en} ${align}`}>
          {en}
        </span>
      )}
    </span>
  );
}

/** 區塊標題：序號 + 中英標題 */
export function SectionHeading({ step, zh, en, center = true }) {
  return (
    <h3 className={`mb-3 ${center ? 'text-center' : ''}`}>
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
        {step}
      </span>
      <BilingualLabel zh={zh} en={en} size="md" center={center} className="mt-1" />
    </h3>
  );
}
