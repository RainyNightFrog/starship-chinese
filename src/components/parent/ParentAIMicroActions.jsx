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
      <div className="rounded-xl border border-dashed border-slate-600 p-4 text-center text-xs text-slate-500 font-bold">
        完成一組練習後，AI 會依錯題生成微行動方案
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-500/40 bg-slate-800/60 p-4 space-y-3">
      <div>
        <h3 className="font-black text-sm text-indigo-200">🤖 AI 專業建議</h3>
        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
          本週微行動 · 綁定校本範圍
        </p>
        {uploadScope?.label && (
          <p className="text-[10px] text-amber-300/90 font-bold mt-1 truncate" title={uploadScope.label}>
            📎 {uploadScope.label}
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-[280px] overflow-y-auto xh-scroll xh-scroll--dark pr-1">
        {microActions.map((action) => (
          <article
            key={action.id}
            className={`rounded-lg border p-3 space-y-1.5 transition-all duration-300 ${PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.low}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{action.icon}</span>
              <h4 className="font-black text-xs text-slate-100 leading-snug">{action.titleZh}</h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{action.bodyZh}</p>
            {action.highlight && (
              <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900/60 text-amber-300 border border-amber-600/30">
                重點：{action.highlight}
              </span>
            )}
            <p className="text-[9px] text-slate-500 leading-snug">{action.bodyEn}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
