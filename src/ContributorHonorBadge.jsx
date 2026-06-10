import React from 'react';

/**
 * ✨ 全港 UGC 共享題榮譽標籤
 * 僅 isCommunityShared === true 的題目顯示
 */
export default function ContributorHonorBadge({ badge, isSEN = false, isNight = false }) {
  if (!badge?.isCommunityShared) return null;

  return (
    <div
      className={`mt-2 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border px-3 py-1.5 font-bold leading-snug
        ${isSEN ? 'text-sm' : 'text-xs'}
        ${isNight
          ? 'border-amber-400/50 bg-gradient-to-r from-amber-950/50 to-orange-950/40 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 shadow-sm'}`}
      role="note"
      aria-label="本題由名校家長貢獻共享"
    >
      <span aria-hidden className={isSEN ? 'text-base' : 'text-sm'}>✨</span>
      <span>
        本題由名校家長貢獻共享，已累計幫助全港同學溫習學習
      </span>
    </div>
  );
}
