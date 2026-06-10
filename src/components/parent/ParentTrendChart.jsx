/**
 * 家長端成績趨勢圖 — 純 SVG + Tailwind 動畫（無需 Chart.js 依賴）
 * 新數據傳入時，柱狀條以 transition-all 平滑增長
 */

import React, { useId } from 'react';

const TASK_COLORS = {
  dictation: '#7c9eb2',
  reading: '#9b8aa8',
  quiz: '#c4a882',
  sspa: '#a89090',
  sentence: '#8fad9e',
  prestudy: '#82a8b8',
};

function AnimatedBar({ heightPct, color, label, valueLabel, delay = 0 }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[9px] font-bold text-slate-400 tabular-nums h-4">
        {valueLabel ?? ''}
      </span>
      <div className="w-full h-28 flex items-end justify-center">
        <div
          className="w-full max-w-[28px] rounded-t-md transition-all duration-700 ease-out origin-bottom"
          style={{
            height: `${Math.max(4, heightPct)}%`,
            backgroundColor: color,
            transitionDelay: `${delay}ms`,
          }}
          title={valueLabel}
        />
      </div>
      <span className="text-[9px] font-bold text-slate-500 truncate w-full text-center">
        {label}
      </span>
    </div>
  );
}

export default function ParentTrendChart({ accuracyTrend = [], todayByTask = [] }) {
  const gradientId = useId();

  const hasTrend = accuracyTrend.some((d) => d.accuracy != null);
  const maxAcc = Math.max(...accuracyTrend.map((d) => d.accuracy ?? 0), 1);

  const overallToday = todayByTask.reduce(
    (acc, t) => ({ attempted: acc.attempted + t.attempted, correct: acc.correct + t.correct }),
    { attempted: 0, correct: 0 },
  );
  const todayAccuracy = overallToday.attempted > 0
    ? Math.round((overallToday.correct / overallToday.attempted) * 100)
    : null;

  return (
    <div className="rounded-xl border border-slate-600/80 bg-slate-800/60 p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-black text-sm text-slate-100">📈 成績趨勢</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-0.5">近 7 日正確率 · 即時同步</p>
        </div>
        {todayAccuracy != null && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500 font-bold">今日</p>
            <p className="text-lg font-black text-emerald-300 tabular-nums">{todayAccuracy}%</p>
          </div>
        )}
      </div>

      {/* 7 日正確率柱狀圖 */}
      <div className="flex items-end gap-1.5 px-1">
        {accuracyTrend.map((day, idx) => (
          <AnimatedBar
            key={day.dateKey}
            heightPct={day.accuracy != null ? (day.accuracy / maxAcc) * 100 : 4}
            color={day.accuracy != null ? '#6ee7b7' : '#334155'}
            label={day.label}
            valueLabel={day.accuracy != null ? `${day.accuracy}%` : '—'}
            delay={idx * 60}
          />
        ))}
      </div>

      {!hasTrend && (
        <p className="text-[10px] text-slate-500 text-center font-bold">
          完成一組練習後，趨勢圖會自動更新
        </p>
      )}

      {/* 今日各科完成進度條 */}
      {todayByTask.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700/60">
          <p className="text-[10px] font-black text-slate-400">今日科目進度</p>
          {todayByTask.map((task) => {
            const pct = task.attempted > 0
              ? Math.round((task.correct / task.attempted) * 100)
              : 0;
            const color = TASK_COLORS[task.taskId] ?? '#94a3b8';
            return (
              <div key={task.taskId} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">{task.taskId}</span>
                  <span className="text-slate-300 tabular-nums">
                    {task.correct}/{task.attempted} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 折線趨勢（SVG） */}
      {hasTrend && (
        <svg viewBox="0 0 280 60" className="w-full h-14 mt-1" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={accuracyTrend.map((d, i) => {
              const x = (i / Math.max(accuracyTrend.length - 1, 1)) * 260 + 10;
              const y = d.accuracy != null ? 50 - (d.accuracy / 100) * 40 : 50;
              return `${x},${y}`;
            }).join(' ')}
          />
        </svg>
      )}
    </div>
  );
}
