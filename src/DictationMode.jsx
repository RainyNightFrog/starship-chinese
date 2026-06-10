import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { makeDisplayText } from './chineseScript';
import { BilingualLabel } from './BilingualLabel';
import {
  getVocabChar,
  getWordSpeakText,
  getVocabMeaning,
  getSpeechLangLabel,
} from './useSpeech';
import { useVoicePreferences } from './VoicePreferencesContext';
import { useSpeechContext } from './SpeechContext';
import DictationTimer from './DictationTimer';
import { COIN_REWARD } from './aiEngine';
import SpeechPlayButton from './SpeechPlayButton';
import { getMutedTextClass } from './readableStyles';
import { useColorMode } from './colorMode';

/**
 * 默書特訓 — 語音讀詞 + 字義提示 + 紙上默寫
 * 支援從課文預習自動載入剛溫習的 15 詞
 */
export default function DictationMode({
  vocabList,
  studentType,
  language = 'zh-HK',
  isSEN,
  theme,
  onAwardCoins,
  onComplete,
  /** 每完成一詞時回報題目 id（供題庫引擎歷史去重） */
  onWordComplete,
  /** 是否由課文預習詞彙自動對接載入 */
  linkedFromPrestudy = false,
  linkedWordCount = 0,
}) {
  const { wordVoiceLang, meaningVoiceLang } = useVoicePreferences();

  const {
    speak,
    speakSequence,
    cancel,
    speaking,
    speakingKind,
    loadingKind,
    speechBusy,
  } = useSpeechContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());

  const { isNight } = useColorMode();
  const dt = useMemo(() => makeDisplayText(language, studentType), [language, studentType]);
  const current = vocabList[currentIndex];
  const total = vocabList.length;
  const isLast = currentIndex >= total - 1;
  const allDone = completedIds.size >= total && total > 0;

  const meaning = useMemo(
    () => (current
      ? getVocabMeaning(current, { voiceLang: meaningVoiceLang, studentType, language, forDictation: true })
      : null),
    [current, meaningVoiceLang, studentType, language],
  );

  const playWordAndMeaning = useCallback(() => {
    if (!current) return;
    const wordText = getWordSpeakText(current, wordVoiceLang);
    const m = getVocabMeaning(current, { voiceLang: meaningVoiceLang, studentType, language, forDictation: true });

    speakSequence([
      { text: wordText, lang: wordVoiceLang, kind: 'word' },
      { text: m.text, lang: m.lang, kind: 'meaning' },
    ]);
  }, [current, speakSequence, studentType, language, wordVoiceLang, meaningVoiceLang]);

  const playWordOnly = useCallback(() => {
    if (!current) return;
    speak(getWordSpeakText(current, wordVoiceLang), { lang: wordVoiceLang, kind: 'word' });
  }, [current, speak, wordVoiceLang]);

  const playMeaningOnly = useCallback(() => {
    if (!current || !meaning) return;
    speak(meaning.text, { lang: meaning.lang, kind: 'meaning' });
  }, [current, meaning, speak]);

  /** 換詞時重置狀態並停止播放 — 不自動朗讀，需學生按 🔊 按鈕 */
  useEffect(() => {
    setRevealed(false);
    cancel();
  }, [currentIndex, current?.id, cancel]);

  useEffect(() => {
    if (allDone) onComplete?.();
  }, [allDone, onComplete]);

  if (!total) {
    return (
      <BilingualLabel
        zh={dt('尚無默書詞彙，請等候家長上載詞表，或先完成課文預習。')}
        en="No dictation words yet. Complete pre-study first or wait for a word list."
        size={isSEN ? 'md' : 'sm'}
        center
        className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-base' : 'text-sm')}`}
      />
    );
  }

  const markDoneAndNext = () => {
    if (!current) return;
    setCompletedIds((prev) => new Set([...prev, current.id]));
    onWordComplete?.(current.id);
    onAwardCoins?.(Math.max(5, Math.floor(COIN_REWARD / 2)));
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {linkedFromPrestudy && linkedWordCount > 0 && (
        <div
          className={`rounded-2xl border-2 px-4 py-3 animate-[fadeSlideIn_0.35s_ease-out]
            ${isNight
              ? 'border-sky-500/60 bg-sky-950/40 ring-2 ring-sky-700/30'
              : 'border-sky-300 bg-sky-50 ring-2 ring-sky-100'}`}
          role="status"
        >
          <BilingualLabel
            zh={dt(`✨ 已自動載入剛溫習完的 ${linkedWordCount} 個課文詞語，可以直接開始默書特訓！`)}
            en={`Loaded ${linkedWordCount} words from pre-study — start dictation now!`}
            size={isSEN ? 'md' : 'sm'}
            center
            className={`font-black ${isNight ? '[&_span:first-child]:text-sky-100 [&_span:last-child]:text-sky-300/80' : '[&_span:first-child]:text-sky-900 [&_span:last-child]:text-sky-700/80'}`}
          />
        </div>
      )}

      <div className="flex justify-between items-center flex-wrap gap-2">
        <span className={`font-black ${theme.accent} ${isSEN ? 'text-base' : 'text-sm'}`}>
          <BilingualLabel
            zh={dt(`第 ${currentIndex + 1} / ${total} 個詞`)}
            en={`Word ${currentIndex + 1} / ${total}`}
            size={isSEN ? 'md' : 'sm'}
          />
          {current?.isReview && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border inline-flex flex-col align-top
              ${isNight ? 'text-rose-200 bg-rose-900/50 border-rose-700' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
              <BilingualLabel zh={dt('常錯復習')} en="Review (often wrong)" size="sm" center />
            </span>
          )}
        </span>
      </div>

      <DictationTimer
        wordKey={current?.id ?? currentIndex}
        isSEN={isSEN}
        speaking={speaking}
        paused={allDone}
      />

      <BilingualLabel
        zh={dt('點頂部橙色 🔊 語音 按鈕，可切換人聲與語言')}
        en="Tap the orange 🔊 Voice button at the top to change voice"
        size="sm"
        center
        className={`font-bold ${getMutedTextClass(isNight, isSEN ? 'text-xs' : 'text-[10px]')}`}
      />

      <div
        className={`rounded-2xl border-2 border-dashed text-center transition-all duration-500
          ${isNight ? theme.hint : 'xh-day-hint'}
          ${isSEN ? 'py-10 px-4 sm:py-14 sm:px-8' : 'py-8 px-4 sm:py-12 sm:px-6'}
          ${speakingKind === 'word' ? (isNight ? 'ring-4 ring-sky-700 scale-[1.01]' : 'ring-4 ring-sky-200 scale-[1.01]') : ''}`}
        aria-live="polite"
      >
        <p className={`mb-4 ${isSEN ? 'text-6xl' : 'text-5xl'}`} aria-hidden>
          {speakingKind === 'word' ? '🔊' : '🎧'}
        </p>
        <p className={`font-black ${isNight ? 'text-stone-100' : ''} opacity-80 ${isSEN ? 'text-xl' : 'text-lg'}`}>
          {revealed ? getVocabChar(current, { language, studentType }) : '？？？'}
        </p>
        <BilingualLabel
          zh={
            revealed
              ? dt('（已顯示答案，對照你的默寫）')
              : speaking
                ? dt('閉眼聽音，在紙上默寫此詞')
                : dt('按下方 🔊 聽詞語，再在紙上默寫')
          }
          en={
            revealed
              ? '(Answer shown — check your writing)'
              : speaking
                ? 'Close your eyes, listen, and write on paper'
                : 'Tap 🔊 below to hear the word, then write on paper'
          }
          size={isSEN ? 'md' : 'sm'}
          center
          className={`mt-2 font-bold ${getMutedTextClass(isNight, isSEN ? 'text-sm' : 'text-xs')}`}
        />
      </div>

      {meaning && (
        <div
          className={`rounded-xl border-2 p-4 transition-all duration-300
            ${speakingKind === 'meaning'
              ? (isNight ? 'border-violet-500 bg-violet-900/30 ring-4 ring-violet-800' : 'border-violet-400 bg-violet-50 ring-4 ring-violet-100')
              : (isNight ? 'border-amber-600/50 bg-amber-900/20' : 'xh-day-meaning')}
            ${isSEN ? 'p-5' : 'p-4'}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <BilingualLabel
                zh={`${dt('💡 字義提示')}（${getSpeechLangLabel(meaning.lang)}）`}
                en="Meaning Hint"
                size={isSEN ? 'md' : 'sm'}
                className={`mb-1 ${isNight ? '[&_span:first-child]:text-amber-200 [&_span:last-child]:text-amber-400/70' : '[&_span:first-child]:text-amber-900 [&_span:last-child]:text-amber-700/70'}`}
              />
              <p className={`font-bold leading-relaxed ${isSEN ? 'text-base' : 'text-sm'} ${isNight ? 'text-stone-200' : 'text-slate-700'}`}>
                {meaning.label}
              </p>
              {(meaning.hintEn || current?.hintEn) && (
                <p className={`text-purple-700 text-sm mt-1.5 font-bold leading-relaxed ${isNight ? 'text-purple-300' : ''}`}>
                  Eng: {meaning.hintEn || current.hintEn}
                </p>
              )}
              {current?.en && (
                <p className={`text-purple-700 text-xs mt-1 font-bold opacity-80 ${isNight ? 'text-purple-400/80' : ''}`}>
                  Word: {current.en}
                </p>
              )}
            </div>
            <SpeechPlayButton
              label="🔊 聽字義"
              labelEn="Hear Meaning"
              loadingLabel="⏳ 讀取中…"
              playingLabel="🔊 播放中…"
              isLoading={loadingKind === 'meaning'}
              isPlaying={speakingKind === 'meaning'}
              disabled={speechBusy && loadingKind !== 'meaning' && speakingKind !== 'meaning'}
              onClick={playMeaningOnly}
              variant="violet"
              isSEN={isSEN}
              className="shrink-0"
            />
          </div>
        </div>
      )}

      <div className={`grid gap-3 sm:grid-cols-2 ${isSEN ? 'gap-4' : ''}`}>
        <SpeechPlayButton
          label="🔊 聽詞語"
          labelEn="Hear Word"
          loadingLabel="⏳ 讀取中…"
          playingLabel="🔊 播放中…"
          isLoading={loadingKind === 'word'}
          isPlaying={speakingKind === 'word'}
          disabled={speechBusy && loadingKind !== 'word' && speakingKind !== 'word'}
          onClick={playWordOnly}
          variant="theme"
          isSEN={isSEN}
          fullWidth
          className={theme.btn}
        />

        <SpeechPlayButton
          label="🔊 詞語 + 字義"
          labelEn="Word + Meaning"
          loadingLabel="⏳ 讀取中…"
          playingLabel="🔊 播放中…"
          isLoading={loadingKind === 'word' || loadingKind === 'meaning'}
          isPlaying={Boolean(speakingKind)}
          disabled={speechBusy}
          onClick={playWordAndMeaning}
          variant="indigo"
          isSEN={isSEN}
          fullWidth
        />

        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className={`rounded-xl font-black border-2 transition
            ${isNight ? 'bg-stone-700 hover:bg-stone-600 border-stone-500 text-amber-100' : 'bg-white hover:bg-amber-50 border-amber-300 text-amber-900'}
            ${isSEN ? 'py-4 text-lg' : 'py-3 text-base'}`}
        >
          <BilingualLabel
            zh={revealed ? dt('🙈 隱藏答案') : dt('👁 對答案')}
            en={revealed ? 'Hide Answer' : 'Show Answer'}
            size={isSEN ? 'lg' : 'md'}
            center
            className={isNight ? '[&_span:last-child]:text-amber-200/70' : '[&_span:last-child]:text-amber-800/70'}
          />
        </button>

        <button
          type="button"
          onClick={markDoneAndNext}
          className={`rounded-xl font-black text-white border-2 bg-emerald-500 hover:bg-emerald-600 border-emerald-600
            transition active:scale-[0.98] ${isSEN ? 'py-4 text-lg' : 'py-3 text-base'}`}
        >
          <BilingualLabel
            zh={isLast && completedIds.has(current?.id) ? dt('✓ 全部完成') : dt('✓ 寫完了，下一個')}
            en={isLast && completedIds.has(current?.id) ? 'All Done!' : 'Done — Next Word'}
            size={isSEN ? 'lg' : 'md'}
            center
            className="[&_span:last-child]:text-emerald-100/80"
          />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {vocabList.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`w-3 h-3 rounded-full transition-all
              ${i === currentIndex ? 'bg-sky-500 scale-125' : completedIds.has(v.id) ? 'bg-emerald-400' : (isNight ? 'bg-stone-600' : 'bg-slate-300')}
              ${v.isReview ? (isNight ? 'ring-2 ring-rose-500' : 'ring-2 ring-rose-300') : ''}`}
            aria-label={`第 ${i + 1} 詞`}
          />
        ))}
      </div>

      {allDone && (
        <BilingualLabel
          zh={dt('🎉 今日默書完成！')}
          en="Dictation complete for today!"
          size={isSEN ? 'lg' : 'md'}
          center
          className={`font-black animate-[fadeSlideIn_0.35s_ease-out] ${isNight ? 'text-emerald-300 [&_span:last-child]:text-emerald-400/80' : 'text-emerald-700 [&_span:last-child]:text-emerald-600/80'}`}
        />
      )}
    </div>
  );
}
