import React, { useState, useCallback, useRef, useEffect } from 'react';
import { applyExamPaperUpload } from './examPaperGenerator';
import { applyVocabListUpload } from './vocabListGenerator';
import { getQuestionBankStats } from './mockDatabase';
import { recordWrongWord, getReviewReminders, clearWrongWords } from './wrongWordStore';
import { STUDENT_TYPE_OPTIONS, TASK_OPTIONS } from './parentI18n';
import { BilingualLabel, SectionHeading } from './BilingualLabel';
import ParentWeeklyReport from './ParentWeeklyReport';
import UploadStatusPanel from './UploadStatusPanel';
import { CoinAmount } from './CoinIcon';
import ExamUploadModal from './components/ExamUploadModal';
import VocabUploadModal from './components/VocabUploadModal';
import ReadingUploadModal from './components/ReadingUploadModal';
import { applyReadingPaperUpload } from './readingPaperGenerator';
import { clearAllUploads, removeUploadImage } from './uploadContentManager';
import ParentAnalyticsPanel from './components/parent/ParentAnalyticsPanel';
import { useLearningAnalytics } from './context/LearningAnalyticsContext';
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
    const updated = recordWrongWord({
      tc: '語', sc: '语', context: '形近錯別字 悟/語', relatedCorrect: '悟', taskId: 'quiz',
    });
    onWrongWordsChange?.(updated);
  }, [parentConfig, onConfigChange, onWrongWordsChange]);

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
      at: new Date().toLocaleString('zh-HK'),
    });
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
  const bankStats = getQuestionBankStats();
  const aiQuizCount = parentConfig.assignedContent.quizBank?.length || 0;
  const aiSspaCount = parentConfig.assignedContent.sspaBank?.length || 0;
  const aiReadingCount = parentConfig.assignedContent.readingBank?.length || 0;
  const analytics = useLearningAnalytics();
  const liveAiAnalysis = analytics?.snapshot?.aiAnalysis ?? parentConfig.aiAnalysis;

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
        <div className="relative flex items-stretch bg-slate-800 text-white min-h-[2.75rem] lg:min-h-[3rem] shrink-0">
          <button
            type="button"
            onClick={() => {
              onReturnToStudy?.();
            }}
            className="hidden lg:flex shrink-0 px-3 sm:px-4 py-3 bg-amber-600/90 hover:bg-amber-500 text-xs font-black text-slate-900 border-r border-slate-700"
          >
            ↑ 學習區
          </button>
          <button
            type="button"
            onClick={() => onOpenChange?.(!isOpen)}
            className="relative flex-1 flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 lg:py-3 hover:bg-slate-700 transition-colors min-w-0"
          >
            <div className="flex items-center gap-2 sm:gap-3 text-left min-w-0 flex-1">
              <span className="text-base sm:text-lg shrink-0">👨‍👩‍👦</span>
              <BilingualLabel
                zh="家長端後台"
                en="Parent Dashboard"
                size="sm"
                className="text-white [&_span:last-child]:hidden sm:[&_span:last-child]:block [&_span:last-child]:text-slate-400"
              />
            </div>
            <BilingualLabel
              zh={isOpen ? '收起' : '展開'}
              en={isOpen ? 'Collapse' : 'Expand'}
              size="sm"
              center
              className="shrink-0 bg-slate-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg [&_span:first-child]:text-white [&_span:last-child]:hidden sm:[&_span:last-child]:block [&_span:last-child]:text-slate-300"
            />
          </button>
        </div>

        <div
          ref={panelScrollRef}
          className={`xh-parent-panel-scroll overflow-y-auto overscroll-contain xh-scroll xh-scroll--dark transition-all duration-300 ease-in-out bg-slate-900 text-slate-100 min-h-0
            ${isOpen
              ? 'max-h-[min(560px,calc(100vh-11rem-env(safe-area-inset-bottom,0px)))] lg:max-h-[min(560px,58vh)] opacity-100 touch-pan-y'
              : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}
        >
          {isOpen && (
            <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700">
              <span className="text-sm font-black text-white">👨‍👩‍👦 家長端後台</span>
              <button
                type="button"
                onClick={() => onOpenChange?.(false)}
                className="shrink-0 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-black text-white"
              >
                收起
              </button>
            </div>
          )}
          <p className="text-center py-2 px-4 bg-slate-800/80 border-b border-slate-700 text-xs">
            <span className="font-bold text-amber-300">中文為主 · English shown alongside</span>
            <span className="text-slate-500 mx-2">|</span>
            <span className="text-slate-400">設定會即時同步至上方學生端 · Changes sync instantly to student view</span>
          </p>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
            {/* 操作區 — 選擇功能在上 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* ① 學生類型 */}
            <section className="text-center">
              <SectionHeading step="①" zh="推送學生類型" en="Set Student Profile Type" />
              <div className="space-y-2">
                {STUDENT_TYPE_OPTIONS.map((type) => (
                  <label
                    key={type.id}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer border-2 transition-all text-center
                      ${parentConfig.studentType === type.id ? 'border-amber-400 bg-slate-800' : 'border-slate-700 hover:border-slate-500'}`}
                  >
                    <input
                      type="radio"
                      name="studentType"
                      checked={parentConfig.studentType === type.id}
                      onChange={() => setStudentType(type.id)}
                      className="accent-amber-400 w-4 h-4 shrink-0"
                    />
                    <div className="min-w-0 w-full">
                      <BilingualLabel zh={type.zh} en={type.en} size="md" center />
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        {type.descZh}
                        <span className="block text-slate-600">{type.descEn}</span>
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* ② 指派任務 */}
            <section className="text-center">
              <SectionHeading step="②" zh="指派溫習科目" en="Assign Study Task" />
              <div className="grid grid-cols-2 gap-2">
                {TASK_OPTIONS.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => assignTask(task.id)}
                    className={`p-3 rounded-lg text-center flex flex-col items-center justify-center gap-1 border-2 transition-all
                      ${parentConfig.activeTask === task.id
                        ? 'bg-amber-500 border-amber-400 text-slate-900'
                        : 'bg-slate-800 border-slate-600 hover:border-slate-400'}`}
                  >
                    <span className="text-lg">{task.icon}</span>
                    <BilingualLabel
                      zh={task.zh}
                      en={task.en}
                      size="sm"
                      center
                      className={parentConfig.activeTask === task.id ? '[&_span:last-child]:text-slate-700' : '[&_span:last-child]:text-slate-500'}
                    />
                  </button>
                ))}
              </div>
            </section>

            {/* ③ 模擬上載 */}
            <section className="space-y-3 text-center">
              <SectionHeading step="③" zh="模擬 AI 上載與同步" en="Simulate AI Upload & Sync" />

              <button
                type="button"
                onClick={() => setVocabModalOpen(true)}
                className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400 transition active:scale-[0.98] text-center"
              >
                <BilingualLabel
                  zh="📷 上載新詞表"
                  en="Upload New Word List"
                  size="sm"
                  center
                  className="[&_span:first-child]:text-white [&_span:last-child]:text-emerald-100"
                />
                <span className="block text-[10px] font-normal mt-2 opacity-90 leading-snug">
                  拍照 / 選檔 → OCR 提取詞彙 → 同步默書 & 預習
                  <span className="block text-emerald-200/80">Multi-image · more pages = more vocab</span>
                </span>
              </button>

              {lastVocabSummary && (
                <p className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg p-2 leading-snug text-center">
                  ✅ {lastVocabSummary.at} · {lastVocabSummary.fileName}
                  <span className="block text-emerald-200/80">
                    {lastVocabSummary.imageCount} 張圖 · 默書 {lastVocabSummary.dictationCount} 詞 · 預習 {lastVocabSummary.prestudyCount} 詞
                  </span>
                </p>
              )}

              <button
                type="button"
                onClick={() => setReadingModalOpen(true)}
                className="w-full p-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white border-2 border-indigo-400 transition active:scale-[0.98] text-center"
              >
                <BilingualLabel
                  zh="📖 上載閱讀文章"
                  en="Upload Reading Passage"
                  size="sm"
                  center
                  className="[&_span:first-child]:text-white [&_span:last-child]:text-indigo-100"
                />
                <span className="block text-[10px] font-normal mt-2 opacity-90 leading-snug">
                  拍照 / 選檔 → AI 解析段落 → 同步閱讀理解
                  <span className="block text-indigo-200/80">Multi-image · 3 questions per page</span>
                </span>
              </button>

              {lastReadingSummary && (
                <p className="text-[10px] font-bold text-indigo-300 bg-indigo-950/40 border border-indigo-800 rounded-lg p-2 leading-snug text-center">
                  ✅ {lastReadingSummary.at} · {lastReadingSummary.fileName}
                  <span className="block text-indigo-200/80">
                    {lastReadingSummary.imageCount} 張圖 · {lastReadingSummary.questionCount} 題 · {lastReadingSummary.passageTitle}
                  </span>
                </p>
              )}

              <button
                type="button"
                onClick={() => setExamModalOpen(true)}
                className="w-full p-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white border-2 border-rose-400 transition active:scale-[0.98] text-center"
              >
                <BilingualLabel
                  zh="📋 上載試卷"
                  en="Upload Exam Paper"
                  size="sm"
                  center
                  className="[&_span:first-child]:text-white [&_span:last-child]:text-rose-100"
                />
                <span className="block text-[10px] font-normal mt-2 opacity-90 leading-snug">
                  拍照 / 選檔 → AI 解析 → 批量生成孿生類似題
                  <span className="block text-rose-200/80">
                    Multi-image · more pages = more quiz & SSPA items
                  </span>
                </span>
              </button>

              {lastExamSummary && (
                <p className="text-[10px] font-bold text-rose-300 bg-rose-950/40 border border-rose-800 rounded-lg p-2 leading-snug text-center">
                  ✅ {lastExamSummary.at} · {lastExamSummary.fileName}
                  <span className="block text-rose-200/80">
                    {lastExamSummary.imageCount} 張圖 · 測驗 {lastExamSummary.quizCount} 題 · 呈分試 {lastExamSummary.sspaCount} 題 · 句子 {lastExamSummary.sentenceCount} 題
                  </span>
                </p>
              )}

              <UploadStatusPanel
                parentConfig={parentConfig}
                onRemoveImage={handleRemoveUploadImage}
                onClearAllUploads={handleClearAllUploads}
              />

              <div className="p-3 rounded-lg bg-slate-800 border border-slate-600 space-y-2 text-xs text-center">
                <BilingualLabel zh="即時同步狀態" en="Live Sync Status" size="sm" center className="border-b border-slate-700 pb-2 block" />
                <p><span className="text-slate-400">AI 分析</span> {hasAiAnalysis ? '✅ 已生成' : '—'}</p>
                <p><span className="text-slate-400">AI 孿生測驗</span> {aiQuizCount} 題 · <span className="text-slate-400">呈分試</span> {aiSspaCount} 題 · <span className="text-slate-400">閱讀</span> {aiReadingCount} 題</p>
                {parentConfig.assignedContent.vocabUploadSession && (
                  <p><span className="text-slate-400">AI 詞表</span> 默{parentConfig.assignedContent.vocabByTask?.dictation?.length ?? 0} · 預{parentConfig.assignedContent.vocabByTask?.prestudy?.length ?? 0}</p>
                )}
                <p><span className="text-slate-400">本地題庫</span> 默{bankStats.dictation} · 預{bankStats.prestudy} · 測{bankStats.quiz} · 呈{bankStats.sspa} · 句{bankStats.sentence} · 閱{bankStats.reading}</p>
                <p><span className="text-amber-400/90">🌐 全港共享題庫</span> 四字詞 {bankStats.globalSharedIdioms ?? 0}（UGC +{bankStats.ugcIdioms ?? 0}）· 寫作手法 {bankStats.globalSharedMethods ?? 0}（UGC +{bankStats.ugcMethods ?? 0}）</p>
                <p><span className="text-slate-400">詞表方案</span> {parentConfig.uploadLabel ?? '—'}</p>
                <p><span className="text-slate-400">常錯字</span> {wrongWordReminders?.length ?? 0} 個</p>
                {(parentRedemptions?.length ?? 0) > 0 && (
                  <div className="pt-2 border-t border-slate-700 space-y-1">
                    <p className="text-amber-300 font-bold">🎁 學生兌換通知</p>
                    {parentRedemptions.slice(0, 3).map((r) => (
                      <p key={r.id} className="text-amber-200/90 text-[10px] leading-snug flex items-center justify-center gap-1 flex-wrap">
                        <span>{r.at} · 兌換「{r.name}」−</span>
                        <CoinAmount amount={r.cost} size="xs" className="text-amber-300" />
                      </p>
                    ))}
                  </div>
                )}
                {(wrongWordReminders?.length ?? 0) > 0 && (
                  <p className="text-rose-300 text-[10px]">
                    {wrongWordReminders.slice(0, 3).map((w) => `${w.tc}(×${w.count})`).join('、')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onWrongWordsChange?.(clearWrongWords())}
                  className="text-[10px] text-slate-500 underline hover:text-slate-300 mx-auto block"
                >
                  清除常錯字記錄 / Clear wrong-word log
                </button>
              </div>
            </section>

            {/* ④ AI 週報 */}
            <section className="text-center">
              <SectionHeading step="④" zh="AI 專家週報" en="AI Expert Weekly Report" />
              <ParentWeeklyReport aiAnalysis={liveAiAnalysis} />
            </section>
            </div>

            {/* 分析區 — 學生成績分析在下 */}
            <ParentAnalyticsPanel parentConfig={parentConfig} />
          </div>
        </div>
      </div>
    </>
  );
}
