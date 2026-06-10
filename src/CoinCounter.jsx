import React, { useEffect, useState } from 'react';
import { useAnimatedNumber } from './useAnimatedNumber';
import CoinIcon from './CoinIcon';
import { BilingualLabel } from './BilingualLabel';

/**
 * 金幣計數器 — 精緻金幣圖示 + 數字滾動動畫
 */
export default function CoinCounter({
  coins,
  floatingDelta,
  isSEN,
  isNight,
  onClick,
  ownedCount,
  isDeducting,
  compact = false,
}) {
  const [pulse, setPulse] = useState(false);
  const displayCoins = useAnimatedNumber(coins, isSEN ? 700 : 550);

  useEffect(() => {
    if (floatingDelta) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [floatingDelta]);

  useEffect(() => {
    if (isDeducting) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(t);
    }
  }, [isDeducting]);

  return (
    <button
      type="button"
      onClick={onClick}
      title="查看金幣用途與兌換獎勵"
      className={`relative flex items-center rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${compact ? 'gap-1 px-2 py-1' : `gap-2 ${isSEN ? 'px-4 py-2' : 'px-3 py-1.5'}`}
        ${isNight ? 'bg-amber-900/40 text-amber-100 border-amber-600' : 'bg-yellow-50 text-yellow-800 border-yellow-400'}
        ${pulse ? 'scale-105 shadow-lg shadow-amber-300/50' : 'hover:scale-105'}`}
      aria-live="polite"
      aria-label={`金幣總數 ${displayCoins}，點擊兌換獎勵`}
    >
      <CoinIcon
        size={compact ? 'sm' : (isSEN ? 'lg' : 'md')}
        glow={pulse}
        spin={Boolean(floatingDelta)}
      />
      <span
        className={`font-black tabular-nums transition-colors duration-300
          ${isDeducting ? 'text-rose-500' : ''}
          ${compact ? 'text-xs' : (isSEN ? 'text-base' : 'text-sm')}`}
      >
        {displayCoins}
      </span>
      {!compact && (
        <span className={`font-bold ${isSEN ? 'text-xs' : 'text-[10px]'}`}>
          <BilingualLabel zh={`金幣${ownedCount > 0 ? ` · ${ownedCount}獎` : ''}`} en={`Coins${ownedCount > 0 ? ` · ${ownedCount} rewards` : ''}`} size="sm" center />
        </span>
      )}

      {floatingDelta && (
        <span
          key={floatingDelta.id}
          className="absolute -top-7 right-0 flex items-center gap-0.5 font-black text-emerald-500 animate-[coinFloat_1.2s_ease-out_forwards] pointer-events-none"
          style={{ fontSize: isSEN ? '1rem' : '0.875rem' }}
        >
          <CoinIcon size="sm" spin glow />
          +{floatingDelta.amount}
        </span>
      )}
    </button>
  );
}
