import React, { useId } from 'react';

/** 尺寸對照（px） */
const SIZES = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
};

/**
 * 精緻努力能量金幣 SVG
 * - 金色漸層 + 邊緣高光 + 中央星芒（象徵努力能量）
 * - 支援 spin / glow 動效（SEN 友善：緩慢、不閃爍）
 */
export default function CoinIcon({
  size = 'md',
  className = '',
  spin = false,
  glow = false,
  title = '努力能量金幣',
}) {
  const uid = useId().replace(/:/g, '');
  const px = typeof size === 'number' ? size : (SIZES[size] ?? SIZES.md);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={title}
      className={`inline-block shrink-0 select-none ${spin ? 'animate-[coinSpin_2.4s_ease-in-out_infinite]' : ''} ${glow ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.65)]' : ''} ${className}`}
    >
      <title>{title}</title>

      {/* 外圈陰影 */}
      <circle cx="24" cy="25" r="21" fill={`url(#${uid}-shadow)`} opacity="0.35" />

      {/* 金幣外緣（厚邊） */}
      <circle cx="24" cy="24" r="21" fill={`url(#${uid}-rim)`} />
      <circle cx="24" cy="24" r="19.5" fill={`url(#${uid}-face)`} stroke={`url(#${uid}-edge)`} strokeWidth="1.2" />

      {/* 左上高光 */}
      <ellipse cx="17" cy="16" rx="9" ry="6" fill="white" opacity="0.28" transform="rotate(-35 17 16)" />

      {/* 內圈紋理 */}
      <circle cx="24" cy="24" r="15" fill="none" stroke="#D97706" strokeWidth="0.6" opacity="0.35" />
      <circle cx="24" cy="24" r="12.5" fill="none" stroke="#FDE68A" strokeWidth="0.5" opacity="0.5" />

      {/* 中央星芒 — 努力能量 */}
      <path
        d="M24 14.5l1.8 5.5h5.9l-4.8 3.5 1.8 5.5L24 25.5l-4.7 3.5 1.8-5.5-4.8-3.5h5.9L24 14.5z"
        fill={`url(#${uid}-star)`}
        stroke="#B45309"
        strokeWidth="0.4"
      />

      {/* 底部反光 */}
      <ellipse cx="24" cy="30" rx="8" ry="3" fill="#92400E" opacity="0.12" />

      <defs>
        <radialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${uid}-rim`} x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="45%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        <radialGradient id={`${uid}-face`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="35%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>

        <linearGradient id={`${uid}-edge`} x1="12" y1="10" x2="36" y2="38">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id={`${uid}-star`} x1="20" y1="14" x2="28" y2="32">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 金幣 + 數量 inline 顯示 */
export function CoinAmount({ amount, size = 'sm', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums font-black ${className}`}>
      <CoinIcon size={size} />
      <span>{amount}</span>
    </span>
  );
}
