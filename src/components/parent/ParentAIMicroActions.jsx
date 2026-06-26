/**
 * AI 微行動方案 — 依最新錯題 + 上載範圍動態生成
 */

import React from 'react';

const PRIORITY_STYLES = {
  high: 'border-rose-500/40 bg-rose-950/30',
  medium: 'border-amber-500/40 bg-amber-950/25',
  low: 'border-emerald-500/30 bg-emerald-950/20',
};

export default function ParentAIMicroActions({ microActions = [], uploadScope = null }) {
  if (!microActions.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 p-5 text-center space-y-2">
        <h3 className="font-black text-lg text-indigo-200">🤖 AI 專業建議</h3>
        <p className="text-sm text-slate-500 font-medium">
          完成一組練習後，AI 會依錯題生成建議
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-500/40 bg-slate-800/60 p-5 space-y-4">
      <div className="text-center">
        <h3 className="font-black text-lg text-indigo-200">🤖 AI 專業建議</h3>
        {uploadScope?.label && (
          <p className="text-sm text-amber-300/90 font-bold mt-2 truncate mx-auto max-w-full" title={uploadScope.label}>
            📎 {uploadScope.label}
          </p>
        )}
      </div>

      <div className="space-y-3 max-h-[320px] overflow-y-auto xh-scroll xh-scroll--dark pr-1">
        {microActions.map((action) => (
          <article
            key={action.id}
            className={`rounded-xl border p-4 space-y-2 transition-all duration-300 ${PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.low}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{action.icon}</span>
              <h4 className="font-black text-base text-slate-100 leading-snug">{action.titleZh}</h4>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{action.bodyZh}</p>
            {action.highlight && (
              <span className="inline-block text-sm font-black px-2.5 py-1 rounded-full bg-slate-900/60 text-amber-300 border border-amber-600/30">
                重點：{action.highlight}
              </span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
