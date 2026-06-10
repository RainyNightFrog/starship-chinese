import React, { useMemo, useState } from 'react';
import HintSpeakButton from './HintSpeakButton';
import { BilingualLabel } from './BilingualLabel';

const TASK_LABELS = {
  quiz: '單元測驗',
  sspa: '呈分試',
  sentence: '重組句子',
  reading: '閱讀理解',
};

const TASK_LABELS_EN = {
  quiz: 'Quick Quiz',
  sspa: 'SSPA Mock',
  sentence: 'Unscramble',
  reading: 'Reading',
};

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function truncate(text, max = 48) {
  if (!text) return '（無題幹）';
  const t = String(text).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function Bi({ zh, en, ...props }) {
  return <BilingualLabel zh={zh} en={en} {...props} />;
}

/**
 * 右側可展開錯題重溫面板 — 答題模式專用
 */
export default function WrongAnswerReviewPanel({
  items = [],
  activeTask,
  isSEN,
  isNight = false,
  dt = (t) => t,
  onSpeakHint,
  speechBusy = false,
  onClearTask,
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const taskItems = useMemo(
    () => items.filter((e) => e.taskId === activeTask),
    [items, activeTask],
  );

  const count = taskItems.length;
  const taskLabel = dt(TASK_LABELS[activeTask] ?? '本模式');
  const taskLabelEn = TASK_LABELS_EN[activeTask] ?? 'This Mode';

  if (!count && !panelOpen) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        title={dt('展開錯誤重溫')}
        className={`shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 font-black transition-all duration-300
          ${isNight
            ? 'border-stone-600 bg-stone-900/80 text-amber-200 hover:bg-stone-800'
            : 'border-amber-200 bg-white text-amber-900 hover:bg-amber-50 shadow-sm'}
          ${isSEN ? 'w-12 py-4 text-xs' : 'w-10 py-3 text-[10px]'}`}
      >
        <span className={isSEN ? 'text-lg' : 'text-base'} aria-hidden>📋</span>
        <Bi zh={dt('錯題')} en="Wrong" size="sm" center className="writing-vertical opacity-70" />
      </button>
    );
  }

  return (
    <aside
      className={`shrink-0 transition-all duration-300 ease-out
        ${panelOpen ? (isSEN ? 'w-full xl:w-72' : 'w-full xl:w-64') : (isSEN ? 'w-12' : 'w-10')}
        sticky top-2 xl:top-4 self-start`}
    >
      {!panelOpen ? (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          title={dt('展開錯誤重溫')}
          className={`w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 font-black transition-all
            ${isNight
              ? 'border-rose-600/60 bg-stone-900/90 text-rose-100 hover:bg-stone-800'
              : 'border-rose-200 bg-gradient-to-b from-rose-50 to-white text-rose-900 hover:from-rose-100 shadow-md'}
            ${isSEN ? 'py-5 text-xs' : 'py-4 text-[10px]'}`}
        >
          <span className={isSEN ? 'text-xl' : 'text-lg'} aria-hidden>📋</span>
          <span
            className="opacity-80 leading-tight"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            {dt('錯誤重溫')}
          </span>
          <span className="text-[9px] opacity-60 font-mono">{TASK_LABELS_EN[activeTask] ?? 'Review'}</span>
          {count > 0 && (
            <span className={`rounded-full font-black tabular-nums
              ${isNight ? 'bg-rose-600 text-white' : 'bg-rose-500 text-white'}
              ${isSEN ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]'}`}>
              {count}
            </span>
          )}
        </button>
      ) : (
        <div
          className={`rounded-2xl border-2 overflow-hidden flex flex-col shadow-lg
            ${isNight
              ? 'border-stone-600 bg-stone-900/95 text-stone-100'
              : 'border-amber-200/90 bg-white text-slate-800 shadow-amber-100/50'}
            ${isSEN ? 'max-h-[min(72vh,640px)]' : 'max-h-[min(68vh,580px)]'}`}
        >
          <div className={`flex items-center justify-between gap-2 border-b-2 px-3 py-2.5
            ${isNight ? 'border-stone-700 bg-stone-800/80' : 'border-stone-200 bg-white'}`}>
            <div className="min-w-0">
              <Bi
                zh={`📋 ${dt('錯誤重溫')}`}
                en="Wrong Answer Review"
                size={isSEN ? 'md' : 'sm'}
                className={`leading-tight ${isNight ? '[&_span:first-child]:text-amber-200' : '[&_span:first-child]:text-amber-900'}`}
              />
              <p className={`font-bold opacity-60 truncate ${isSEN ? 'text-xs' : 'text-[10px]'}`}>
                {taskLabel} · {count}{dt(' 題')}
                <span className="block font-normal opacity-80">{taskLabelEn} · {count} Q</span>
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {count > 0 && onClearTask && (
                <button
                  type="button"
                  onClick={onClearTask}
                  title={dt('清除本模式錯題')}
                  className={`rounded-lg border font-bold transition-colors
                    ${isSEN ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'}
                    ${isNight
                      ? 'border-stone-600 text-stone-400 hover:bg-stone-700'
                      : 'border-amber-200 text-amber-700 hover:bg-amber-100'}`}
                >
                  <Bi zh={dt('清除')} en="Clear" size="sm" center />
                </button>
              )}
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                title={dt('收起面板')}
                aria-label={dt('收起錯誤重溫')}
                className={`rounded-lg border font-black transition-colors
                  ${isSEN ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs'}
                  ${isNight
                    ? 'border-stone-600 text-amber-300 hover:bg-stone-700'
                    : 'border-amber-200 text-amber-800 hover:bg-amber-100'}`}
              >
                ›
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto xh-scroll ${isNight ? 'xh-scroll--dark' : ''} ${isSEN ? 'p-3 space-y-3' : 'p-2.5 space-y-2.5'}`}>
            {count === 0 ? (
              <div className={`text-center py-8 px-3 ${isSEN ? 'text-sm' : 'text-xs'}`}>
                <p className="text-3xl mb-2 opacity-60" aria-hidden>✨</p>
                <Bi
                  zh={dt('暫無錯題')}
                  en="No wrong answers yet"
                  size={isSEN ? 'md' : 'sm'}
                  center
                  className={`font-black ${isNight ? '[&_span:first-child]:text-emerald-300' : '[&_span:first-child]:text-emerald-700'}`}
                />
                <Bi
                  zh={dt('答錯後會自動收錄，方便隨時重溫')}
                  en="Wrong answers are saved here for review"
                  size="sm"
                  center
                  className="font-bold mt-1 opacity-50"
                />
              </div>
            ) : (
              taskItems.map((item, idx) => {
                const isExpanded = expandedId === item.id;
                return (
                  <article
                    key={item.id}
                    className={`rounded-xl border-2 overflow-hidden transition-all duration-200
                      ${isNight
                        ? 'border-stone-700 bg-stone-800/60'
                        : 'border-rose-100 bg-gradient-to-br from-white to-rose-50/40'}
                      ${isExpanded ? (isNight ? 'ring-1 ring-rose-500/40' : 'ring-1 ring-rose-200') : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className={`w-full text-left px-3 py-2.5 transition-colors hover:opacity-90
                        ${isSEN ? 'text-sm' : 'text-xs'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`shrink-0 font-black tabular-nums rounded-md px-1.5
                          ${isNight ? 'bg-rose-900/50 text-rose-200' : 'bg-rose-100 text-rose-700'}
                          ${isSEN ? 'text-xs' : 'text-[10px]'}`}>
                          #{idx + 1}
                        </span>
                        <span className={`shrink-0 opacity-40 tabular-nums ${isSEN ? 'text-[10px]' : 'text-[9px]'}`}>
                          {formatTime(item.lastWrong)}
                        </span>
                      </div>
                      <p className={`font-bold leading-snug mt-1.5 line-clamp-2
                        ${isNight ? 'text-stone-200' : 'text-slate-700'}
                        ${isSEN ? 'text-sm' : 'text-xs'}`}>
                        {dt(truncate(item.stem))}
                      </p>
                      <div className={`flex flex-wrap items-center gap-1.5 mt-2 font-black
                        ${isSEN ? 'text-xs' : 'text-[10px]'}`}>
                        <span className={`line-through opacity-70 ${isNight ? 'text-rose-300' : 'text-rose-600'}`}>
                          {dt(item.wrongAnswer) || '—'}
                        </span>
                        <span className="opacity-40" aria-hidden>→</span>
                        <span className={isNight ? 'text-emerald-300' : 'text-emerald-700'}>
                          {dt(item.correctAnswer) || '—'}
                        </span>
                        {item.count > 1 && (
                          <span className={`ml-auto opacity-50 tabular-nums ${isNight ? 'text-amber-300' : 'text-amber-700'}`}>
                            ×{item.count}
                          </span>
                        )}
                      </div>
                      <Bi
                        zh={isExpanded ? dt('▲ 收起詳情') : dt('▼ 查看詳情')}
                        en={isExpanded ? '▲ Hide details' : '▼ Show details'}
                        size="sm"
                        className="mt-1 opacity-40 font-bold"
                      />
                    </button>

                    {isExpanded && (
                      <div className={`px-3 pb-3 pt-0 space-y-2 border-t
                        ${isNight ? 'border-stone-700' : 'border-rose-100'}`}>
                        {item.stem && (
                          <div>
                            <Bi zh={dt('題目')} en="Question" size="sm" className="font-black opacity-50 mb-1" />
                            <p className={`font-bold leading-relaxed ${isSEN ? 'text-xs' : 'text-[10px]'} ${isNight ? 'text-stone-300' : 'text-slate-600'}`}>
                              {dt(item.stem)}
                            </p>
                          </div>
                        )}
                        {(item.hint || item.hintEn) && (
                          <div className={`rounded-lg border p-2.5
                            ${isNight ? 'border-violet-700/50 bg-violet-950/30' : 'border-violet-200 bg-violet-50/80'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <Bi zh={`💡 ${dt('溫習提示')}`} en="Review Hint" size="sm" className={`font-black mb-1 ${isNight ? '[&_span:first-child]:text-violet-300' : '[&_span:first-child]:text-violet-800'}`} />
                                {item.hint && (
                                  <p className={`font-bold leading-relaxed ${isSEN ? 'text-xs' : 'text-[10px]'} ${isNight ? 'text-stone-300' : 'text-slate-700'}`}>
                                    {dt(item.hint)}
                                  </p>
                                )}
                              </div>
                              {item.hint && onSpeakHint && (
                                <HintSpeakButton
                                  onClick={() => onSpeakHint(item.hint, item.hintEn)}
                                  disabled={speechBusy}
                                  isSEN={isSEN}
                                  label="🔊"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
