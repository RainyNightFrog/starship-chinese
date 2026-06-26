/**
 * 家長端學生成績分析面板 — 訂閱 LearningAnalyticsContext，學生答題後即時重繪
 */

import React, { useEffect, useState } from 'react';
import { useLearningAnalytics } from '../../context/LearningAnalyticsContext';
import ParentTrendChart from './ParentTrendChart';
import ParentAIMicroActions from './ParentAIMicroActions';
import ErrorLedger from './ErrorLedger';
import ParentWeeklyReport from '../../ParentWeeklyReport';

function formatLiveTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('zh-HK', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ParentAnalyticsPanel({ parentConfig }) {
  const analytics = useLearningAnalytics();
  const snapshot = analytics?.snapshot;
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    if (!snapshot?.lastUpdatedAt) return undefined;
    setJustUpdated(true);
    const t = setTimeout(() => setJustUpdated(false), 1200);
    return () => clearTimeout(t);
  }, [snapshot?.lastUpdatedAt, snapshot?.todayAttempted, snapshot?.sessionCount]);

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-600 p-5 text-center text-sm text-slate-500">
        分析模組載入中…
      </div>
    );
  }

  const { accuracyTrend, todayByTask, aiAnalysis, wrongAnswerReviews, lastUpdatedAt, todayAttempted } = snapshot;
  const uploadLabel = aiAnalysis.uploadScope?.label
    ?? parentConfig.uploadLabel
    ?? '校本範圍';

  return (
    <section className="space-y-6 pt-4 border-t border-slate-700">
      <div className="text-center pb-2 space-y-2">
        <h2 className="font-black text-xl text-amber-200">📊 學生成績分析</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all duration-300
              ${justUpdated
                ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200 scale-[1.02]'
                : 'bg-slate-800 border-slate-600 text-slate-400'}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${justUpdated ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`}
              aria-hidden
            />
            即時同步 · {formatLiveTime(lastUpdatedAt)}
          </span>
          {todayAttempted > 0 && (
            <span className="text-sm text-slate-500 font-medium">
              今日已練 {todayAttempted} 題
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ParentTrendChart
          accuracyTrend={accuracyTrend}
          todayByTask={todayByTask}
        />
        <ParentAIMicroActions
          microActions={aiAnalysis.microActions}
          uploadScope={aiAnalysis.uploadScope}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ErrorLedger
          entries={wrongAnswerReviews}
          uploadScopeLabel={uploadLabel}
        />
        <div className="space-y-3">
          <p className="text-base font-black text-slate-300 text-center">AI 專家週報</p>
          <ParentWeeklyReport aiAnalysis={aiAnalysis} />
        </div>
      </div>
    </section>
  );
}
