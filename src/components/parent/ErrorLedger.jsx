/**
 * 錯題本圖鑑（Error Ledger）
 * 學生做錯 → 自動同步；答對相似題 → 綠色勾「已突破弱項」
 */

import React, { useState } from 'react';

const TASK_ICONS = {
  dictation: '🎧',
  reading: '📖',
  quiz: '📝',
  sspa: '🏆',
  sentence: '🔀',
  prestudy: '📚',
};

function SimilarProgress({ progress = { total: 2, mastered: 0 }, masteredAt }) {
  if (masteredAt) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-300 bg-emerald-950/50 border border-emerald-600/40 px-2.5 py-1 rounded-full">
        ✅ 已突破弱項！🎉
      </span>
    );
  }

  const { total = 2, mastered = 0 } = progress;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold text-slate-500">
        <span>AI 同類型相似題</span>
        <span className="tabular-nums">{mastered}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ErrorLedger({ entries = [], uploadScopeLabel = '' }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 p-5 text-center">
        <p className="text-3xl mb-3">📒</p>
        <p className="text-sm font-bold text-slate-400 leading-relaxed">錯題本尚空 — 學生答錯後會自動同步</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-600/80 bg-slate-800/50 p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-black text-lg text-slate-100">📒 錯題本</h3>
        <span className="text-sm font-bold text-slate-500 tabular-nums">{entries.length} 項</span>
      </div>

      {uploadScopeLabel && (
        <p className="text-sm text-amber-300/80 font-bold truncate" title={uploadScopeLabel}>
          校本範圍：{uploadScopeLabel}
        </p>
      )}

      <div className="space-y-3 max-h-[280px] overflow-y-auto xh-scroll xh-scroll--dark pr-1">
        {entries.map((item) => {
          const isExpanded = expandedId === item.id;
          const icon = TASK_ICONS[item.taskId] ?? '❓';
          const isMastered = Boolean(item.masteredAt);

          return (
            <article
              key={item.id}
              className={`rounded-xl border p-4 transition-all duration-300
                ${isMastered
                  ? 'border-emerald-600/40 bg-emerald-950/20'
                  : 'border-slate-600/60 bg-slate-900/50'}`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full text-left space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg shrink-0">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {item.sourceType === 'school' ? '學校原題型' : 'AI 相似題'}
                      </span>
                      {item.count > 1 && (
                        <span className="text-sm text-rose-400 font-bold">×{item.count}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-200 mt-1.5 line-clamp-2">
                      {item.stem || item.questionId}
                    </p>
                    <p className="text-sm font-bold mt-1.5">
                      <span className="text-rose-400 line-through">{item.wrongAnswer || '—'}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="text-emerald-400">{item.correctAnswer || '—'}</span>
                    </p>
                  </div>
                  {isMastered && <span className="text-emerald-400 text-lg shrink-0">✓</span>}
                </div>

                <SimilarProgress
                  progress={item.similarProgress}
                  masteredAt={item.masteredAt}
                />
              </button>

              {isExpanded && item.hint && (
                <p className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-400 leading-relaxed">
                  💡 {item.hint}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
