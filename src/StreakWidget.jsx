import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WEEK_LABELS, buildMonthGrid } from './streakStore';
import { BilingualLabel } from './BilingualLabel';

const EMPTY_WEEK = [false, false, false, false, false, false, false];
const VIEWPORT_PAD = 12;
const MOBILE_BREAKPOINT = 640;

function getPopoverWidth(isSEN) {
  return isSEN ? 280 : 260;
}

/** 計算日曆 popover 位置 — 手機置中、桌面依按鈕並 clamp 在視窗內 */
function computeCalendarPosition(anchorRect, isSEN) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const popoverW = Math.min(getPopoverWidth(isSEN), vw - VIEWPORT_PAD * 2);
  const half = popoverW / 2;
  const isMobile = vw < MOBILE_BREAKPOINT;

  let left;
  if (isMobile) {
    /** 手機：水平置中，避免右上角按鈕導致 popover 溢出右側 */
    left = vw / 2;
  } else {
    left = anchorRect.left + anchorRect.width / 2;
    left = Math.max(VIEWPORT_PAD + half, Math.min(vw - VIEWPORT_PAD - half, left));
  }

  /** 優先顯示在按鈕下方；空間不足則改顯示在上方 */
  const belowTop = anchorRect.bottom + 8;
  const estimatedHeight = isSEN ? 420 : 380;
  let top = belowTop;
  if (belowTop + estimatedHeight > vh - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, anchorRect.top - estimatedHeight - 8);
  }

  return { top, left, width: popoverW, isMobile };
}

/**
 * 🔥 打卡連擊組件
 * - 今日已打卡：點擊顯示月曆打卡紀錄 + 本週進度
 * - SEN 護盾：漏登時自動消耗，此處顯示剩餘數量
 */
export default function StreakWidget({
  streakCount,
  streakClaimed,
  streakShields,
  weekCheckIns = EMPTY_WEEK,
  checkInDates = [],
  shieldNotice,
  isSEN,
  isNight,
  onClaim,
  compact = false,
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPos, setCalendarPos] = useState(null);
  const containerRef = useRef(null);

  const updateCalendarPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCalendarPos(computeCalendarPosition(rect, isSEN));
  }, [isSEN]);

  const safeCheckInDates = Array.isArray(checkInDates) ? checkInDates : [];
  const safeWeekCheckIns = Array.isArray(weekCheckIns) && weekCheckIns.length === 7
    ? weekCheckIns
    : EMPTY_WEEK;

  const monthGrid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, safeCheckInDates),
    [viewYear, viewMonth, safeCheckInDates],
  );

  const monthCheckInCount = useMemo(
    () => safeCheckInDates.filter((d) => {
      const [y, m] = d.split('-').map(Number);
      return y === viewYear && m === viewMonth + 1;
    }).length,
    [safeCheckInDates, viewYear, viewMonth],
  );

  const openCalendar = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCalendarPos(computeCalendarPosition(rect, isSEN));
    }
    setShowCalendar(true);
  }, [isSEN]);

  const toggleCalendar = useCallback(() => {
    if (!streakClaimed) return;
    setShowCalendar((v) => {
      if (v) return false;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCalendarPos(computeCalendarPosition(rect, isSEN));
      }
      return true;
    });
  }, [streakClaimed, isSEN]);

  const goToPrevMonth = useCallback((e) => {
    e.stopPropagation();
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback((e) => {
    e.stopPropagation();
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const goToThisMonth = useCallback((e) => {
    e.stopPropagation();
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, []);

  /** 開啟日曆後 — 首幀前重算位置，避免 popover 閃到錯誤座標 */
  useLayoutEffect(() => {
    if (!showCalendar || !streakClaimed) {
      if (!showCalendar) setCalendarPos(null);
      return undefined;
    }
    updateCalendarPosition();
    window.addEventListener('resize', updateCalendarPosition);
    window.addEventListener('scroll', updateCalendarPosition, true);
    return () => {
      window.removeEventListener('resize', updateCalendarPosition);
      window.removeEventListener('scroll', updateCalendarPosition, true);
    };
  }, [showCalendar, streakClaimed, updateCalendarPosition]);

  useEffect(() => {
    if (!showCalendar || !streakClaimed) return undefined;

    const handleOutside = (e) => {
      if (containerRef.current?.contains(e.target)) return;
      const popover = document.getElementById('streak-calendar-popover');
      if (popover?.contains(e.target)) return;
      setShowCalendar(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [showCalendar, streakClaimed]);

  const handleClick = () => {
    if (!streakClaimed) {
      onClaim?.();
      openCalendar();
      return;
    }
    toggleCalendar();
  };

  const isViewingCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const calendarPopover = streakClaimed && showCalendar && calendarPos && (
    <>
      {calendarPos.isMobile && (
        <button
          type="button"
          aria-label="關閉打卡日曆"
          className="fixed inset-0 z-[99] bg-black/30"
          onClick={() => setShowCalendar(false)}
        />
      )}
    <div
      id="streak-calendar-popover"
      role="dialog"
      aria-label="打卡日曆"
      style={{
        position: 'fixed',
        top: calendarPos.top,
        left: calendarPos.left,
        transform: 'translateX(-50%)',
        width: calendarPos.width,
        maxWidth: `calc(100vw - ${VIEWPORT_PAD * 2}px)`,
        zIndex: 100,
      }}
    >
      <div
        className={`rounded-xl border-2 shadow-lg animate-[fadeSlideIn_0.2s_ease-out] px-3 py-2.5
          ${isNight ? 'bg-stone-800 border-amber-600/60 text-stone-100' : 'bg-white border-amber-200 text-stone-800'}
          ${isSEN ? 'py-3' : ''}`}
      >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="上個月"
          className={`rounded-lg px-1.5 py-0.5 font-bold transition-colors
            ${isNight ? 'hover:bg-stone-700 text-amber-300' : 'hover:bg-amber-50 text-amber-700'}`}
        >
          ◀
        </button>
        <div className="text-center">
          <p className={`font-bold ${isSEN ? 'text-sm' : 'text-xs'}`}>
            {viewYear} 年 {viewMonth + 1} 月
          </p>
          <p className={`opacity-60 ${isSEN ? 'text-[10px]' : 'text-[9px]'}`}>
            本月打卡 {monthCheckInCount} 天 · {monthCheckInCount} days this month
          </p>
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="下個月"
          className={`rounded-lg px-1.5 py-0.5 font-bold transition-colors
            ${isNight ? 'hover:bg-stone-700 text-amber-300' : 'hover:bg-amber-50 text-amber-700'}`}
        >
          ▶
        </button>
      </div>

      {!isViewingCurrentMonth && (
        <button
          type="button"
          onClick={goToThisMonth}
          className={`w-full mb-2 rounded-lg py-0.5 font-bold transition-colors
            ${isSEN ? 'text-[10px]' : 'text-[9px]'}
            ${isNight ? 'text-amber-300 hover:bg-stone-700' : 'text-amber-600 hover:bg-amber-50'}`}
        >
          回到本月 · This month
        </button>
      )}

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEK_LABELS.map((label) => (
          <span
            key={label}
            className={`text-center font-bold opacity-50 ${isSEN ? 'text-[10px]' : 'text-[9px]'}`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {monthGrid.flat().map((cell) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={cell.key}
                className={`flex items-center justify-center rounded-md opacity-20
                  ${isSEN ? 'h-8 text-xs' : 'h-7 text-[10px]'}`}
                aria-hidden
              >
                {cell.day}
              </div>
            );
          }

          return (
            <div
              key={cell.key}
              title={cell.isCheckedIn ? `${cell.key} 已打卡` : cell.key}
              className={`relative flex flex-col items-center justify-center rounded-md font-bold transition-all
                ${isSEN ? 'h-8 text-xs' : 'h-7 text-[10px]'}
                ${cell.isToday
                  ? (isNight
                    ? 'ring-2 ring-amber-400 bg-amber-900/40'
                    : 'ring-2 ring-amber-400 bg-amber-50')
                  : ''}
                ${cell.isCheckedIn
                  ? (isNight ? 'bg-emerald-900/50 text-emerald-200' : 'bg-green-100 text-green-700')
                  : (isNight ? 'text-stone-400' : 'text-stone-500')}`}
            >
              <span>{cell.day}</span>
              {cell.isCheckedIn && (
                <span
                  className={`absolute -top-0.5 -right-0.5 leading-none ${isSEN ? 'text-[10px]' : 'text-[8px]'}`}
                  aria-hidden
                >
                  ⭐
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={`mt-2.5 pt-2 border-t ${isNight ? 'border-stone-600' : 'border-amber-100'}`}>
        <p className={`text-center font-bold opacity-70 mb-1.5 ${isSEN ? 'text-[10px]' : 'text-[9px]'}`}>
          本週打卡 · This week
        </p>
        <div className="flex items-center justify-between gap-1">
          {WEEK_LABELS.map((label, i) => {
            const checked = safeWeekCheckIns[i];
            return (
              <div key={label} className="flex flex-col items-center gap-0.5 flex-1">
                <span
                  className={`transition-all duration-300 ${isSEN ? 'text-base' : 'text-sm'}
                    ${checked ? 'opacity-100 scale-110' : 'opacity-25 grayscale'}`}
                  aria-hidden
                >
                  {checked ? '⭐' : '☆'}
                </span>
                <span className={`font-bold ${isSEN ? 'text-[9px]' : 'text-[8px]'} opacity-60`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={showCalendar}
        aria-label={streakClaimed ? `連擊 ${streakCount} 天，查看打卡日曆` : `點擊領取今日連擊`}
        className={`flex items-center rounded-xl transition-all duration-300 select-none
          ${compact ? 'gap-1 px-2 py-1' : `gap-2 ${isSEN ? 'px-4 py-2' : 'px-3 py-1.5'}`}
          ${streakClaimed
            ? (isNight
              ? 'bg-emerald-900/50 text-emerald-300 border-2 border-emerald-600 hover:bg-emerald-900/70'
              : 'bg-green-100 text-green-700 border-2 border-green-400 hover:bg-green-50')
            : (isNight
              ? 'bg-orange-900/40 text-orange-300 border-2 border-orange-600 animate-[gentlePulse_2s_ease-in-out_infinite]'
              : 'bg-orange-100 text-orange-700 border-2 border-orange-400 animate-[gentlePulse_2s_ease-in-out_infinite]')}`}
      >
        <span className={compact ? 'text-sm' : (isSEN ? 'text-xl' : 'text-lg')} aria-hidden>🔥</span>
        <span className={`font-bold ${compact ? 'text-xs whitespace-nowrap' : (isSEN ? 'text-base' : 'text-sm')}`}>
          {compact ? (
            <span>{streakCount}天</span>
          ) : (
            <BilingualLabel zh={`連擊 ${streakCount} 天`} en={`${streakCount}-day streak`} size="sm" center />
          )}
        </span>
        <span
          className={`flex items-center gap-0.5 rounded-full font-black border
            ${compact ? 'text-[9px] px-1 py-0' : (isSEN ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5')}
            ${isNight ? 'bg-sky-900/60 text-sky-200 border-sky-600' : 'bg-sky-100 text-sky-800 border-sky-300'}`}
          title="漏登一天時自動消耗，保護連擊不中斷"
        >
          🛡️ {streakShields}
        </span>
      </button>

      {shieldNotice && (
        <p
          className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap z-50 font-bold rounded-lg px-2 py-1 border
            animate-[fadeSlideIn_0.35s_ease-out]
            ${isSEN ? 'text-xs' : 'text-[10px]'}
            ${isNight ? 'bg-sky-900 text-sky-100 border-sky-600' : 'bg-sky-50 text-sky-800 border-sky-200'}`}
        >
          {shieldNotice}
        </p>
      )}

      {calendarPopover && createPortal(calendarPopover, document.body)}
    </div>
  );
}
