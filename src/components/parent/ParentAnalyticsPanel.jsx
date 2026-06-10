/**
 * 家長端學生成績分析面板 — 左圖表 + 右 AI 建議 + 錯題本
 * 訂閱 LearningAnalyticsContext，學生答題後即時重繪
 */

import React from 'react';
import { useLearningAnalytics } from '../../context/LearningAnalyticsContext';
import ParentTrendChart from './ParentTrendChart';
import ParentAIMicroActions from './ParentAIMicroActions';
import ErrorLedger from './ErrorLedger';
import ParentWeeklyReport from '../../ParentWeeklyReport';

export default function ParentAnalyticsPanel({ parentConfig }) {
  const analytics = useLearningAnalytics();
  const snapshot = analytics?.snapshot;

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-600 p-4 text-center text-xs text-slate-500">
        分析模組載入中…
      </div>
    );
  }

  const { accuracyTrend, todayByTask, aiAnalysis, wrongAnswerReviews } = snapshot;
  const uploadLabel = aiAnalysis.uploadScope?.label
    ?? parentConfig.uploadLabel
    ?? '校本範圍';

  return (
    <section className="col-span-full space-y-4">
      <div className="text-center pb-1 border-b border-slate-700/80">
        <h2 className="font-black text-base text-amber-200">📊 學生成績分析 · 雙端即時同步</h2>
        <p className="text-[10px] text-slate-500 font-bold mt-1">
          學生完成練習 → 圖表 / AI 建議 / 錯題本自動更新
        </p>
      </div>

      {/* 左：趨勢圖 · 右：AI 微行動 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ParentTrendChart
          accuracyTrend={accuracyTrend}
          todayByTask={todayByTask}
        />
        <ParentAIMicroActions
          microActions={aiAnalysis.microActions}
          uploadScope={aiAnalysis.uploadScope}
        />
      </div>

      {/* 錯題本 + 完整週報 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ErrorLedger
          entries={wrongAnswerReviews}
          uploadScopeLabel={uploadLabel}
        />
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 text-center">完整 AI 週報</p>
          <ParentWeeklyReport aiAnalysis={aiAnalysis} />
        </div>
      </div>
    </section>
  );
}
