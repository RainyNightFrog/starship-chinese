import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 * Header 語音選單 — 手機版全屏彈層，桌面版下拉
 */
export default function SpeechVoiceHeaderMenu({ isSEN, isNight, theme, task = 'dictation', prominent = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { wordVoiceLang, meaningVoiceLang } = useVoicePreferences();
  const { speechBusy, speechError, speechProvider, lastFromCache } = useSpeechContext();

  const taskMeta = TASK_VOICE_META[task] ?? DEFAULT_TASK_META;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const summaryParts = [];
  if (taskMeta.showWord) summaryParts.push(getSpeechLangLabel(wordVoiceLang));
  if (taskMeta.showMeaning) summaryParts.push(getSpeechLangLabel(meaningVoiceLang));
  const summary = summaryParts.join(' / ');

  const panelClass = `rounded-xl border-2 shadow-2xl overflow-y-auto max-h-[min(70vh,520px)] xh-scroll
    ${isNight ? 'xh-scroll--dark bg-stone-900 border-stone-600 text-stone-100' : 'bg-white border-stone-200 text-stone-800'}
    ${isSEN ? 'p-4' : 'p-3'}`;

  const panelContent = (
    <>
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
    </>
  );

  return (
    <div ref={rootRef} className={`relative ${prominent ? 'flex-1 flex justify-center min-w-0 max-w-[8rem]' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`${taskMeta.buttonTitle} / Voice`}
        className={`flex items-center justify-center gap-1 rounded-xl border-2 font-black transition-all duration-300
          ${prominent
            ? 'w-full flex-col py-2 px-3 min-h-[2.75rem] ring-2 ring-amber-400/50'
            : 'gap-1.5'}
          ${isNight
            ? 'bg-amber-500/25 border-amber-500 text-amber-100 hover:bg-amber-500/35'
            : 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200'}
          ${open ? 'ring-2 ring-amber-400 scale-[1.02]' : ''}
          ${speechError ? 'border-rose-400' : ''}
          ${isSEN ? 'text-sm' : 'text-xs'}`}
      >
        <span className={prominent ? 'text-xl' : 'text-base'} aria-hidden>🔊</span>
        <span className="flex flex-col leading-tight text-center">
          <span className={prominent ? 'text-xs font-black' : ''}>語音</span>
          <span className={`font-normal opacity-70 ${prominent ? 'text-[9px]' : 'text-[9px] hidden sm:block'}`}>Voice</span>
        </span>
        {!prominent && (
          <span className="opacity-60 hidden md:inline max-w-[5rem] truncate">{summary}</span>
        )}
        <span className="opacity-50 text-[10px] hidden sm:inline" aria-hidden>{open ? '▼' : '▶'}</span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <button
            type="button"
            aria-label="關閉語音設定"
            className="lg:hidden fixed inset-0 z-[78] bg-black/45"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={taskMeta.dialogTitle}
            className={`lg:hidden fixed left-3 right-3 top-[max(5.5rem,env(safe-area-inset-top))] z-[79] ${panelClass}`}
          >
            {panelContent}
          </div>
        </>,
        document.body,
      )}

      {open && (
        <div
          role="dialog"
          aria-label={taskMeta.dialogTitle}
          className={`hidden lg:block absolute right-0 top-full mt-2 z-[80] w-[min(320px,calc(100vw-2rem))] ${panelClass}`}
        >
          {panelContent}
        </div>
      )}
    </div>
  );
}
