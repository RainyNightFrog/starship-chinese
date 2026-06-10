import React, { useEffect, useRef, useState } from 'react';
import { getSpeechLangLabel } from './useSpeech';
import { useVoicePreferences } from './VoicePreferencesContext';
import { useSpeechContext } from './SpeechContext';
import SpeechVoiceSettings from './SpeechVoiceSettings';
import { BilingualLabel } from './BilingualLabel';

const TASK_VOICE_META = {
  dictation: {
    buttonTitle: '默書語音設定（護眼聽寫）',
    dialogTitle: '🔊 默書語音（護眼聽寫）',
    dialogTitleEn: 'Dictation Voice Settings',
    subtitle: '選好語音後，按下方 🔊 才會播放',
    subtitleEn: 'Choose voice, then tap 🔊 below to play',
    showWord: true,
    showMeaning: true,
  },
  prestudy: {
    buttonTitle: '預習語音設定',
    dialogTitle: '🔊 課文預習 · 語音選擇',
    dialogTitleEn: 'Pre-study · Voice Settings',
    subtitle: '與默書共用設定；粵語請手動選 Tracy 引擎',
    subtitleEn: 'Shared with dictation; pick Tracy for Cantonese',
    showWord: true,
    showMeaning: true,
  },
  quiz: {
    buttonTitle: '測驗字義語音設定',
    dialogTitle: '🔊 字義語音',
    dialogTitleEn: 'Meaning Voice',
    subtitle: '測驗提示使用此設定；粵語請手動選引擎',
    subtitleEn: 'Quiz hints use this setting',
    showWord: false,
    showMeaning: true,
  },
  sspa: {
    buttonTitle: '測驗字義語音設定',
    dialogTitle: '🔊 字義語音',
    dialogTitleEn: 'Meaning Voice',
    subtitle: '測驗提示使用此設定；粵語請手動選引擎',
    subtitleEn: 'Quiz hints use this setting',
    showWord: false,
    showMeaning: true,
  },
  sentence: {
    buttonTitle: '句子練習語音設定',
    dialogTitle: '🔊 字義語音',
    dialogTitleEn: 'Meaning Voice',
    subtitle: '答錯提示使用此設定；粵語請手動選引擎',
    subtitleEn: 'Wrong-answer hints use this setting',
    showWord: false,
    showMeaning: true,
  },
  reading: {
    buttonTitle: '閱讀朗讀語音設定',
    dialogTitle: '🔊 閱讀理解 · 朗讀語音',
    dialogTitleEn: 'Reading · Read-aloud Voice',
    subtitle: '選好語音後，可朗讀文章或題目',
    subtitleEn: 'Choose voice to read passage or questions',
    showWord: true,
    showMeaning: false,
  },
};

const DEFAULT_TASK_META = TASK_VOICE_META.dictation;

/**
 * Header 語音選單 — 所有學習模式統一置於右上角（夜間按鈕右側）
 */
export default function SpeechVoiceHeaderMenu({ isSEN, isNight, theme, task = 'dictation' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { wordVoiceLang, meaningVoiceLang } = useVoicePreferences();
  const { speechBusy, speechError, speechProvider, lastFromCache } = useSpeechContext();

  const taskMeta = TASK_VOICE_META[task] ?? DEFAULT_TASK_META;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const summaryParts = [];
  if (taskMeta.showWord) summaryParts.push(getSpeechLangLabel(wordVoiceLang));
  if (taskMeta.showMeaning) summaryParts.push(getSpeechLangLabel(meaningVoiceLang));
  const summary = summaryParts.join(' / ');

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`${taskMeta.buttonTitle} / Voice`}
        className={`flex items-center gap-1.5 rounded-xl border-2 font-black transition-all duration-300
          ${isNight
            ? 'bg-stone-800 border-amber-600/70 text-amber-100 hover:bg-stone-700'
            : 'bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100'}
          ${open ? 'ring-2 ring-amber-400/60' : ''}
          ${speechError ? 'border-rose-400' : ''}
          ${isSEN ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'}`}
      >
        <span aria-hidden>🔊</span>
        <span className="hidden sm:inline flex flex-col leading-tight">
          <span>語音</span>
          <span className="text-[9px] font-normal opacity-60">Voice</span>
        </span>
        <span className="opacity-60 hidden md:inline max-w-[5rem] truncate">{summary}</span>
        <span className="opacity-50 text-[10px]" aria-hidden>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={taskMeta.dialogTitle}
          className={`absolute right-0 top-full mt-2 z-[60] w-[min(320px,calc(100vw-2rem))] rounded-xl border-2 shadow-2xl
            overflow-y-auto max-h-[min(70vh,520px)] xh-scroll
            ${isNight ? 'xh-scroll--dark bg-stone-900 border-stone-600 text-stone-100' : 'bg-white border-stone-200 text-stone-800'}
            ${isSEN ? 'p-4' : 'p-3'}`}
        >
          <BilingualLabel
            zh={taskMeta.dialogTitle}
            en={taskMeta.dialogTitleEn}
            size={isSEN ? 'md' : 'sm'}
            center
            className={`font-black mb-3 ${isNight ? '[&_span:first-child]:text-amber-200' : theme?.accent ?? 'text-sky-800'}`}
          />
          <SpeechVoiceSettings
            isSEN={isSEN}
            isNight={isNight}
            disabled={speechBusy}
            speechError={speechError}
            speechProvider={speechProvider}
            lastFromCache={lastFromCache}
            subtitle={taskMeta.subtitle}
            subtitleEn={taskMeta.subtitleEn}
            showWord={taskMeta.showWord}
            showMeaning={taskMeta.showMeaning}
            compact
          />
        </div>
      )}
    </div>
  );
}
