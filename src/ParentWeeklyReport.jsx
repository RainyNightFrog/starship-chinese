import React, { useState } from 'react';
import { BilingualLabel } from './BilingualLabel';

/**
 * 可折疊的 AI 專家週報 — 展示給家長的行動建議與錯題歸因
 */
export default function ParentWeeklyReport({ aiAnalysis }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!aiAnalysis?.weeklyReport) {
    return (
      <div className="p-4 rounded-xl border-2 border-dashed border-slate-600 text-slate-500 text-xs text-center">
        <BilingualLabel
          zh="尚無 AI 週報 — 請先上載試卷"
          en="No AI report yet — upload an exam paper first"
          size="sm"
          center
        />
      </div>
    );
  }

  const report = aiAnalysis.weeklyReport;

  return (
    <div className="rounded-xl border-2 border-indigo-500/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex flex-col items-center justify-center gap-2 p-4 bg-indigo-900/60 hover:bg-indigo-900/80 transition-colors text-center relative"
      >
        <BilingualLabel
          zh="📋 查看 AI 專家給家長的週報報告"
          en="View AI Expert Weekly Report for Parents"
          size="md"
          center
          className="[&_span:first-child]:text-indigo-100 [&_span:last-child]:text-indigo-300"
        />
        <span className="text-indigo-300 text-xs font-bold">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out bg-slate-800/90
          ${isOpen ? 'max-h-[600px] opacity-100 overflow-y-auto xh-scroll xh-scroll--dark' : 'max-h-0 opacity-0 overflow-hidden'}`}
      >
        <div className="p-4 space-y-4 border-t border-indigo-500/30 text-center">
          <BilingualLabel
            zh={report.titleZh}
            en={report.titleEn}
            size="lg"
            center
            className="border-b border-slate-700 pb-3 block [&_span:first-child]:text-white [&_span:last-child]:text-slate-400"
          />

          {report.sections.map((section, idx) => (
            <article key={idx} className="rounded-lg bg-slate-900/80 p-4 border border-slate-700 space-y-2 text-center">
              <BilingualLabel
                zh={section.headingZh}
                en={section.headingEn}
                size="md"
                center
                className="[&_span:first-child]:text-amber-300 [&_span:last-child]:text-slate-500"
              />
              <p className="text-sm text-slate-200 leading-relaxed">{section.bodyZh}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{section.bodyEn}</p>
            </article>
          ))}

          {aiAnalysis.parentAdviceZh && (
            <div className="p-3 rounded-lg bg-amber-900/30 border border-amber-600/40 text-xs text-center">
              <p className="font-bold text-amber-200">{aiAnalysis.parentAdviceZh}</p>
              <p className="text-amber-400/80 mt-1">{aiAnalysis.parentAdviceEn}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
