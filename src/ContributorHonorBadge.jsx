import React from 'react';

/**
 * ✨ 貢獻者榮譽提示 — 當題目來自其他家長共享的 UGC 題庫時顯示
 * @param {{ contributorLabel?: string, helpedCount?: number } | null} badge
 */
export default function ContributorHonorBadge({ badge, isSEN = false, isNight = false }) {
  if (!badge?.contributorLabel) return null;

  const helped = Number(badge.helpedCount ?? 0);

  return (
    <div
      className={`mt-2 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border px-3 py-1 font-bold leading-snug
        ${isSEN ? 'text-sm' : 'text-xs'}
        ${isNight
          ? 'border-amber-500/40 bg-amber-950/35 text-amber-100'
          : 'border-amber-300 bg-amber-50 text-amber-900'}`}
      role="note"
      aria-label={`本題由${badge.contributorLabel}共享提供`}
    >
      <span aria-hidden>✨</span>
      <span>
        本題由「{badge.contributorLabel}」共享提供
        {helped > 0 && (
          <span className={isNight ? 'text-amber-200/85' : 'text-amber-700/90'}>
            {' '}
            · 已累計幫助 {helped.toLocaleString('zh-HK')} 名同學溫習
          </span>
        )}
      </span>
    </div>
  );
}
