import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COIN_EARN_METHODS } from './coinRewards';
import CoinIcon from './CoinIcon';
import { BilingualLabel } from './BilingualLabel';

/**
 * 金幣獲得方式說明 — 置於金幣計數器旁（Portal 避免被其他層遮擋）
 */
export default function CoinEarnGuide({ isSEN, isNight }) {
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState(null);
  const containerRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  const toggle = useCallback((e) => {
    e.stopPropagation();
    setOpen((v) => !v);
  }, []);

  useEffect(() => {
    if (!open) {
      setPopoverPos(null);
      return undefined;
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const popover = document.getElementById('coin-earn-guide-popover');
        if (popover?.contains(e.target)) return;
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, [open, updatePosition]);

  const popover = open && popoverPos && (
    <div
      id="coin-earn-guide-popover"
      role="dialog"
      aria-label="金幣獲得方法"
      style={{ position: 'fixed', top: popoverPos.top, right: popoverPos.right, zIndex: 100 }}
      className={`rounded-xl border-2 shadow-lg animate-[fadeSlideIn_0.2s_ease-out] px-3 py-2.5 w-[220px]
        ${isNight ? 'bg-stone-800 border-amber-600/60 text-stone-100' : 'bg-white border-amber-200 text-stone-800'}
        ${isSEN ? 'w-[240px] py-3' : ''}`}
    >
      <BilingualLabel
        zh="💰 如何獲得金幣？"
        en="How to earn coins?"
        size={isSEN ? 'md' : 'sm'}
        className="font-black mb-2"
      />
      <ul className={`space-y-1.5 ${isSEN ? 'text-xs' : 'text-[11px]'}`}>
        {COIN_EARN_METHODS.map((method) => (
          <li key={method.label} className="flex items-start justify-between gap-2">
            <BilingualLabel
              zh={`${method.icon} ${method.label}`}
              en={method.labelEn}
              size="sm"
              className="font-bold leading-snug flex-1"
            />
            <span className="shrink-0 flex items-center gap-0.5 font-black text-emerald-600">
              <CoinIcon size="sm" />
              +{method.amount}
            </span>
          </li>
        ))}
      </ul>
      <BilingualLabel
        zh="點擊左側金幣可兌換獎勵"
        en="Tap coins on the left to redeem rewards"
        size="sm"
        className={`mt-2 pt-2 border-t opacity-60 leading-snug
          ${isNight ? 'border-stone-600' : 'border-amber-100'}`}
      />
    </div>
  );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="查看金幣獲得方法"
        title="如何獲得金幣？ / How to earn coins?"
        className={`flex items-center justify-center rounded-full border-2 font-black transition-all duration-300
          ${isSEN ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs'}
          ${isNight
            ? 'bg-amber-900/30 text-amber-200 border-amber-600 hover:bg-amber-900/50'
            : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'}`}
      >
        ?
      </button>
      {popover && createPortal(popover, document.body)}
    </div>
  );
}
