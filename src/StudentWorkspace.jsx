import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useColorMode } from './colorMode';
import { getTheme } from './studentThemes';
import { useQuestionEngine } from './useQuestionEngine';
import { shuffleSentencePool, getCompletedIds, shuffleQuestionOptions, unmarkQuestionComplete } from './questionEngineCore';
import { COIN_REWARD } from './aiEngine';
import { ShieldFeedback, CorrectCelebration, ProgressBar } from './PracticeFeedback';
import AnswerResultEffect, { useAnswerResultFx } from './AnswerResultEffect';
import {
  getChoiceOptionClasses,
  getQuizOptionWordClasses,
  getQuizOptionButtonSize,
  getQuizOptionLengthTier,
  getQuestionBodyClass,
  getSentencePoolChipClasses,
  getMutedTextClass,
  getTextLinkClass,
} from './readableStyles';
import DictationMode from './DictationMode';
import { BilingualLabel } from './BilingualLabel';
import WrongWordReminder from './WrongWordReminder';
import WrongAnswerReviewPanel from './WrongAnswerReviewPanel';
import HintSpeakButton from './HintSpeakButton';
import SpeechPlayButton from './SpeechPlayButton';
import { getWordSpeakText, getVocabMeaning, getVocabChar, getVocabRomanization, isSimplifiedScript } from './useSpeech';
import { getDisplayText, makeDisplayText } from './chineseScript';
import { useSpeechContext } from './SpeechContext';
import { useVoicePreferences, getHintSpeakPayload } from './VoicePreferencesContext';
import ReadingComprehensionPanel from './components/ReadingComprehensionPanel';
import InlineReadingPassage from './components/InlineReadingPassage';
import { stripOptionLetterPrefix } from './readingOptionPrefixCleaner';
import { useLearningAnalytics } from './context/LearningAnalyticsContext';
import { TASK_HEADERS } from './studentI18n';
import { getVocabDecomposition } from './vocabDecomposition';
import { hasRealVocabMeaning } from './vocabHints';
import {
  getPrestudyIdiomVocabList,
  saveStudiedWords,
  loadStudiedWords,
  loadPreviewWords,
  toPrestudyCardList,
  buildDictationListFromStudiedWords,
  swapPrestudyVocab,
  resolveIdiomCardWord,
  resolveIdiomCardMeaning,
  getPrestudyCardMeaning,
  previewWordToVocabItem,
  PRESTUDY_IDIOM_COUNT,
  PREVIEW_WORDS_STORAGE_KEY,
  STUDIED_WORDS_STORAGE_KEY,
} from './prestudyDictationBridge';
import { VOCAB_UPLOADED_EVENT } from './dataPipelineKeys.js';
import ContributorHonorBadge from './ContributorHonorBadge';
import { useContributorBadge } from './useContributorBadge';

const QUIZ_TASKS = new Set(['quiz', 'sspa', 'sentence', 'reading']);

/**
 * 學生端工作區 — parentConfig 驅動 + 護盾答題 + 金幣 + 常錯字提醒
 */
export default function StudentWorkspace({
  parentConfig,
  language = 'zh-HK',
  theme: themeProp,
  onAwardCoins,
  wrongWordReminders = [],
  wrongAnswerReviews = [],
  onRecordWrong,
  onRecordWrongAnswer,
  onClearWrongAnswers,
  onGoHome,
  onSwitchTask,
}) {
  const { studentType, activeTask, assignedContent, aiAnalysis } = parentConfig;
  const theme = themeProp ?? getTheme(studentType);

  /** AI 覆蓋題（僅取必要欄位，避免整包 assignedContent 引用抖動） */
  const aiOverrides = useMemo(() => ({
    quiz: assignedContent.quiz,
    quizBank: assignedContent.quizBank,
    sspa: assignedContent.sspa,
    sspaBank: assignedContent.sspaBank,
    sentence: assignedContent.sentence,
    sentenceBank: assignedContent.sentenceBank,
    readingBank: assignedContent.readingBank,
    readingUploadSession: assignedContent.readingUploadSession,
    aiUploadSession: assignedContent.aiUploadSession,
    vocabByTask: assignedContent.vocabByTask,
    vocabUploadSession: assignedContent.vocabUploadSession,
  }), [
    assignedContent.quiz,
    assignedContent.quizBank,
    assignedContent.sspa,
    assignedContent.sspaBank,
    assignedContent.sentence,
    assignedContent.sentenceBank,
    assignedContent.readingBank,
    assignedContent.readingUploadSession,
    assignedContent.aiUploadSession,
    assignedContent.vocabByTask,
    assignedContent.vocabUploadSession,
  ]);

  /** 大容量題庫引擎 — Fisher-Yates 洗牌 + 今日去重 */
  const questionEngine = useQuestionEngine(activeTask, {
    wrongWordReminders,
    aiOverrides,
  });
  const {
    currentItem,
    vocabDeck,
    markComplete,
    advanceToNext,
    reshuffled,
    sessionProgress,
    readingPassageProgress,
    todayProgress,
    index: questionIndex,
    isEmpty: deckEmpty,
    rebuildDeck,
    totalPool,
    pool: taskPool,
    deck,
    setIndex: setQuestionIndex,
  } = questionEngine;
  const contributorBadge = useContributorBadge(currentItem);
  const isSEN = studentType === 'sen';
  const useSimplified = isSimplifiedScript(language, studentType);
  const isNCS = studentType === 'ncs';
  const dt = useMemo(() => makeDisplayText(language, studentType), [language, studentType]);

  const analytics = useLearningAnalytics();
  /** 單題計時 — 供家長端卡頓分析 */
  const questionStartedAt = useRef(Date.now());
  const uploadScopeLabel = parentConfig.uploadLabel
    ?? (assignedContent.readingUploadSession ? '閱讀理解上載' : null)
    ?? (assignedContent.aiUploadSession ? '試卷上載' : null)
    ?? (assignedContent.vocabUploadSession ? '詞表上載' : null);

  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, [activeTask, currentItem?.id]);

  /** 默書 / 預習完成一詞 — 同步家長成績分析 */
  const handleVocabStudyProgress = useCallback((taskId, vocabId, stem) => {
    markComplete(vocabId);
    analytics?.recordStudyProgress?.({
      taskId,
      questionId: String(vocabId),
      stem,
      uploadScope: uploadScopeLabel || undefined,
    });
  }, [markComplete, analytics, uploadScopeLabel]);

  const { meaningVoiceLang } = useVoicePreferences();
  const { speak, speaking, speechBusy } = useSpeechContext();

  const speakHint = useCallback((hint, hintEn) => {
    const { text, lang } = getHintSpeakPayload(hint, hintEn, meaningVoiceLang);
    speak(text, { lang, kind: 'meaning' });
  }, [meaningVoiceLang, speak]);

  const getAiHint = useCallback(() => {
    return aiAnalysis?.scaffoldHint
      || currentItem?.aiHint
      || currentItem?.hint
      || '仔細閱讀題目，留意形近字的差異。';
  }, [aiAnalysis, currentItem]);

  const getAiHintEn = () => aiAnalysis?.scaffoldHintEn || null;

  // ── 通用選擇題狀態（quiz / sspa / reading） ──
  const [attempt, setAttempt] = useState(null);
  const [showShield, setShowShield] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [correctAnswerLabel, setCorrectAnswerLabel] = useState('');

  // ── 句子重組狀態 ──
  const [sentenceWords, setSentenceWords] = useState([]);
  const [unscrambledOrder, setUnscrambledOrder] = useState([]);
  const [sentenceCompleted, setSentenceCompleted] = useState(false);

  const [reminderDismissed, setReminderDismissed] = useState(false);
  const { fx: answerFx, trigger: triggerAnswerFx } = useAnswerResultFx();

  const resetPractice = useCallback(() => {
    setAttempt(null);
    setShowShield(false);
    setShowCelebrate(false);
    setCompleted(false);
    setExplanation('');
    setCorrectAnswerLabel('');
    setSentenceCompleted(false);
  }, []);

  /** 答對慶祝關閉 → 標記完成、抽下一題、重置作答狀態 */
  const handleCelebrateDismiss = useCallback(() => {
    setShowCelebrate(false);
    advanceToNext();
    resetPractice();
  }, [advanceToNext, resetPractice]);

  /** 測驗／呈分試／重組句子 — 答對後自動跳下一題（與閱讀理解一致） */
  const AUTO_ADVANCE_MS = 1400;
  const autoAdvanceTimerRef = useRef(null);
  useEffect(() => {
    if (!showCelebrate || activeTask === 'reading') return undefined;
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleCelebrateDismiss();
    }, AUTO_ADVANCE_MS);
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [showCelebrate, activeTask, handleCelebrateDismiss]);

  const buildShuffledSentencePool = useCallback((sent) => {
    if (!sent) return [];
    const pool = sent.words || sent.correctOrder || [];
    const correctOrder = sent.correctOrder || sent.words || [];
    return shuffleSentencePool(pool, correctOrder);
  }, []);

  // 切換科目或引擎換題時重置作答 UI
  useEffect(() => {
    resetPractice();
    setReminderDismissed(false);
    const sent = activeTask === 'sentence' ? currentItem : null;
    setSentenceWords(buildShuffledSentencePool(sent));
    setUnscrambledOrder([]);
  }, [activeTask, currentItem?.id, resetPractice, buildShuffledSentencePool]);

  const awardOnce = () => onAwardCoins?.(COIN_REWARD);

  const recordWrongAttempt = useCallback((wrongMeta, reviewMeta) => {
    if (wrongMeta?.tc) {
      onRecordWrong?.({
        tc: wrongMeta.tc,
        sc: wrongMeta.sc,
        context: wrongMeta.context,
        relatedCorrect: wrongMeta.relatedCorrect,
        taskId: activeTask,
      });
    }
    if (reviewMeta) {
      onRecordWrongAnswer?.({
        ...reviewMeta,
        taskId: activeTask,
      });
    }
  }, [activeTask, onRecordWrong, onRecordWrongAnswer]);

  /** 選擇題作答 — 錯誤記錄常錯字並顯示正確答案；同步至家長分析 */
  const handleChoice = (answer, correctAnswer, explain, wrongMeta, reviewMeta, correctExplain) => {
    if (completed || showShield) return;
    setAttempt(answer);
    const durationMs = Date.now() - questionStartedAt.current;
    const isCorrect = answer === correctAnswer;
    const questionId = String(reviewMeta?.questionId ?? currentItem?.id ?? '');

    if (analytics) {
      analytics.recordQuestionAttempt({
        taskId: activeTask,
        questionId,
        isCorrect,
        durationMs,
        wrongOptionIndex: !isCorrect ? answer : undefined,
        wrongOptionLabel: reviewMeta?.wrongAnswer,
        stem: reviewMeta?.stem,
        wrongAnswer: reviewMeta?.wrongAnswer,
        correctAnswer: reviewMeta?.correctAnswer,
        hint: reviewMeta?.hint,
        uploadScope: uploadScopeLabel,
      });
    } else if (!isCorrect) {
      onRecordWrongAnswer?.({
        taskId: activeTask,
        questionId,
        ...reviewMeta,
        hesitationMs: durationMs,
        uploadScope: uploadScopeLabel,
      });
    }

    if (isCorrect) {
      triggerAnswerFx('correct');
      setShowShield(false);
      setExplanation(explain || '');
      setShowCelebrate(true);
      setCompleted(true);
      markComplete(currentItem?.id);
      awardOnce();
    } else {
      triggerAnswerFx('wrong');
      setShowCelebrate(false);
      setShowShield(true);
      setCorrectAnswerLabel(
        reviewMeta?.correctAnswer != null ? String(reviewMeta.correctAnswer) : String(correctAnswer),
      );
      setExplanation(correctExplain || explain || '');
      recordWrongAttempt(wrongMeta, analytics ? null : reviewMeta);
    }
  };

  const handleWrongNext = () => {
    advanceToNext();
    resetPractice();
  };

  const vocabList = vocabDeck;

  /** 監聽家長 OCR 上載寫入的 localStorage，即時刷新預習／默書詞表 */
  const [vocabStorageRevision, setVocabStorageRevision] = useState(0);
  useEffect(() => {
    const bump = () => setVocabStorageRevision((n) => n + 1);
    const onStorage = (e) => {
      if (e.key === PREVIEW_WORDS_STORAGE_KEY || e.key === STUDIED_WORDS_STORAGE_KEY) bump();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(VOCAB_UPLOADED_EVENT, bump);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(VOCAB_UPLOADED_EVENT, bump);
    };
  }, []);

  /** 課文預習 — 優先 localStorage 上載新詞 → 家長 config → 共享池（全部正規化） */
  const hasUploadedPreview = Boolean(loadPreviewWords()?.length);
  const basePrestudyVocabList = useMemo(() => {
    const fromStorage = loadPreviewWords();
    if (fromStorage?.length) return fromStorage;
    const uploaded = assignedContent.vocabByTask?.prestudy;
    if (uploaded?.length) return toPrestudyCardList(uploaded);
    return getPrestudyIdiomVocabList(PRESTUDY_IDIOM_COUNT);
  }, [assignedContent.vocabByTask?.prestudy, vocabStorageRevision]);

  const basePrestudyListKey = basePrestudyVocabList.map((v) => v.id).join('|');
  const [prestudyListOverride, setPrestudyListOverride] = useState(null);
  const prestudyVocabList = prestudyListOverride ?? basePrestudyVocabList;
  const prestudyUsesSessionPool = !loadPreviewWords()?.length
    && !assignedContent.vocabByTask?.prestudy?.length;

  useEffect(() => {
    setPrestudyListOverride(null);
  }, [basePrestudyListKey]);

  const handleSwapPrestudyVocab = useCallback((vocab) => {
    const result = swapPrestudyVocab(vocab.id, prestudyVocabList, {
      persistSession: prestudyUsesSessionPool,
    });
    if (!result.swapped) return;
    if (result.oldId) unmarkQuestionComplete('prestudy', result.oldId);
    setPrestudyListOverride(result.list);
  }, [prestudyVocabList, prestudyUsesSessionPool]);

  /** 默書特訓 — 讀取 starship_last_studied_words（上載或預習完成後寫入） */
  const linkedStudiedWords = useMemo(
    () => (activeTask === 'dictation' ? loadStudiedWords() : null),
    [activeTask, vocabStorageRevision],
  );

  const linkedDictationList = useMemo(() => {
    if (!linkedStudiedWords?.length) return null;
    return buildDictationListFromStudiedWords(linkedStudiedWords);
  }, [linkedStudiedWords]);

  const dictationVocabList = linkedDictationList ?? vocabList;

  const handlePrestudyComplete = useCallback((items) => {
    saveStudiedWords(items);
  }, []);
  const quiz = activeTask === 'quiz' && Array.isArray(currentItem?.options) ? currentItem : null;
  const sspa = activeTask === 'sspa' && Array.isArray(currentItem?.options) ? currentItem : null;
  const reading = activeTask === 'reading' && Array.isArray(currentItem?.passage) ? currentItem : null;
  const sentence = activeTask === 'sentence' && Array.isArray(currentItem?.words) ? currentItem : null;
  const correctOrder = sentence?.correctOrder || sentence?.words || [];

  /** 閱讀理解 — 同一篇文章內多道題（按題號排序） */
  const readingPassageQuestions = useMemo(() => {
    if (activeTask !== 'reading') return [];

    const passageId = currentItem?.passageId ?? reading?.passageId;
    if (!passageId) return reading ? [reading] : [];

    const questionOrder = (q) => q.questionNumberInPassage
      ?? Number(String(q.id).match(/-q(\d+)$/i)?.[1])
      ?? 0;

    const grouped = taskPool
      .filter((q) => q.passageId === passageId)
      .sort((a, b) => questionOrder(a) - questionOrder(b))
      .map((q) => shuffleQuestionOptions({ ...q }, 'reading'));

    return grouped.length ? grouped : (reading ? [reading] : []);
  }, [activeTask, taskPool, currentItem?.passageId, reading]);

  const handleReadingPassageFinished = useCallback(() => {
    const passageId = currentItem?.passageId;
    if (passageId && deck.length) {
      let nextIndex = questionIndex;
      while (nextIndex < deck.length && deck[nextIndex]?.passageId === passageId) {
        nextIndex += 1;
      }
      if (nextIndex >= deck.length) {
        advanceToNext();
      } else {
        setQuestionIndex(nextIndex);
      }
    } else {
      advanceToNext();
    }
    resetPractice();
  }, [advanceToNext, resetPractice, currentItem?.passageId, deck, questionIndex, setQuestionIndex]);

  /** 選擇題 / 閱讀理解進度：第 1 題起算（sentence 重組在未完成前維持舊邏輯） */
  const progressCurrent = activeTask === 'sentence' && !(completed || sentenceCompleted)
    ? questionIndex
    : questionIndex + 1;
  const progressTotal = sessionProgress.total;

  /** 句子確認 — 錯誤護盾 / 正確金幣 */
  const checkSentence = () => {
    if (sentenceCompleted || showShield) return;
    const durationMs = Date.now() - questionStartedAt.current;
    const isCorrect =
      unscrambledOrder.length === correctOrder.length
      && unscrambledOrder.every((w, i) => w === correctOrder[i]);
    const questionId = String(currentItem?.id ?? `sentence-${questionIndex}`);
    const reviewMeta = {
      questionId,
      stem: dt('重組句子：請按正確語序排列'),
      wrongAnswer: unscrambledOrder.join(' / '),
      correctAnswer: correctOrder.join(' / '),
      hint: sentence?.hint || getAiHint(),
      hintEn: getAiHintEn(),
    };

    if (analytics) {
      analytics.recordQuestionAttempt({
        taskId: activeTask,
        questionId,
        isCorrect,
        durationMs,
        stem: reviewMeta.stem,
        wrongAnswer: reviewMeta.wrongAnswer,
        correctAnswer: reviewMeta.correctAnswer,
        hint: reviewMeta.hint,
        uploadScope: uploadScopeLabel,
      });
    }

    if (isCorrect) {
      triggerAnswerFx('correct');
      setShowShield(false);
      setExplanation(sentence?.explanation || `正確語序：${correctOrder.join(' / ')}`);
      setShowCelebrate(true);
      setSentenceCompleted(true);
      markComplete(currentItem?.id);
      awardOnce();
    } else {
      triggerAnswerFx('wrong');
      setShowCelebrate(false);
      setShowShield(true);
      setCorrectAnswerLabel(correctOrder.join(' / '));
      setExplanation(sentence?.explanation || `正確語序：${correctOrder.join(' / ')}`);
      recordWrongAttempt(
        { tc: '句子結構', context: '重組句子語序錯誤' },
        analytics ? null : reviewMeta,
      );
    }
  };

  const { isNight } = useColorMode();
  const questionBodyClass = getQuestionBodyClass(isNight, isSEN);

  const wrapWithReview = (content) => {
    if (!QUIZ_TASKS.has(activeTask)) return content;
    return (
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start w-full min-w-0">
        <div className="flex-1 min-w-0 w-full">{content}</div>
        <WrongAnswerReviewPanel
          items={wrongAnswerReviews}
          activeTask={activeTask}
          isSEN={isSEN}
          isNight={isNight}
          dt={dt}
          onSpeakHint={speakHint}
          speechBusy={speechBusy}
          onClearTask={() => onClearWrongAnswers?.(activeTask)}
        />
      </div>
    );
  };

  // ── 等待家長指派 ──
  if (!activeTask) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-5xl">📚</p>
        <BilingualLabel
          zh={dt('等候家長指派今日溫習')}
          en="Waiting for today's study task"
          size={isSEN ? 'lg' : 'md'}
          center
          className={`font-black ${theme.accent}`}
        />
        <BilingualLabel
          zh={dt('完成後內容會自動顯示在這裡')}
          en="Content will appear here once assigned"
          size={isSEN ? 'md' : 'sm'}
          center
          className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-base' : 'text-sm')}`}
        />
      </div>
    );
  }

  const feedbackBlock = (
    <>
      {showShield && (
        <ShieldFeedback
          correctAnswer={dt(correctAnswerLabel)}
          explanation={explanation ? dt(explanation) : ''}
          hint={activeTask === 'sentence'
            ? (sentence?.hint || getAiHint())
            : activeTask === 'reading'
              ? (reading?.hint || reading?.explanation || getAiHint())
              : getAiHint()}
          hintEn={getAiHintEn()}
          onNext={handleWrongNext}
          onSpeakHint={() => speakHint(
            activeTask === 'sentence' ? (sentence?.hint || getAiHint()) : getAiHint(),
            getAiHintEn(),
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
    </>
  );

  const reminderBlock = !reminderDismissed && (
    <WrongWordReminder
      reminders={wrongWordReminders}
      activeTask={activeTask}
      isSEN={isSEN}
      isNCS={isNCS}
      language={language}
      studentType={studentType}
      onDismiss={() => setReminderDismissed(true)}
    />
  );

  // ── 默書特訓：語音盲聽默寫 ──
  if (activeTask === 'dictation') {
    return (
      <div className="space-y-4 sm:space-y-6 transition-all duration-300">
        <TaskHeader
          title={dt('🎧 默書特訓 · 聽音默寫')}
          titleEn={TASK_HEADERS.dictation.titleEn}
          isSEN={isSEN}
          theme={theme}
          isNight={isNight}
        />
        {reshuffled && <DeckReshuffledBanner isSEN={isSEN} isNight={isNight} total={todayProgress.total} dt={dt} />}
        <QuestionEngineMeta todayProgress={todayProgress} isSEN={isSEN} isNight={isNight} dt={dt} />
        {parentConfig.uploadLabel && (
          <p className={`text-xs font-bold ${getMutedTextClass(isNight)} ${theme.accent}`}>
            {dt('詞表來源：')}{dt(parentConfig.uploadLabel)}{dt(`（共 ${vocabList.length} 詞）`)}
          </p>
        )}
        <DictationMode
          vocabList={dictationVocabList}
          studentType={studentType}
          language={language}
          isSEN={isSEN}
          isNCS={isNCS}
          theme={theme}
          onAwardCoins={onAwardCoins}
          onWordComplete={(id) => {
            const word = dictationVocabList.find((v) => v.id === id);
            const char = word ? getVocabChar(word, { language, studentType }) : '';
            handleVocabStudyProgress('dictation', id, char ? `默書：${char}` : '默書詞彙');
          }}
          linkedFromPrestudy={Boolean(linkedDictationList?.length)}
          linkedWordCount={linkedStudiedWords?.length ?? 0}
        />
        {reminderBlock}
      </div>
    );
  }

  // ── 課文預習：可見詞表 + 聽音 ──
  if (activeTask === 'prestudy') {
    return (
      <div className="space-y-4 sm:space-y-6 transition-all duration-300">
        <TaskHeader
          title={dt('🌱 課文預習 · 校本專屬詞彙')}
          titleEn={TASK_HEADERS.prestudy.titleEn}
          isSEN={isSEN}
          theme={theme}
          isNight={isNight}
        />
        {reshuffled && <DeckReshuffledBanner isSEN={isSEN} isNight={isNight} total={todayProgress.total} dt={dt} />}
        <QuestionEngineMeta todayProgress={todayProgress} isSEN={isSEN} isNight={isNight} dt={dt} />
        <BilingualLabel
          zh={dt(`預習詞表（核心詞彙 ${prestudyVocabList.length} 詞${hasUploadedPreview || assignedContent.vocabByTask?.prestudy?.length ? ' · 家長上載' : ' · 呈分試語意池'}）：`)}
          en={`Pre-study list (${prestudyVocabList.length} word${prestudyVocabList.length === 1 ? '' : 's'}${hasUploadedPreview || assignedContent.vocabByTask?.prestudy?.length ? ' · uploaded' : ' · exam vocab pool'}):`}
          size={isSEN ? 'md' : 'sm'}
          className={`font-bold ${isNight ? 'text-amber-200' : theme.accent}`}
        />
        <VocabCards
          vocabList={prestudyVocabList}
          isSEN={isSEN}
          isNCS={isNCS}
          theme={theme}
          isNight={isNight}
          studentType={studentType}
          language={language}
          onMarkRead={(vocabId) => {
            const word = prestudyVocabList.find((v) => v.id === vocabId);
            const char = word ? getVocabChar(word, { language, studentType }) : '';
            handleVocabStudyProgress('prestudy', vocabId, char ? `預習：${char}` : '課文預習詞彙');
          }}
          onSwapVocab={prestudyUsesSessionPool ? handleSwapPrestudyVocab : undefined}
          onSessionComplete={handlePrestudyComplete}
          onGoToDictation={onSwitchTask ? () => onSwitchTask('dictation') : undefined}
        />
        {reminderBlock}
      </div>
    );
  }

  // ── 單元測驗 ──
  if (activeTask === 'quiz') {
    if (!quiz) {
      return (
        <DeckEmptyRecovery
          isNight={isNight}
          isSEN={isSEN}
          dt={dt}
          totalPool={totalPool}
          onReload={rebuildDeck}
        />
      );
    }
    const correctWord = quiz.options.find((o) => o.key === quiz.correctKey)?.word;
    const correctExplain = quiz.options.find((o) => o.key === quiz.correctKey)?.detail || quiz.explanation;
    const quizStemClass = `text-center font-bold leading-relaxed mb-3 ${isNight ? 'text-stone-100' : 'text-slate-800'} ${isSEN ? 'text-2xl leading-loose' : 'text-lg'}`;
    return wrapWithReview(
      <div className="space-y-4 sm:space-y-6 transition-all duration-300">
        <AnswerResultEffect type={answerFx} isSEN={isSEN} isNight={isNight} />
        {reshuffled && <DeckReshuffledBanner isSEN={isSEN} isNight={isNight} total={todayProgress.total} dt={dt} />}
        <TaskHeader
          title={dt('📝 常考易混淆字形辨析')}
          titleEn={TASK_HEADERS.quiz.titleEn}
          isSEN={isSEN}
          theme={theme}
          isNight={isNight}
        />
        <QuestionEngineMeta todayProgress={todayProgress} isSEN={isSEN} isNight={isNight} size="lg" dt={dt} />
        {quiz.isAiGenerated && (
          <AiGeneratedBadge isSEN={isSEN} isNight={isNight} dt={dt} />
        )}
        <ProgressBar current={progressCurrent} total={progressTotal} isSEN={isSEN} isNight={isNight} />

        {Array.isArray(quiz.passage) && quiz.passage.length > 0 && (
          <InlineReadingPassage
            passage={quiz.passage}
            passageTitle={quiz.passageTitle}
            genre={quiz.genre}
            isSEN={isSEN}
            isNight={isNight}
            theme={theme}
            dt={dt}
          />
        )}

        <div className={`rounded-xl border-2 p-4 ${isNight ? 'border-stone-600 bg-stone-900/30' : 'border-stone-200 bg-white'} ${isSEN ? 'p-5' : 'p-4'}`}>
          <p className={quizStemClass}>{dt(quiz.text)}</p>
          {!showShield && (
            <div className={`p-4 rounded-xl border font-bold flex flex-wrap items-start justify-between gap-2 ${theme.hint} ${isSEN ? 'text-lg' : 'text-base'}`}>
              <div className="flex-1 leading-relaxed">
                <BilingualLabel zh={`💡 ${dt('字義提示：')}${dt(quiz.hint)}`} en="Meaning Hint" size={isSEN ? 'md' : 'sm'} />
                {quiz.hintEn && (
                  <p className={`text-sm mt-1 font-bold ${isNight ? 'text-purple-300' : 'text-purple-700'}`}>Eng: {quiz.hintEn}</p>
                )}
                <ContributorHonorBadge badge={contributorBadge} isSEN={isSEN} isNight={isNight} />
              </div>
              <HintSpeakButton
                onClick={() => speakHint(quiz.hint, quiz.hintEn)}
                disabled={speechBusy}
                isSEN={isSEN}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {quiz.options.map((opt) => {
            const isCorrect = opt.key === quiz.correctKey;
            const isSelected = attempt === opt.key;
            const optionTier = getQuizOptionLengthTier(opt.word);
            const maxLines = optionTier === 'long' ? 2 : 1;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={completed || showShield}
                onClick={() => handleChoice(opt.key, quiz.correctKey, opt.detail || quiz.explanation, {
                  tc: opt.word,
                  sc: opt.word,
                  context: quiz.text,
                  relatedCorrect: correctWord,
                }, {
                  questionId: String(currentItem?.id ?? `quiz-${questionIndex}`),
                  stem: quiz.text,
                  wrongAnswer: opt.word,
                  correctAnswer: correctWord,
                  hint: quiz.hint,
                  hintEn: quiz.hintEn,
                }, correctExplain)}
                className={`rounded-xl border-2 transition-all duration-300 flex flex-col justify-center text-center items-center
                  ${getQuizOptionButtonSize(isSEN, opt.word)}
                  ${getChoiceOptionClasses(isNight, { completed, isCorrect, isSelected, showShield })}`}
              >
                <span className={getQuizOptionWordClasses(isNight, isSEN, opt.word, maxLines)}>{dt(opt.word)}</span>
                <span className={`text-sm font-mono font-bold ${isNight ? 'text-amber-300/75' : 'opacity-60'}`}>{opt.key} {dt('選項')}<span className="block text-[9px] opacity-70">Option</span></span>
              </button>
            );
          })}
        </div>
        {feedbackBlock}
        {reminderBlock}
      </div>,
    );
  }

  // ── 呈分試 ──
  if (activeTask === 'sspa') {
    if (!sspa) {
      return (
        <DeckEmptyRecovery
          isNight={isNight}
          isSEN={isSEN}
          dt={dt}
          totalPool={totalPool}
          onReload={rebuildDeck}
        />
      );
    }
    const optionPinyin = sspa.optionsPinyin ?? [];
    const sspaCorrectAnswer = stripOptionLetterPrefix(sspa.options[sspa.correctIndex] ?? '');
    const sspaCorrectExplain = sspa.explanation || `正確答案：${sspaCorrectAnswer}`;
    return wrapWithReview(
      <div className="space-y-4 sm:space-y-6 transition-all duration-300">
        <AnswerResultEffect type={answerFx} isSEN={isSEN} isNight={isNight} />
        {reshuffled && <DeckReshuffledBanner isSEN={isSEN} isNight={isNight} total={todayProgress.total} dt={dt} />}
        <TaskHeader
          title={dt('🏆 畢業大考・校本詞彙強化測驗')}
          titleEn={TASK_HEADERS.sspa.titleEn}
          isSEN={isSEN}
          theme={theme}
          isNight={isNight}
        />
        <QuestionEngineMeta todayProgress={todayProgress} isSEN={isSEN} isNight={isNight} dt={dt} />
        {sspa.isAiGenerated && <AiGeneratedBadge isSEN={isSEN} isNight={isNight} dt={dt} />}
        <ProgressBar current={progressCurrent} total={progressTotal} isSEN={isSEN} isNight={isNight} />

        <div className={`${questionBodyClass} text-center ${isSEN ? '' : 'leading-relaxed'}`}>
          <p className="mb-3">Q{progressCurrent}. {dt(sspa.text)}</p>
          {!showShield && (
            <div className={`p-3 rounded-xl border font-bold flex flex-wrap items-start justify-between gap-2 ${theme.hint} ${isSEN ? 'text-base' : 'text-sm'}`}>
              <div className="flex-1">
                <p>💡 <strong>{dt('字義提示：')}</strong> {dt(sspa.hint)}</p>
                {sspa.hintEn && (
                  <span className={`block text-sm mt-1 ${isNight ? 'text-purple-300' : 'text-purple-700'}`}>
                    Eng: {sspa.hintEn}
                  </span>
                )}
                <ContributorHonorBadge badge={contributorBadge} isSEN={isSEN} isNight={isNight} />
              </div>
              <HintSpeakButton
                onClick={() => speakHint(sspa.hint, sspa.hintEn)}
                disabled={speechBusy}
                isSEN={isSEN}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sspa.options.map((opt, idx) => {
            const optLabel = stripOptionLetterPrefix(opt);
            const isCorrect = idx === sspa.correctIndex;
            const isSelected = attempt === idx;
            return (
              <button
                key={idx}
                type="button"
                disabled={completed || showShield}
                onClick={() => handleChoice(idx, sspa.correctIndex, opt.detail || sspaCorrectExplain, {
                  tc: optLabel.length <= 2 ? optLabel : optLabel.slice(0, 2),
                  context: sspa.text,
                  relatedCorrect: sspaCorrectAnswer,
                }, {
                  questionId: String(currentItem?.id ?? `sspa-${questionIndex}`),
                  stem: sspa.text,
                  wrongAnswer: optLabel,
                  correctAnswer: sspaCorrectAnswer,
                  hint: sspa.hint,
                  hintEn: sspa.hintEn,
                }, sspaCorrectExplain)}
                className={`w-full text-left rounded-xl border-2 transition-[background-color,border-color,transform,box-shadow] duration-300 ease-out
                  hover:shadow-md active:scale-[0.98] flex justify-between items-center font-bold
                  ${isSEN ? 'p-5 text-lg' : 'p-4 text-base'}
                  ${getChoiceOptionClasses(isNight, { completed, isCorrect, isSelected, showShield })}`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`font-mono text-sm font-bold shrink-0 ${isNight ? 'text-amber-300' : 'text-slate-500'}`}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {useSimplified ? (
                    <ruby className={isNight ? 'text-stone-50' : ''}>
                      {dt(optLabel)}
                      <rt className={`text-xs ${isNight ? 'text-rose-400' : 'text-red-500'}`}>{optionPinyin[idx] ?? ''}</rt>
                    </ruby>
                  ) : (
                    <span className={isNight ? 'text-stone-50' : 'text-slate-900'}>{optLabel}</span>
                  )}
                </div>
                {(completed || showShield) && isCorrect && (
                  <span className="shrink-0 ml-2 text-emerald-300">
                    ✨ {dt('答對了！')}<span className="block text-[9px] opacity-80">Correct!</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {feedbackBlock}
        {reminderBlock}
      </div>,
    );
  }

  // ── 重組句子 ──
  if (activeTask === 'sentence') {
    if (!sentence) {
      return (
        <DeckEmptyRecovery
          isNight={isNight}
          isSEN={isSEN}
          dt={dt}
          totalPool={totalPool}
          onReload={rebuildDeck}
        />
      );
    }
    const allPlaced = unscrambledOrder.length === correctOrder.length && sentenceWords.length === 0;
    return wrapWithReview(
      <div className="space-y-4 sm:space-y-6 transition-all duration-300">
        <AnswerResultEffect type={answerFx} isSEN={isSEN} isNight={isNight} />
        {reshuffled && <DeckReshuffledBanner isSEN={isSEN} isNight={isNight} total={todayProgress.total} dt={dt} />}
        <TaskHeader
          title={dt('🧩 句子結構排版特訓')}
          titleEn={TASK_HEADERS.sentence.titleEn}
          isSEN={isSEN}
          theme={theme}
          isNight={isNight}
        />
        <QuestionEngineMeta todayProgress={todayProgress} isSEN={isSEN} isNight={isNight} dt={dt} />
        {sentence.isAiGenerated && <AiGeneratedBadge isSEN={isSEN} isNight={isNight} dt={dt} />}
        <ProgressBar current={progressCurrent} total={progressTotal} isSEN={isSEN} isNight={isNight} />

        <BilingualLabel
          zh={dt('點擊詞語卡片組句，完成後按「確認句子」：')}
          en="Tap word cards to build a sentence, then tap Confirm:"
          size={isSEN ? 'md' : 'sm'}
          center
          className={`font-bold ${isNight ? 'text-amber-200' : theme.accent}`}
        />

        <div className={`w-full min-h-[80px] p-5 rounded-xl border-2 border-dashed flex flex-wrap gap-3 items-center ${theme.hint}`}>
          {unscrambledOrder.length === 0 && (
            <BilingualLabel
              zh={dt('請在下方點詞組裝...')}
              en="Tap words below to assemble..."
              size={isSEN ? 'md' : 'sm'}
              className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-base' : 'text-sm')}`}
            />
          )}
          {unscrambledOrder.map((word, idx) => (
            <span
              key={`${word}-${idx}`}
              onClick={() => {
                if (sentenceCompleted || showShield) return;
                setUnscrambledOrder((prev) => prev.filter((_, i) => i !== idx));
                setSentenceWords((prev) => [...prev, word]);
              }}
              className={`px-4 py-2 text-white rounded-xl font-black cursor-pointer transition border-2 ${theme.btn} ${isSEN ? 'text-lg' : 'text-sm'} ${sentenceCompleted ? 'opacity-60 cursor-default' : ''}`}
            >
              {dt(word)}
            </span>
          ))}
        </div>

        <div className={`flex flex-wrap justify-center mb-6 lg:mb-0 ${isSEN ? 'gap-4' : 'gap-3'}`}>
          {sentenceWords.map((word, idx) => (
            <button
              key={`${word}-${idx}`}
              type="button"
              disabled={sentenceCompleted || showShield}
              onClick={() => {
                if (showShield) return;
                setUnscrambledOrder((prev) => [...prev, word]);
                setSentenceWords((prev) => prev.filter((_, i) => i !== idx));
              }}
              className={`${getSentencePoolChipClasses(isNight, isSEN)} disabled:opacity-50`}
            >
              {dt(word)}
            </button>
          ))}
        </div>

        {allPlaced && !sentenceCompleted && !showShield && (
          <button
            type="button"
            onClick={checkSentence}
            className={`w-full rounded-xl font-black text-white transition ${theme.btn} border-2 ${isSEN ? 'py-4 text-lg' : 'py-3 text-base'}`}
          >
            <BilingualLabel zh={`✓ ${dt('確認句子')}`} en="Confirm Sentence" size={isSEN ? 'lg' : 'md'} center className="[&_span:last-child]:!text-white/80" />
          </button>
        )}

        {!sentenceCompleted && !showShield && unscrambledOrder.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSentenceWords(buildShuffledSentencePool(sentence));
              setUnscrambledOrder([]);
              setShowShield(false);
            }}
            className={`underline block mx-auto font-bold text-sm ${getTextLinkClass(isNight)}`}
          >
            <BilingualLabel zh={dt('重設句子')} en="Reset Sentence" size="sm" center />
          </button>
        )}
        {feedbackBlock}
        {reminderBlock}
      </div>,
    );
  }

  // ── 閱讀理解（動態題目索引 — ReadingComprehensionPanel） ──
  if (activeTask === 'reading') {
    if (!readingPassageQuestions.length && !reading) {
      const awaitingUploadQuestions = assignedContent.readingUploadSession
        && !(assignedContent.readingBank?.length);
      return (
        <div className="text-center py-12 space-y-4">
          <p className="text-4xl">{awaitingUploadQuestions ? '⚠️' : '📭'}</p>
          <p className={`font-bold ${getMutedTextClass(isNight)}`}>
            {dt(awaitingUploadQuestions
              ? '閱讀上載尚未生成題目，請重新按「📖 上載閱讀文章」並完成 AI 解析'
              : '今日題庫已練習完畢，正在重新洗牌…')}
          </p>
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className={`mx-auto block rounded-xl border-2 font-black transition-all
                ${isNight ? 'border-amber-500/60 bg-stone-800 text-amber-200 hover:bg-stone-700' : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'}
                ${isSEN ? 'px-6 py-3 text-base' : 'px-5 py-2.5 text-sm'}`}
            >
              {dt('🏠 返回首頁')}
            </button>
          )}
        </div>
      );
    }

    return wrapWithReview(
      <ReadingComprehensionPanel
        passageQuestions={readingPassageQuestions}
        isSEN={isSEN}
        isNCS={isNCS}
        isNight={isNight}
        theme={theme}
        dt={dt}
        speakHint={speakHint}
        getAiHint={getAiHint}
        getAiHintEn={getAiHintEn}
        speaking={speaking}
        onMarkComplete={markComplete}
        onAwardCoins={awardOnce}
        onPassageFinished={handleReadingPassageFinished}
        onGoHome={onGoHome}
        onRecordWrong={onRecordWrong}
        onRecordWrongAnswer={onRecordWrongAnswer}
        analytics={analytics}
        uploadScopeLabel={uploadScopeLabel}
        reminderBlock={reminderBlock}
        reshuffledBanner={reshuffled && (
          <DeckReshuffledBanner isSEN={isSEN} isNight={isNight} total={todayProgress.total} dt={dt} />
        )}
        taskHeader={(
          <TaskHeader
            title={dt('📖 閱讀理解 · 逐行聚焦')}
            titleEn={TASK_HEADERS.reading.titleEn}
            isSEN={isSEN}
            theme={theme}
            isNight={isNight}
          />
        )}
        engineMeta={<QuestionEngineMeta todayProgress={todayProgress} isSEN={isSEN} isNight={isNight} dt={dt} />}
        aiBadge={reading?.isAiGenerated ? (
          <AiGeneratedBadge isSEN={isSEN} isNight={isNight} dt={dt} />
        ) : assignedContent.readingUploadSession ? (
          <UploadedReadingBadge isSEN={isSEN} isNight={isNight} dt={dt} />
        ) : null}
      />,
    );
  }

  return null;
}

/** 題庫載入失敗 / 牌堆為空 — 自動重試並提供手動按鈕 */
function DeckEmptyRecovery({ isNight, isSEN, dt = (t) => t, totalPool = 0, onReload }) {
  const reloadAttempts = useRef(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (totalPool <= 0 || reloadAttempts.current >= 2) return;
    reloadAttempts.current += 1;
    setRetrying(true);
    onReload?.();
    const t = setTimeout(() => setRetrying(false), 800);
    return () => clearTimeout(t);
  }, [totalPool, onReload]);

  return (
    <div className="text-center py-12 space-y-4">
      {totalPool > 0 ? (
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-full border-2 animate-pulse
            ${isNight ? 'border-amber-500/60 bg-stone-800' : 'border-amber-300 bg-amber-50'}`}
          aria-hidden
        >
          <span className="text-2xl">🔀</span>
        </div>
      ) : (
        <p className="text-4xl">📭</p>
      )}
      <BilingualLabel
        zh={dt(totalPool > 0
          ? (retrying ? `正在洗牌題庫（第 ${reloadAttempts.current} 次）…` : '題庫載入中，請稍候…')
          : '暫無可用題目，請稍後再試')}
        en={totalPool > 0
          ? (retrying ? `Shuffling deck (attempt ${reloadAttempts.current})…` : 'Loading question deck…')
          : 'No questions available right now'}
        size={isSEN ? 'md' : 'sm'}
        center
        className={`font-bold ${getMutedTextClass(isNight)}`}
      />
      {totalPool > 0 && (
        <button
          type="button"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            onReload?.();
            setTimeout(() => setRetrying(false), 800);
          }}
          className={`mx-auto block rounded-xl border-2 font-black transition-all disabled:opacity-60
            ${isNight ? 'border-amber-500/60 bg-stone-800 text-amber-200 hover:bg-stone-700' : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'}
            ${isSEN ? 'px-6 py-3 text-base' : 'px-5 py-2.5 text-sm'}`}
        >
          <BilingualLabel zh={dt('🔄 重新載入題庫')} en="Reload Deck" size="sm" center />
        </button>
      )}
    </div>
  );
}

function DeckReshuffledBanner({ isSEN, isNight, total, dt = (t) => t }) {
  return (
    <BilingualLabel
      zh={dt(`🔁 今日 ${total} 題已全部完成！歷史快取已清空，題庫重新洗牌，繼續練習吧。`)}
      en={`All ${total} questions done today! Deck reshuffled — keep practising.`}
      size={isSEN ? 'md' : 'sm'}
      center
      className={`rounded-xl border-2 font-bold animate-[fadeSlideIn_0.35s_ease-out]
        ${isNight ? 'border-emerald-600/50 bg-emerald-950/40 [&_span:first-child]:text-emerald-200 [&_span:last-child]:text-emerald-400/80' : 'border-emerald-300 bg-emerald-50 [&_span:first-child]:text-emerald-800 [&_span:last-child]:text-emerald-600/80'}
        ${isSEN ? 'p-3' : 'p-2'}`}
    />
  );
}

/** 題庫引擎狀態 — 今日進度摘要 */
function QuestionEngineMeta({ todayProgress, isSEN, isNight, size = 'sm', dt = (t) => t }) {
  const sizeKey = size === 'lg' ? (isSEN ? 'md' : 'sm') : (isSEN ? 'sm' : 'sm');
  return (
    <BilingualLabel
      zh={`${dt(`今日已完成 ${todayProgress.completed}/${todayProgress.total} 題`)}${todayProgress.remaining > 0 ? dt(` · 本輪剩餘 ${todayProgress.remaining} 題未做`) : ''}`}
      en={`Completed ${todayProgress.completed}/${todayProgress.total} today${todayProgress.remaining > 0 ? ` · ${todayProgress.remaining} left this round` : ''}`}
      size={sizeKey}
      center
      className={`font-bold ${getMutedTextClass(isNight)}`}
    />
  );
}

function AiGeneratedBadge({ isSEN, isNight, dt = (t) => t }) {
  return (
    <BilingualLabel
      zh={dt('🤖 AI 高仿真相似錯題 · 針對家長上載試卷弱項生成')}
      en="AI similar questions · based on your uploaded weak areas"
      size={isSEN ? 'md' : 'sm'}
      center
      className={`rounded-xl border-2 font-bold animate-[fadeSlideIn_0.35s_ease-out]
        ${isNight ? 'border-indigo-500/50 bg-indigo-950/40 [&_span:first-child]:text-indigo-200 [&_span:last-child]:text-indigo-400/80' : 'border-indigo-200 bg-indigo-50 [&_span:first-child]:text-indigo-800 [&_span:last-child]:text-indigo-600/80'}
        ${isSEN ? 'p-3' : 'p-2'}`}
    />
  );
}

function UploadedReadingBadge({ isSEN, isNight, dt = (t) => t }) {
  return (
    <BilingualLabel
      zh={dt('📖 家長上載閱讀文章 · 校本專屬練習')}
      en="Parent-uploaded reading passage · school-specific practice"
      size={isSEN ? 'md' : 'sm'}
      center
      className={`rounded-xl border-2 font-bold animate-[fadeSlideIn_0.35s_ease-out]
        ${isNight ? 'border-sky-500/50 bg-sky-950/40 [&_span:first-child]:text-sky-200 [&_span:last-child]:text-sky-400/80' : 'border-sky-200 bg-sky-50 [&_span:first-child]:text-sky-800 [&_span:last-child]:text-sky-600/80'}
        ${isSEN ? 'p-3' : 'p-2'}`}
    />
  );
}

function TaskHeader({ title, titleEn, isSEN, theme, isNight = false }) {
  return (
    <div className={`flex flex-col items-center text-center border-b-2 pb-4 ${isNight ? 'border-stone-600' : 'border-stone-200'}`}>
      {titleEn ? (
        <BilingualLabel
          zh={title}
          en={titleEn}
          size={isSEN ? 'lg' : 'md'}
          center
          className={`font-black ${theme.accent} ${isSEN ? '[&_span:first-child]:!text-2xl [&_span:last-child]:!text-sm' : '[&_span:first-child]:!text-xl [&_span:last-child]:!text-xs'}`}
        />
      ) : (
        <h2 className={`font-black text-center ${theme.accent} ${isSEN ? 'text-2xl' : 'text-xl'}`}>{title}</h2>
      )}
    </div>
  );
}

function VocabCards({
  vocabList,
  isSEN,
  isNCS,
  theme,
  studentType,
  language = 'zh-HK',
  isNight = false,
  onMarkRead,
  onSwapVocab,
  onSessionComplete,
  onGoToDictation,
}) {
  const { wordVoiceLang, meaningVoiceLang } = useVoicePreferences();
  const { speak, speakingKind, loadingKind, speechBusy } = useSpeechContext();

  /** 單一來源：父層已從 localStorage / 家長 config 正規化，禁止再讀舊快取混入隨機詞 */
  const cardSourceList = vocabList;

  const vocabListKey = cardSourceList.map((v) => v.id).join('|');
  const [readIds, setReadIds] = useState(() => new Set());
  const [sessionSaved, setSessionSaved] = useState(false);
  const [swapBusyId, setSwapBusyId] = useState(null);

  useEffect(() => {
    if (!onMarkRead) {
      setReadIds(new Set());
      return;
    }
    const validIds = new Set(cardSourceList.map((v) => String(v.id)));
    const completed = getCompletedIds('prestudy')
      .map(String)
      .filter((id) => validIds.has(id));
    setReadIds(new Set(completed));
  }, [vocabListKey, onMarkRead, cardSourceList]);

  useEffect(() => {
    setSessionSaved(false);
  }, [vocabListKey]);

  const playWord = (vocab) => {
    speak(getWordSpeakText(vocab, wordVoiceLang), { lang: wordVoiceLang, kind: 'word' });
  };

  const playMeaning = (vocab) => {
    if (!hasRealVocabMeaning(vocab)) return;
    const m = getVocabMeaning(vocab, { voiceLang: meaningVoiceLang, studentType, language });
    if (!m?.text) return;
    speak(m.text, { lang: m.lang, kind: 'meaning' });
  };

  const markVocabRead = (vocab) => {
    const id = String(vocab.id);
    if (readIds.has(id)) return;
    setReadIds((prev) => new Set([...prev, id]));
    onMarkRead?.(vocab.id);
  };

  const readCount = [...readIds].filter((id) => cardSourceList.some((v) => String(v.id) === id)).length;
  const totalCount = cardSourceList.length;
  const allRead = totalCount > 0 && readCount >= totalCount;

  const handleSwapVocab = (vocab) => {
    if (!onSwapVocab || swapBusyId) return;
    setSwapBusyId(String(vocab.id));
    onSwapVocab(vocab);
    setReadIds((prev) => {
      const next = new Set(prev);
      next.delete(String(vocab.id));
      return next;
    });
    setSwapBusyId(null);
  };

  const handleFinishPrestudy = () => {
    if (sessionSaved) return;
    onSessionComplete?.(cardSourceList);
    setSessionSaved(true);
  };

  /** 字卡標題 — 固定綁定 item.word */
  const renderCardWord = (item) => {
    const word = resolveIdiomCardWord(item);
    if (!word) return '—';
    return getVocabChar({ ...item, word, tc: word }, { language, studentType });
  };

  /** 字卡解釋 — 僅渲染安全中文欄位，禁止 JSON 裸奔 */
  const renderCardMeaning = (item) => {
    if (!hasRealVocabMeaning(item)) return null;
    return getPrestudyCardMeaning(item) || resolveIdiomCardMeaning(item) || null;
  };

  return (
    <div className="flex flex-col gap-4">
      {totalCount > 0 && (
        <BilingualLabel
          zh={`已讀 ${readCount} / ${totalCount} 詞`}
          en={`Read ${readCount} / ${totalCount} words`}
          size={isSEN ? 'md' : 'sm'}
          className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-sm' : 'text-xs')}`}
        />
      )}
      {cardSourceList.map((vocab) => {
        const displayWord = renderCardWord(vocab);
        const displayMeaning = renderCardMeaning(vocab);
        const meaning = hasRealVocabMeaning(vocab)
          ? getVocabMeaning(vocab, { voiceLang: meaningVoiceLang, studentType, language })
          : null;
        const decomp = getVocabDecomposition(vocab);
        const isRead = readIds.has(String(vocab.id));
        return (
        <div
          key={vocab.id}
          className={`rounded-xl border-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between transition-all duration-300
            ${isSEN ? 'p-4 sm:p-5' : 'p-3 sm:p-4'}
            ${isRead
              ? (isNight
                ? 'bg-emerald-950/35 border-emerald-600/70 ring-2 ring-emerald-700/40'
                : 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200/80')
              : theme.hint}
            ${vocab.isReview && !isRead ? (isNight ? 'ring-2 ring-rose-500/70' : 'ring-2 ring-rose-200') : ''}`}
        >
          <div className="min-w-0 flex-1">
            {isRead && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded mb-1 inline-block
                ${isNight ? 'text-emerald-200 bg-emerald-900/50 border border-emerald-600' : 'text-emerald-700 bg-emerald-100 border border-emerald-300'}`}>
                <BilingualLabel zh={getDisplayText('✓ 已讀', { language, studentType })} en="Read" size="sm" center />
              </span>
            )}
            {vocab.isReview && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded mb-1 inline-block
                ${isNight ? 'text-rose-200 bg-rose-900/50 border border-rose-700' : 'text-rose-600 bg-rose-50'}`}>
                <BilingualLabel zh={getDisplayText('常錯復習', { language, studentType })} en="Review (often wrong)" size="sm" center />
              </span>
            )}
            <ruby className={`font-black ${isNight ? 'text-amber-100' : 'text-amber-950'} ${isSEN ? 'text-3xl' : 'text-2xl'}`}>
              {displayWord}
              <rt className={`text-sm font-mono block font-bold ${isNight ? 'text-sky-300' : 'text-sky-600'}`}>
                {getVocabRomanization(vocab, { language, studentType })}
              </rt>
            </ruby>
            {displayMeaning && (
            <p className={`mt-1.5 font-bold leading-relaxed ${isSEN ? 'text-base' : 'text-sm'} ${isNight ? 'text-stone-200' : 'text-slate-700'}`}>
              {displayMeaning}
            </p>
            )}
            {meaning && (meaning.hintEn || vocab.hintEn) && (
              <span className={`text-sm block mt-1.5 font-bold leading-relaxed ${isNight ? 'text-purple-300' : 'text-purple-700'}`}>
                Eng: {meaning.hintEn || vocab.hintEn}
              </span>
            )}
            {vocab.en && !(meaning.hintEn || vocab.hintEn) && (
              <span className={`text-sm block mt-1 font-bold ${isNight ? 'text-purple-300' : 'text-purple-700'}`}>
                Eng: {vocab.en}
              </span>
            )}
            {vocab.en && (meaning.hintEn || vocab.hintEn) && (
              <span className={`text-xs block mt-0.5 opacity-75 ${isNight ? 'text-purple-400/80' : 'text-purple-600/80'}`}>
                Word: {vocab.en}
              </span>
            )}
          </div>
          {decomp?.chars?.length > 0 && (
            <div className={`rounded-xl font-bold w-full sm:w-auto sm:shrink-0 border-2 flex flex-col gap-1.5
              ${isNight ? 'bg-stone-900 border-amber-600 text-stone-200' : 'bg-white border-amber-200 text-slate-800'}
              ${isSEN ? 'text-sm px-4 py-2' : 'text-xs px-3 py-1.5'}`}>
              <span>{getDisplayText('字形拆解：', { language, studentType })}</span>
              {decomp.chars.map(({ char, radical, body }) => (
                <div key={char} className="flex flex-wrap items-center gap-1">
                  <span className={`font-black text-base ${isNight ? 'text-amber-200' : 'text-amber-900'}`}>
                    {getDisplayText(char, { language, studentType })}
                  </span>
                  <span className={`font-black ${isSEN ? 'text-lg' : 'text-base'} ${isNight ? 'text-rose-400' : 'text-red-600'}`}>
                    {getDisplayText(radical, { language, studentType })}
                  </span>
                  <span className="opacity-70">+</span>
                  <span className={`font-black ${isSEN ? 'text-lg' : 'text-base'} ${isNight ? 'text-blue-400' : 'text-blue-600'}`}>
                    {getDisplayText(body, { language, studentType })}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:shrink-0">
            {!isRead && (
              <button
                type="button"
                onClick={() => markVocabRead(vocab)}
                className={`font-black transition-all active:scale-[0.98] rounded-full border-2
                  ${isNight
                    ? 'bg-emerald-800 hover:bg-emerald-700 border-emerald-500 text-emerald-50'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'}
                  ${isSEN ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5'}`}
              >
                <BilingualLabel
                  zh={getDisplayText('✓ 標記已讀', { language, studentType })}
                  en="Mark as read"
                  size={isSEN ? 'md' : 'sm'}
                  center
                />
              </button>
            )}
            <SpeechPlayButton
              label="🔊 聽詞"
              labelEn="Hear Word"
              loadingLabel="⏳ 讀取…"
              playingLabel="🔊 播放中"
              isLoading={loadingKind === 'word'}
              isPlaying={speakingKind === 'word'}
              disabled={speechBusy && loadingKind !== 'word' && speakingKind !== 'word'}
              onClick={() => playWord(vocab)}
              variant="pill"
              isSEN={isSEN}
              className={`text-white border-2 ${theme.btn}`}
            />
            {hasRealVocabMeaning(vocab) && (
            <SpeechPlayButton
              label="🔊 聽字義"
              labelEn="Hear Meaning"
              loadingLabel="⏳ 讀取…"
              playingLabel="🔊 播放中"
              isLoading={loadingKind === 'meaning'}
              isPlaying={speakingKind === 'meaning'}
              disabled={speechBusy && loadingKind !== 'meaning' && speakingKind !== 'meaning'}
              onClick={() => playMeaning(vocab)}
              variant="violet"
              isSEN={isSEN}
              className="rounded-full"
            />
            )}
            {onSwapVocab && (
              <button
                type="button"
                disabled={swapBusyId === String(vocab.id)}
                onClick={() => handleSwapVocab(vocab)}
                title={getDisplayText('太難或已讀過？換一個新詞', { language, studentType })}
                className={`font-black transition-all duration-300 active:scale-[0.98] rounded-full border-2
                  ${isNight
                    ? 'bg-stone-700 hover:bg-stone-600 border-stone-500 text-amber-100'
                    : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'}
                  ${isSEN ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5'}
                  ${swapBusyId === String(vocab.id) ? 'opacity-60' : ''}`}
              >
                <BilingualLabel
                  zh={getDisplayText('🔄 轉詞語', { language, studentType })}
                  en="Swap Word"
                  size={isSEN ? 'md' : 'sm'}
                  center
                  className={isNight ? '[&_span:last-child]:!text-amber-200/80' : '[&_span:last-child]:!text-stone-500'}
                />
              </button>
            )}
          </div>
        </div>
        );
      })}
      {totalCount > 0 && onSessionComplete && (
        <div
          className={`rounded-2xl border-2 p-4 space-y-3 text-center animate-[fadeSlideIn_0.35s_ease-out]
            ${isNight ? 'border-emerald-600/60 bg-emerald-950/35' : 'border-emerald-300 bg-emerald-50'}`}
        >
          <BilingualLabel
            zh={sessionSaved
              ? getDisplayText('✅ 溫習完成！詞語已同步至默書特訓', { language, studentType })
              : (allRead
                ? getDisplayText('🎯 全部讀畢！按下方完成溫習', { language, studentType })
                : getDisplayText('🎯 溫習夠了？隨時可按下方完成', { language, studentType }))}
            en={sessionSaved
              ? 'Pre-study saved — ready for dictation!'
              : (allRead ? 'All words read — tap below to finish' : 'Done reviewing? Tap below to finish anytime')}
            size={isSEN ? 'md' : 'sm'}
            center
            className={`font-black ${isNight ? 'text-emerald-200' : 'text-emerald-800'}`}
          />
          {!sessionSaved && (
            <button
              type="button"
              onClick={handleFinishPrestudy}
              className={`w-full rounded-xl font-black text-white border-2 bg-emerald-500 hover:bg-emerald-600 border-emerald-600 transition active:scale-[0.98] ${isSEN ? 'py-4 text-lg' : 'py-3 text-base'}`}
            >
              <BilingualLabel
                zh={getDisplayText('🏆 溫習完成 · 挑戰成功', { language, studentType })}
                en="Finish Pre-study · Success!"
                size={isSEN ? 'lg' : 'md'}
                center
              />
            </button>
          )}
          {sessionSaved && onGoToDictation && (
            <button
              type="button"
              onClick={onGoToDictation}
              className={`w-full rounded-xl font-black border-2 transition active:scale-[0.98]
                ${isNight ? 'bg-sky-700 hover:bg-sky-600 border-sky-500 text-sky-100' : 'bg-sky-500 hover:bg-sky-600 border-sky-600 text-white'}
                ${isSEN ? 'py-4 text-lg' : 'py-3 text-base'}`}
            >
              <BilingualLabel
                zh={getDisplayText('🎧 一鍵前往默書特訓', { language, studentType })}
                en="Go to Dictation Drill"
                size={isSEN ? 'lg' : 'md'}
                center
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
