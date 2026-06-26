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
      <div className="rounded-xl border border-slate-600 p-5 text-center text-sm text-slate-500">
        分析模組載入中…
      </div>
    );
  }

  const { accuracyTrend, todayByTask, aiAnalysis, wrongAnswerReviews } = snapshot;
  const uploadLabel = aiAnalysis.uploadScope?.label
    ?? parentConfig.uploadLabel
    ?? '校本範圍';

  return (
    <section className="space-y-6 pt-4 border-t border-slate-700">
      <div className="text-center pb-2">
        <h2 className="font-black text-xl text-amber-200">📊 學生成績分析</h2>
        <p className="text-sm text-slate-400 font-medium mt-2">
          學生完成練習後自動更新
        </p>
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
