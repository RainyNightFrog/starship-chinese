import React, { useState, useCallback, useRef, useEffect } from 'react';
import { applyExamPaperUpload } from './examPaperGenerator';
import { applyVocabListUpload } from './vocabListGenerator';
import { getReviewReminders, clearWrongWords } from './wrongWordStore';
import { STUDENT_TYPE_OPTIONS, TASK_OPTIONS } from './parentI18n';
import { BilingualLabel, SectionHeading } from './BilingualLabel';
import UploadStatusPanel from './UploadStatusPanel';
import { CoinAmount } from './CoinIcon';
import ExamUploadModal from './components/ExamUploadModal';
import VocabUploadModal from './components/VocabUploadModal';
import ReadingUploadModal from './components/ReadingUploadModal';
import { applyReadingPaperUpload } from './readingPaperGenerator';
import { clearAllUploads, removeUploadImage } from './uploadContentManager';
import ParentAnalyticsPanel from './components/parent/ParentAnalyticsPanel';
import { useBodyScrollLock } from './useBodyScrollLock';

/**
 * 👨‍👩‍👦 家長端後台模擬器（Debug Panel）
 * 中文為主、英文並列 — 控制 parentConfig，學生端即時同步。
 */
export default function ParentDebugPanel({
  parentConfig,
  onConfigChange,
  wrongWordReminders,
  onWrongWordsChange,
  parentRedemptions = [],
  isOpen = false,
  onOpenChange,
  onGoHome,
  onReturnToStudy,
}) {
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [lastExamSummary, setLastExamSummary] = useState(null);
  const [lastVocabSummary, setLastVocabSummary] = useState(null);
  const [lastReadingSummary, setLastReadingSummary] = useState(null);

  const setStudentType = (type) => {
    onConfigChange({ ...parentConfig, studentType: type });
  };

  const assignTask = (taskId) => {
    onConfigChange({ ...parentConfig, activeTask: taskId });
  };

  /** 上載完成後一鍵指派並返回學生端 */
  const assignAndReturn = useCallback((taskId) => {
    assignTask(taskId);
    onOpenChange?.(false);
    onReturnToStudy?.();
  }, [parentConfig, onConfigChange, onOpenChange, onReturnToStudy]);

  /** 詞表上載完成 — OCR 提取詞彙並同步學生端 */
  const handleVocabUploadComplete = useCallback((uploadMeta) => {
    const reminders = getReviewReminders();
    const { config, pack } = applyVocabListUpload(parentConfig, uploadMeta, reminders);
    onConfigChange(config);
    setLastVocabSummary({
      dictationCount: pack.dictationCount,
      prestudyCount: pack.prestudyCount,
      imageCount: uploadMeta.fileCount ?? 1,
      fileName: uploadMeta.fileName,
      at: new Date().toLocaleString('zh-HK'),
    });
    setVocabModalOpen(false);
  }, [parentConfig, onConfigChange]);

  /** 試卷上載完成 — 生成孿生題並同步學生端 */
  const handleExamUploadComplete = useCallback((uploadMeta) => {
    const { config, variants } = applyExamPaperUpload(parentConfig, uploadMeta);
    onConfigChange(config);
    setLastExamSummary({
      quizCount: variants.quizBank.length,
      sspaCount: variants.sspaBank.length,
      sentenceCount: variants.sentenceBank?.length ?? 1,
      imageCount: uploadMeta.fileCount ?? variants.imageCount ?? 1,
      fileName: uploadMeta.fileName,
      at: new Date().toLocaleString('zh-HK'),
    });
    setExamModalOpen(false);
  }, [parentConfig, onConfigChange]);

  /** 閱讀理解上載完成 — 生成理解題並同步學生端 */
  const handleReadingUploadComplete = useCallback((uploadMeta) => {
    let variants;
    onConfigChange((prev) => {
      const result = applyReadingPaperUpload(prev, uploadMeta);
      variants = result.variants;
      return result.config;
    });
    setLastReadingSummary({
      questionCount: variants.questionCount,
      passageCount: variants.passageCount ?? variants.imageCount ?? 1,
      imageCount: uploadMeta.fileCount ?? variants.imageCount ?? 1,
      passageTitle: variants.passageTitle,
      fileName: uploadMeta.fileName,
      sharedGlobally: Boolean(variants.globalIngest?.added),
      totalSharedPassages: variants.globalIngest?.totalPassages ?? 0,
      at: new Date().toLocaleString('zh-HK'),
    });
    setReadingModalOpen(false);
  }, [onConfigChange]);

  const handleRemoveUploadImage = useCallback(async (imageId) => {
    const reminders = getReviewReminders();
    const next = await removeUploadImage(parentConfig, imageId, { wrongWordReminders: reminders });
    onConfigChange(next);
    if (!next.assignedContent?.uploadImages?.length) {
      setLastVocabSummary(null);
      setLastExamSummary(null);
      setLastReadingSummary(null);
    }
  }, [parentConfig, onConfigChange]);

  const handleClearAllUploads = useCallback(() => {
    onConfigChange(clearAllUploads(parentConfig));
    setLastVocabSummary(null);
    setLastExamSummary(null);
    setLastReadingSummary(null);
  }, [parentConfig, onConfigChange]);

  const hasAiAnalysis = Boolean(parentConfig.aiAnalysis);
  const aiQuizCount = parentConfig.assignedContent.quizBank?.length || 0;
  const aiSspaCount = parentConfig.assignedContent.sspaBank?.length || 0;
  const aiReadingCount = parentConfig.assignedContent.readingBank?.length || 0;

  const backdropRef = useRef(null);
  const panelScrollRef = useRef(null);

  /** 展開時鎖定背景頁面，避免手機滑動穿透 */
  useBodyScrollLock(isOpen);

  /** 遮罩層阻擋 touchmove，防止滑動傳至背景頁 */
  useEffect(() => {
    const el = backdropRef.current;
    if (!isOpen || !el) return undefined;
    const blockTouch = (e) => e.preventDefault();
    el.addEventListener('touchmove', blockTouch, { passive: false });
    return () => el.removeEventListener('touchmove', blockTouch);
  }, [isOpen]);

  /** 面板內 touchmove 不冒泡，避免部分 Android 瀏覽器 scroll chaining */
  useEffect(() => {
    const el = panelScrollRef.current;
    if (!isOpen || !el) return undefined;
    const stopBubble = (e) => e.stopPropagation();
    el.addEventListener('touchmove', stopBubble, { passive: true });
    return () => el.removeEventListener('touchmove', stopBubble);
  }, [isOpen]);

  const togglePanel = useCallback(() => {
    onOpenChange?.(!isOpen);
  }, [isOpen, onOpenChange]);

  const collapsePanel = useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  return (
    <>
      <VocabUploadModal
        open={vocabModalOpen}
        onClose={() => setVocabModalOpen(false)}
        onComplete={handleVocabUploadComplete}
      />
      <ExamUploadModal
        open={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        onComplete={handleExamUploadComplete}
      />
      <ReadingUploadModal
        open={readingModalOpen}
        onClose={() => setReadingModalOpen(false)}
        onComplete={handleReadingUploadComplete}
      />

      {isOpen && (
        <button
          ref={backdropRef}
          type="button"
          aria-label="收起家長端後台"
          className="lg:hidden fixed inset-0 z-[67] bg-black/35 backdrop-blur-[1px] touch-none"
          onClick={() => onOpenChange?.(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[68] border-t-4 border-slate-700 shadow-2xl pb-[env(safe-area-inset-bottom,0px)] flex flex-col-reverse touch-manipulation">
        <div className="relative flex items-stretch bg-slate-800 text-white min-h-[3.25rem] lg:min-h-[3.5rem] shrink-0">
          <button
            type="button"
            onClick={() => {
              onReturnToStudy?.();
            }}
            className="hidden lg:flex shrink-0 px-4 py-3.5 bg-amber-600/90 hover:bg-amber-500 text-sm font-black text-slate-900 border-r border-slate-700"
          >
            ↑ 學習區
          </button>
          <button
            type="button"
            onClick={togglePanel}
            aria-expanded={isOpen}
            aria-label={isOpen ? '收起家長端後台' : '展開家長端後台'}
            className="relative flex-1 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 lg:py-3.5 hover:bg-slate-700 transition-colors min-w-0"
          >
            <div className="flex items-center gap-3 text-left min-w-0 flex-1">
              <span className="text-xl sm:text-2xl shrink-0">👨‍👩‍👦</span>
              <BilingualLabel
                zh="家長端後台"
                en="Parent Dashboard"
                size="parent"
                hideEnOnMobile
                className="text-white [&_span:last-child]:text-slate-400"
              />
            </div>
            <span className="shrink-0 bg-slate-600 px-3 py-2 rounded-xl text-sm font-black text-white">
              {isOpen ? '收起 ▼' : '展開 ▲'}
            </span>
          </button>
        </div>

        <div
          ref={panelScrollRef}
          className={`xh-parent-panel-scroll overflow-y-auto overscroll-contain xh-scroll xh-scroll--dark transition-all duration-300 ease-in-out bg-slate-900 text-slate-100 min-h-0
            ${isOpen
              ? 'max-h-[min(680px,calc(100vh-10rem-env(safe-area-inset-bottom,0px)))] lg:max-h-[min(680px,72vh)] opacity-100 touch-pan-y'
              : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}
        >
          {isOpen && (
            <button
              type="button"
              onClick={collapsePanel}
              aria-label="收起家長端後台（頂部）"
              className="sticky top-0 z-10 w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-slate-800 border-b border-slate-700 hover:bg-slate-700 active:bg-slate-600 transition-colors text-left"
            >
              <span className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span className="text-xl">👨‍👩‍👦</span>
                家長端後台
              </span>
              <span className="shrink-0 bg-slate-600 px-4 py-2 rounded-xl text-sm font-black text-white">
                收起 ▲
              </span>
            </button>
          )}
          <p className="text-center py-3 px-4 bg-slate-800/80 border-b border-slate-700 text-sm text-slate-300">
            <span className="font-bold text-amber-300">設定即時同步至學生端</span>
            <span className="hidden sm:inline text-slate-500"> · Syncs instantly to student view</span>
          </p>

          <div className="p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10 max-w-3xl mx-auto">
            {/* ① 上載 — 家長最常用，置頂且加大 */}
            <section className="space-y-4">
              <SectionHeading step="①" zh="上載教材" en="Upload Materials" size="lg" />

              <button
                type="button"
                onClick={() => setVocabModalOpen(true)}
                className="w-full p-5 sm:p-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400 transition active:scale-[0.98] text-center"
              >
                <span className="block text-2xl mb-2">📷</span>
                <BilingualLabel
                  zh="上載新詞表"
                  en="Upload Word List"
                  size="xl"
                  center
                  hideEnOnMobile
                  className="[&_span:first-child]:text-white [&_span:last-child]:text-emerald-100"
                />
                <span className="block text-sm font-medium mt-3 opacity-95 leading-relaxed">
                  拍照或選檔 → 自動辨識詞彙 → 同步默書與預習
                </span>
              </button>

              {lastVocabSummary && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-xl p-4 leading-relaxed text-center">
                    ✅ 已完成 · 默書 {lastVocabSummary.dictationCount} 詞 · 預習 {lastVocabSummary.prestudyCount} 詞
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => assignAndReturn('prestudy')}
                      className="py-3 px-4 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-2 border-emerald-300 transition active:scale-[0.98]"
                    >
                      📚 指派課文預習 →
                    </button>
                    <button
                      type="button"
                      onClick={() => assignAndReturn('dictation')}
                      className="py-3 px-4 rounded-xl font-black text-sm bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-500 transition active:scale-[0.98]"
                    >
                      🎧 前往默書特訓 →
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setReadingModalOpen(true)}
                className="w-full p-5 sm:p-6 rounded-2xl bg-indigo-700 hover:bg-indigo-600 text-white border-2 border-indigo-400 transition active:scale-[0.98] text-center"
              >
                <span className="block text-2xl mb-2">📖</span>
                <BilingualLabel
                  zh="上載閱讀文章"
                  en="Upload Reading Passage"
                  size="xl"
                  center
                  hideEnOnMobile
                  className="[&_span:first-child]:text-white [&_span:last-child]:text-indigo-100"
                />
                <span className="block text-sm font-medium mt-3 opacity-95 leading-relaxed">
                  拍照或選檔 → 自動出閱讀理解題
                </span>
              </button>

              {lastReadingSummary && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-indigo-300 bg-indigo-950/40 border border-indigo-800 rounded-xl p-4 leading-relaxed text-center">
                    ✅ 已完成 · {lastReadingSummary.questionCount} 道理解題
                  </p>
                  <button
                    type="button"
                    onClick={() => assignAndReturn('reading')}
                    className="w-full py-3 px-4 rounded-xl font-black text-sm bg-indigo-500 hover:bg-indigo-400 text-white border-2 border-indigo-300 transition active:scale-[0.98]"
                  >
                    📖 指派閱讀理解 →
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setExamModalOpen(true)}
                className="w-full p-5 sm:p-6 rounded-2xl bg-rose-700 hover:bg-rose-600 text-white border-2 border-rose-400 transition active:scale-[0.98] text-center"
              >
                <span className="block text-2xl mb-2">📋</span>
                <BilingualLabel
                  zh="上載試卷"
                  en="Upload Exam Paper"
                  size="xl"
                  center
                  hideEnOnMobile
                  className="[&_span:first-child]:text-white [&_span:last-child]:text-rose-100"
                />
                <span className="block text-sm font-medium mt-3 opacity-95 leading-relaxed">
                  拍照或選檔 → 生成類似練習題
                </span>
              </button>

              {lastExamSummary && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-rose-300 bg-rose-950/40 border border-rose-800 rounded-xl p-4 leading-relaxed text-center">
                    ✅ 已完成 · 測驗 {lastExamSummary.quizCount} 題 · 呈分試 {lastExamSummary.sspaCount} 題
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => assignAndReturn('quiz')}
                      className="py-3 px-4 rounded-xl font-black text-sm bg-rose-500 hover:bg-rose-400 text-white border-2 border-rose-300 transition active:scale-[0.98]"
                    >
                      📝 開始測驗練習 →
                    </button>
                    <button
                      type="button"
                      onClick={() => assignAndReturn('sspa')}
                      className="py-3 px-4 rounded-xl font-black text-sm bg-rose-700 hover:bg-rose-600 text-white border-2 border-rose-500 transition active:scale-[0.98]"
                    >
                      📋 呈分試特訓 →
                    </button>
                  </div>
                </div>
              )}

              <UploadStatusPanel
                parentConfig={parentConfig}
                onRemoveImage={handleRemoveUploadImage}
                onClearAllUploads={handleClearAllUploads}
              />
            </section>

            {/* ② 指派科目 — 大按鈕、兩欄 */}
            <section>
              <SectionHeading step="②" zh="指派溫習科目" en="Assign Study Task" size="lg" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TASK_OPTIONS.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => assignTask(task.id)}
                    className={`p-4 sm:p-5 rounded-xl text-center flex flex-col items-center justify-center gap-2 border-2 transition-all min-h-[5.5rem]
                      ${parentConfig.activeTask === task.id
                        ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-md scale-[1.02]'
                        : 'bg-slate-800 border-slate-600 hover:border-slate-400'}`}
                  >
                    <span className="text-2xl">{task.icon}</span>
                    <span className={`text-sm sm:text-base font-black leading-snug ${parentConfig.activeTask === task.id ? 'text-slate-900' : 'text-white'}`}>
                      {task.zh}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* ③ 學生類型 — 精簡兩欄 */}
            <section>
              <SectionHeading step="③" zh="學生類型" en="Student Profile" size="lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STUDENT_TYPE_OPTIONS.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all
                      ${parentConfig.studentType === type.id ? 'border-amber-400 bg-slate-800' : 'border-slate-700 hover:border-slate-500'}`}
                  >
                    <input
                      type="radio"
                      name="studentType"
                      checked={parentConfig.studentType === type.id}
                      onChange={() => setStudentType(type.id)}
                      className="accent-amber-400 w-5 h-5 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-base font-black text-white">{type.zh}</p>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{type.descZh}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* ④ 同步狀態 — 可折疊，預設收起 */}
            <section>
              <details className="rounded-xl border border-slate-600 bg-slate-800 overflow-hidden group">
                <summary className="cursor-pointer p-4 text-base font-black text-slate-200 hover:bg-slate-750 list-none flex items-center justify-between gap-2">
                  <span>④ 同步狀態與題庫概覽</span>
                  <span className="text-slate-500 text-sm group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 space-y-3 text-sm border-t border-slate-700 pt-3">
                  <p><span className="text-slate-400">AI 分析</span> · {hasAiAnalysis ? '✅ 已生成' : '尚未上載試卷'}</p>
                  <p><span className="text-slate-400">AI 題目</span> · 測驗 {aiQuizCount} · 呈分試 {aiSspaCount} · 閱讀 {aiReadingCount}</p>
                  {parentConfig.assignedContent.vocabUploadSession && (
                    <p><span className="text-slate-400">詞表</span> · 默書 {parentConfig.assignedContent.vocabByTask?.dictation?.length ?? 0} · 預習 {parentConfig.assignedContent.vocabByTask?.prestudy?.length ?? 0}</p>
                  )}
                  <p><span className="text-slate-400">常錯字</span> · {wrongWordReminders?.length ?? 0} 個</p>
                  {(parentRedemptions?.length ?? 0) > 0 && (
                    <div className="pt-2 border-t border-slate-700 space-y-2">
                      <p className="text-amber-300 font-bold">🎁 學生兌換通知</p>
                      {parentRedemptions.slice(0, 3).map((r) => (
                        <p key={r.id} className="text-amber-200/90 text-sm flex items-center gap-1 flex-wrap">
                          <span>{r.at} · 「{r.name}」−</span>
                          <CoinAmount amount={r.cost} size="xs" className="text-amber-300" />
                        </p>
                      ))}
                    </div>
                  )}
                  {(wrongWordReminders?.length ?? 0) > 0 && (
                    <p className="text-rose-300">
                      {wrongWordReminders.slice(0, 5).map((w) => `${w.tc}(×${w.count})`).join('、')}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onWrongWordsChange?.(clearWrongWords())}
                    className="text-sm text-slate-500 underline hover:text-slate-300"
                  >
                    清除常錯字記錄
                  </button>
                </div>
              </details>
            </section>

            {/* ⑤ 成績分析 — 置底，寬屏全寬 */}
            <ParentAnalyticsPanel parentConfig={parentConfig} />

            {/* 底部收起列 — 捲到底也可一鍵收起 */}
            <button
              type="button"
              onClick={collapsePanel}
              aria-label="收起家長端後台（底部）"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-800 border-2 border-slate-600 hover:bg-slate-700 active:bg-slate-600 transition-colors text-sm font-black text-slate-200"
            >
              <span>收起家長端後台</span>
              <span aria-hidden>▼</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
