/**
 * 閱讀理解做題面板 — 同一篇文章內 3–5 道題的動態索引切換
 *
 * · currentQuestionIndex 綁定 passageQuestions[index]，絕不硬編碼 [0]
 * · 答對後自動跳下一題；全部完成後顯示「完成特訓」金幣結算
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShieldFeedback, CorrectCelebration, ProgressBar } from '../PracticeFeedback';
import { BilingualLabel } from '../BilingualLabel';
import ReadingChoiceOptions from './ReadingChoiceOptions';
import CoinIcon from '../CoinIcon';
import { COIN_REWARD } from '../aiEngine';
import { sanitizePassageForDisplay, sanitizeOptionsForDisplay } from '../readingDisplayGuard';
import { stripOptionLetterPrefix } from '../readingOptionPrefixCleaner';
import { getReadingLineClasses, getMutedTextClass } from '../readableStyles';
import AnswerResultEffect, { useAnswerResultFx } from '../AnswerResultEffect';
import ContributorHonorBadge from '../ContributorHonorBadge';
import { useContributorBadge } from '../useContributorBadge';

/** 答對後自動跳下一題的延遲（毫秒）— 留時間顯示金幣動畫 */
const AUTO_ADVANCE_MS = 1400;

export default function ReadingComprehensionPanel({
  /** 同一篇文章的 3–5 道題（已按 questionNumberInPassage 排序） */
  passageQuestions = [],
  isSEN = false,
  isNCS = false,
  isNight = false,
  theme,
  dt = (t) => t,
  speakHint,
  getAiHint,
  getAiHintEn,
  speaking = false,
  onMarkComplete,
  onAwardCoins,
  onPassageFinished,
  onGoHome,
  onRecordWrong,
  onRecordWrongAnswer,
  analytics,
  uploadScopeLabel,
  reminderBlock = null,
  reshuffledBanner = null,
  taskHeader = null,
  engineMeta = null,
  aiBadge = null,
}) {
  /** 動態題目索引 — 0 = 第 1 題，1 = 第 2 題，2 = 第 3 題 */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempt, setAttempt] = useState(null);
  const [showShield, setShowShield] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [correctAnswerLabel, setCorrectAnswerLabel] = useState('');
  const { fx: answerFx, trigger: triggerAnswerFx } = useAnswerResultFx();
  const [passageFinished, setPassageFinished] = useState(false);
  const [totalCoinsEarned, setTotalCoinsEarned] = useState(0);

  const questionStartedAt = useRef(Date.now());
  const autoAdvanceTimer = useRef(null);

  const totalQuestions = passageQuestions.length;

  /** 當前正在作答的題目物件 — 絕不使用 passageQuestions[0] 硬編碼 */
  const currentQuestion = useMemo(
    () => passageQuestions[currentQuestionIndex] ?? null,
    [passageQuestions, currentQuestionIndex],
  );
  const contributorBadge = useContributorBadge(currentQuestion);

  /** 換題或換文章時重置作答狀態 */
  const resetAttemptState = useCallback(() => {
    setAttempt(null);
    setShowShield(false);
    setShowCelebrate(false);
    setCompleted(false);
    setExplanation('');
    setCorrectAnswerLabel('');
  }, []);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setPassageFinished(false);
    setTotalCoinsEarned(0);
    resetAttemptState();
  }, [passageQuestions[0]?.passageId, resetAttemptState]);

  useEffect(() => {
    questionStartedAt.current = Date.now();
    resetAttemptState();
  }, [currentQuestion?.id, resetAttemptState]);

  useEffect(() => () => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
  }, []);

  /** 進度條：第 (index+1) / total 題 */
  const progressCurrent = currentQuestionIndex + 1;
  const progressTotal = Math.max(totalQuestions, 1);

  const displayPassage = useMemo(
    () => sanitizePassageForDisplay(currentQuestion?.passage ?? []),
    [currentQuestion?.passage],
  );

  const goToNextQuestion = useCallback(() => {
    resetAttemptState();
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }
    setPassageFinished(true);
    onPassageFinished?.();
  }, [currentQuestionIndex, totalQuestions, resetAttemptState, onPassageFinished]);

  const scheduleAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      setShowCelebrate(false);
      goToNextQuestion();
    }, AUTO_ADVANCE_MS);
  }, [goToNextQuestion]);

  /**
   * 學生點擊 A/B/C/D — 記錄正誤 → 自動下一題或結算
   */
  const handleOptionClick = useCallback((selectedIndex, cleanedLabel) => {
    if (!currentQuestion || completed || showShield || passageFinished) return;

    const correctIndex = currentQuestion.correctIndex ?? 0;
    const displayOptions = sanitizeOptionsForDisplay(currentQuestion.options);
    const rawOptions = displayOptions.length >= 3 ? displayOptions : currentQuestion.options;
    const readingCorrectAnswer = stripOptionLetterPrefix(
      rawOptions[correctIndex] ?? currentQuestion.options[correctIndex] ?? '',
    );
    const readingCorrectExplain = currentQuestion.explanation || `正確答案：${readingCorrectAnswer}`;

    setAttempt(selectedIndex);
    const durationMs = Date.now() - questionStartedAt.current;
    const isCorrect = selectedIndex === correctIndex;
    const questionId = String(currentQuestion.id ?? `reading-q${currentQuestionIndex + 1}`);

    if (analytics) {
      analytics.recordQuestionAttempt({
        taskId: 'reading',
        questionId,
        isCorrect,
        durationMs,
        wrongOptionIndex: !isCorrect ? selectedIndex : undefined,
        wrongOptionLabel: cleanedLabel,
        stem: currentQuestion.question,
        wrongAnswer: cleanedLabel,
        correctAnswer: readingCorrectAnswer,
        hint: currentQuestion.explanation || currentQuestion.hint,
        uploadScope: uploadScopeLabel,
      });
    } else if (!isCorrect) {
      onRecordWrongAnswer?.({
        taskId: 'reading',
        questionId,
        stem: currentQuestion.question,
        wrongAnswer: cleanedLabel,
        correctAnswer: readingCorrectAnswer,
        hint: currentQuestion.explanation || currentQuestion.hint,
        hesitationMs: durationMs,
        uploadScope: uploadScopeLabel,
      });
    }

    if (isCorrect) {
      triggerAnswerFx('correct');
      setShowShield(false);
      setExplanation(readingCorrectExplain);
      setShowCelebrate(true);
      setCompleted(true);
      onMarkComplete?.(currentQuestion.id);
      onAwardCoins?.(COIN_REWARD);
      setTotalCoinsEarned((prev) => prev + COIN_REWARD);

      /** 最後一題：延遲後進入「完成特訓」結算；否則自動跳下一題 */
      if (currentQuestionIndex >= totalQuestions - 1) {
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = setTimeout(() => {
          setShowCelebrate(false);
          setPassageFinished(true);
          onPassageFinished?.();
        }, AUTO_ADVANCE_MS);
      } else {
        scheduleAutoAdvance();
      }
    } else {
      triggerAnswerFx('wrong');
      setShowCelebrate(false);
      setShowShield(true);
      setCorrectAnswerLabel(readingCorrectAnswer);
      setExplanation(readingCorrectExplain);
      onRecordWrong?.({
        tc: cleanedLabel.length <= 2 ? cleanedLabel : cleanedLabel.slice(0, 2),
        context: currentQuestion.question,
        relatedCorrect: readingCorrectAnswer,
        taskId: 'reading',
      });
    }
  }, [
    analytics,
    completed,
    currentQuestion,
    currentQuestionIndex,
    onAwardCoins,
    onMarkComplete,
    onPassageFinished,
    onRecordWrong,
    onRecordWrongAnswer,
    passageFinished,
    scheduleAutoAdvance,
    showShield,
    totalQuestions,
    triggerAnswerFx,
    uploadScopeLabel,
  ]);

  const handleWrongNext = useCallback(() => {
    goToNextQuestion();
  }, [goToNextQuestion]);

  const handleCelebrateDismiss = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setShowCelebrate(false);
    goToNextQuestion();
  }, [goToNextQuestion]);

  const [hoveredLine, setHoveredLine] = useState(null);
  const [readingPinnedLine, setReadingPinnedLine] = useState(null);
  const activeReadingLine = hoveredLine ?? readingPinnedLine;
  const passageScrollRef = useRef(null);

  useEffect(() => {
    passageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestion?.passageId, displayPassage.length]);

  if (!currentQuestion && !passageFinished) {
    return (
      <div className="text-center py-12">
        <p className={`font-bold ${getMutedTextClass(isNight)}`}>{dt('未能載入閱讀題目，請重新上載文章。')}</p>
      </div>
    );
  }

  /** 全部完成 — 完成特訓結算畫面 */
  if (passageFinished) {
    return (
      <div className="space-y-5 pb-4 animate-[fadeSlideIn_0.4s_ease-out]">
        {taskHeader}
        <div className={`rounded-2xl border-2 flex flex-col items-center gap-4 py-8 px-5 w-full
          ${isNight ? 'border-emerald-600 bg-emerald-950/40' : 'border-emerald-400 bg-emerald-50'}`}>
          <span className="text-5xl shrink-0" aria-hidden>🏆</span>
          <BilingualLabel
            zh="完成特訓！"
            en="Training Complete!"
            size={isSEN ? 'lg' : 'md'}
            center
            className={`font-black w-full ${isNight ? '[&_span:first-child]:text-emerald-100' : '[&_span:first-child]:text-emerald-800'}`}
          />
          <BilingualLabel
            zh={`本次閱讀理解共完成 ${totalQuestions} 題`}
            en={`You finished all ${totalQuestions} reading questions`}
            size={isSEN ? 'md' : 'sm'}
            center
            className="font-bold w-full"
          />
          <div className={`flex flex-col items-center gap-2 w-full font-black text-lg
            ${isNight ? 'text-amber-300' : 'text-amber-700'}`}>
            <CoinIcon size={isSEN ? 'md' : 'sm'} glow spin />
            <BilingualLabel
              zh={`能量金幣 +${totalCoinsEarned || COIN_REWARD * totalQuestions}`}
              en={`+${totalCoinsEarned || COIN_REWARD * totalQuestions} effort coins`}
              size={isSEN ? 'md' : 'sm'}
              center
            />
          </div>
          <button
            type="button"
            onClick={() => (onGoHome ? onGoHome() : onPassageFinished?.())}
            className={`block w-full max-w-sm shrink-0 rounded-xl font-black border-2 transition mt-1
              ${isNight
                ? 'text-emerald-100 bg-emerald-800 hover:bg-emerald-700 border-emerald-600'
                : 'text-emerald-800 bg-emerald-200 hover:bg-emerald-300 border-emerald-400'}
              ${isSEN ? 'py-3 text-base' : 'py-2.5 text-sm'}`}
          >
            <BilingualLabel zh="返回首頁繼續練習" en="Back to Home" size={isSEN ? 'md' : 'sm'} center />
          </button>
        </div>
      </div>
    );
  }

  const displayOptions = sanitizeOptionsForDisplay(currentQuestion.options);
  const rawOptions = displayOptions.length >= 3 ? displayOptions : currentQuestion.options;
  const passageScrollClass = isSEN
    ? 'min-h-[320px] max-h-[min(520px,58vh)]'
    : 'min-h-[280px] max-h-[min(460px,52vh)]';
  const passageTextClass = isSEN ? 'text-lg leading-[1.9]' : 'text-base leading-[1.8]';

  return (
    <div className="space-y-5 transition-all duration-300">
      <AnswerResultEffect type={answerFx} isSEN={isSEN} isNight={isNight} />
      {reshuffledBanner}
      {taskHeader}
      {engineMeta}
      {aiBadge}

      {currentQuestion.passageTitle && (
        <p className={`text-center font-bold ${isNight ? 'text-amber-200' : theme?.accent} ${isSEN ? 'text-sm' : 'text-xs'}`}>
          📚 {dt(currentQuestion.passageTitle)}
          {currentQuestion.genre ? ` · ${dt(currentQuestion.genre)}` : ''}
        </p>
      )}

      {/* 動態進度條 — 隨 currentQuestionIndex 更新 */}
      <ProgressBar current={progressCurrent} total={progressTotal} isSEN={isSEN} isNight={isNight} />
      <BilingualLabel
        zh={`${dt(`📝 第 ${progressCurrent} / ${progressTotal} 題`)}${completed ? dt(' · 答對了！即將前往下一題…') : ''}`}
        en={`Question ${progressCurrent} / ${progressTotal}${completed ? ' · Correct! Next question…' : ''}`}
        size={isSEN ? 'md' : 'sm'}
        center
        className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-sm' : 'text-xs')}`}
      />

      <BilingualLabel
        zh={dt('💡 滑鼠移到句子可逐行高亮；點一下可固定該行')}
        en="Hover to highlight a line; click to pin it"
        size={isSEN ? 'md' : 'sm'}
        center
        className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-sm' : 'text-xs')}`}
      />

      <section className="flex flex-col gap-2 min-w-0">
        <BilingualLabel
          zh={dt('📄 閱讀文章')}
          en="Reading Passage"
          size={isSEN ? 'md' : 'sm'}
          center
          className={`font-black ${isNight ? 'text-amber-200' : theme?.accent}`}
        />
        {displayPassage.length > 6 && (
          <BilingualLabel
            zh={dt(`共 ${displayPassage.length} 行 · 向上捲動可閱讀開首`)}
            en={`${displayPassage.length} lines total · scroll up for the beginning`}
            size={isSEN ? 'sm' : 'xs'}
            center
            className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-sm' : 'text-xs')}`}
          />
        )}
        <div
          ref={passageScrollRef}
          className={`rounded-xl border-2 overflow-y-auto xh-scroll w-full space-y-2
            ${passageScrollClass}
            ${isNight ? 'xh-scroll--dark' : 'xh-scroll'}
            ${theme?.hint} ${isSEN ? 'p-5' : 'p-4'} ${passageTextClass} font-bold`}
        >
          {displayPassage.map((line, idx) => (
            <p
              key={`${currentQuestion.id}-line-${idx}`}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredLine(idx)}
              onMouseLeave={() => setHoveredLine(null)}
              onClick={() => setReadingPinnedLine((prev) => (prev === idx ? null : idx))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setReadingPinnedLine((prev) => (prev === idx ? null : idx));
                }
              }}
              className={`rounded-lg transition-all duration-200 px-3 py-3 cursor-pointer select-none
                ${activeReadingLine === idx ? 'scale-[1.01]' : ''}
                ${getReadingLineClasses(isNight, activeReadingLine, idx)}`}
            >
              {dt(line)}
            </p>
          ))}
        </div>
      </section>

      <section className={`flex flex-col gap-3 min-w-0 pt-1 border-t-2 border-dashed ${isNight ? 'border-stone-600/50' : 'border-stone-300/60'}`}>
        <BilingualLabel
          zh={dt('❓ 選擇答案')}
          en="Choose Your Answer"
          size={isSEN ? 'md' : 'sm'}
          center
          className={`font-black ${isNight ? 'text-amber-200' : theme?.accent}`}
        />
        <p className={`text-center font-black leading-relaxed ${isNight ? 'text-stone-100' : 'text-slate-800'} ${isSEN ? 'text-lg' : 'text-base'}`}>
          {dt(currentQuestion.question)}
        </p>
        {!showShield && (
          <div className="flex justify-center">
            <ContributorHonorBadge badge={contributorBadge} isSEN={isSEN} isNight={isNight} />
          </div>
        )}
        <ReadingChoiceOptions
          key={currentQuestion.id}
          options={rawOptions}
          correctIndex={currentQuestion.correctIndex}
          attempt={attempt}
          completed={completed}
          showShield={showShield}
          isNight={isNight}
          isSEN={isSEN}
          dt={dt}
          onChoose={handleOptionClick}
        />
      </section>

      {showShield && (
        <ShieldFeedback
          correctAnswer={dt(correctAnswerLabel)}
          explanation={explanation ? dt(explanation) : ''}
          hint={currentQuestion.hint || currentQuestion.explanation || getAiHint?.()}
          hintEn={getAiHintEn?.()}
          onNext={handleWrongNext}
          onSpeakHint={() => speakHint?.(
            currentQuestion.hint || currentQuestion.explanation || getAiHint?.(),
            getAiHintEn?.(),
          )}
          speakingHint={speaking}
          isSEN={isSEN}
          isNCS={isNCS}
          isNight={isNight}
        />
      )}
      {showCelebrate && (
        <CorrectCelebration
          explanation={explanation}
          coinAmount={COIN_REWARD}
          onDismiss={handleCelebrateDismiss}
          isSEN={isSEN}
          isNight={isNight}
        />
      )}
      {reminderBlock}
    </div>
  );
}
