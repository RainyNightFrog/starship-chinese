import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WEEK_LABELS, buildMonthGrid } from './streakStore';
import { BilingualLabel } from './BilingualLabel';

const EMPTY_WEEK = [false, false, false, false, false, false, false];

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
    setCalendarPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

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

  const toggleCalendar = useCallback(() => {
    if (streakClaimed) setShowCalendar((v) => !v);
  }, [streakClaimed]);

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

  /** 點擊外部關閉日曆 */
  useEffect(() => {
    if (!showCalendar) {
      setCalendarPos(null);
      return undefined;
    }
    updateCalendarPosition();
    window.addEventListener('resize', updateCalendarPosition);
    window.addEventListener('scroll', updateCalendarPosition, true);

    const handleOutside = (e) => {
      if (containerRef.current?.contains(e.target)) return;
      const popover = document.getElementById('streak-calendar-popover');
      if (popover?.contains(e.target)) return;
      setShowCalendar(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => {
      window.removeEventListener('resize', updateCalendarPosition);
      window.removeEventListener('scroll', updateCalendarPosition, true);
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, [showCalendar, updateCalendarPosition]);

  const handleClick = () => {
    if (!streakClaimed) {
      onClaim?.();
      return;
    }
    toggleCalendar();
  };

  const isViewingCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const calendarPopover = streakClaimed && showCalendar && calendarPos && (
    <div
      id="streak-calendar-popover"
      role="dialog"
      aria-label="打卡日曆"
      style={{
        position: 'fixed',
        top: calendarPos.top,
        left: calendarPos.left,
        transform: 'translateX(-50%)',
        zIndex: 100,
      }}
      className={`rounded-xl border-2 shadow-lg animate-[fadeSlideIn_0.2s_ease-out] px-3 py-2.5 w-[260px]
        ${isNight ? 'bg-stone-800 border-amber-600/60 text-stone-100' : 'bg-white border-amber-200 text-stone-800'}
        ${isSEN ? 'py-3 w-[280px]' : ''}`}
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
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={showCalendar}
        aria-label={streakClaimed ? `連擊 ${streakCount} 天，查看打卡日曆` : `點擊領取今日連擊`}
        className={`flex items-center gap-2 rounded-xl transition-all duration-300 select-none
          ${isSEN ? 'px-4 py-2' : 'px-3 py-1.5'}
          ${streakClaimed
            ? (isNight
              ? 'bg-emerald-900/50 text-emerald-300 border-2 border-emerald-600 hover:bg-emerald-900/70'
              : 'bg-green-100 text-green-700 border-2 border-green-400 hover:bg-green-50')
            : (isNight
              ? 'bg-orange-900/40 text-orange-300 border-2 border-orange-600 animate-[gentlePulse_2s_ease-in-out_infinite]'
              : 'bg-orange-100 text-orange-700 border-2 border-orange-400 animate-[gentlePulse_2s_ease-in-out_infinite]')}`}
      >
        <span className={isSEN ? 'text-xl' : 'text-lg'} aria-hidden>🔥</span>
        <span className={`font-bold ${isSEN ? 'text-base' : 'text-sm'}`}>
          <BilingualLabel zh={`連擊 ${streakCount} 天`} en={`${streakCount}-day streak`} size="sm" center />
        </span>
        <span
          className={`flex items-center gap-0.5 rounded-full font-black border
            ${isSEN ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5'}
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
