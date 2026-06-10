import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSpeechLangLabel } from './useSpeech';
import { useVoicePreferences } from './VoicePreferencesContext';
import { useSpeechContext } from './SpeechContext';
import SpeechVoiceSettings from './SpeechVoiceSettings';
import { BilingualLabel } from './BilingualLabel';
import { useBodyScrollLock } from './useBodyScrollLock';

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
const PANEL_Z = 120;
const BACKDROP_Z = 119;

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 1023px)').matches;
}

/**
 * Header 語音選單 — Portal 浮層，避免被 sticky header overflow 裁切
 */
export default function SpeechVoiceHeaderMenu({ isSEN, isNight, theme, task = 'dictation', prominent = false }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const [isMobileSheet, setIsMobileSheet] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const { wordVoiceLang, meaningVoiceLang } = useVoicePreferences();
  const { speechBusy, speechError, clearSpeechError, speechProvider, lastFromCache } = useSpeechContext();

  const taskMeta = TASK_VOICE_META[task] ?? DEFAULT_TASK_META;

  useBodyScrollLock(open);

  const updatePanelPosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const mobile = isMobileViewport();
    setIsMobileSheet(mobile);
    const margin = 12;
    const gap = 8;
    const maxPanelHeight = Math.min(window.innerHeight * 0.72, 520);

    if (mobile) {
      setPanelStyle({
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        top: 'auto',
        width: '100%',
        maxHeight: 'min(88vh, 520px)',
        borderTopLeftRadius: '1rem',
        borderTopRightRadius: '1rem',
        zIndex: PANEL_Z,
      });
      return;
    }

    const panelWidth = Math.min(340, window.innerWidth - margin * 2);
    let left = rect.right - panelWidth;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

    let top = rect.bottom + gap;
    if (top + maxPanelHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - maxPanelHeight - gap);
    }

    setPanelStyle({
      position: 'fixed',
      top,
      left,
      width: panelWidth,
      maxHeight: maxPanelHeight,
      zIndex: PANEL_Z,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updatePanelPosition();

    const onLayout = () => updatePanelPosition();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [open, updatePanelPosition]);

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
      const target = e.target;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const summaryParts = [];
  if (taskMeta.showWord) summaryParts.push(getSpeechLangLabel(wordVoiceLang));
  if (taskMeta.showMeaning) summaryParts.push(getSpeechLangLabel(meaningVoiceLang));
  const summary = summaryParts.join(' / ');

  const panelClass = `border-2 shadow-2xl overflow-y-auto xh-scroll
    ${isMobileSheet ? 'rounded-t-2xl border-b-0' : 'rounded-xl'}
    ${isNight ? 'xh-scroll--dark bg-stone-900 border-stone-600 text-stone-100' : 'bg-white border-stone-200 text-stone-800'}
    ${isSEN ? 'p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]' : 'p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'}`;

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

  const portal = open && typeof document !== 'undefined' && panelStyle
    ? createPortal(
      <>
        <button
          type="button"
          aria-label="關閉語音設定"
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] touch-none"
          style={{ zIndex: BACKDROP_Z }}
          onClick={() => setOpen(false)}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={taskMeta.dialogTitle}
          className={panelClass}
          style={panelStyle}
        >
          {isMobileSheet && (
            <div className="flex justify-center mb-2" aria-hidden>
              <span className={`w-10 h-1 rounded-full ${isNight ? 'bg-stone-600' : 'bg-stone-300'}`} />
            </div>
          )}
          {panelContent}
          {isMobileSheet && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`mt-3 w-full rounded-xl border-2 font-black py-2.5 transition active:scale-[0.98]
                ${isNight ? 'border-stone-600 bg-stone-800 text-amber-100' : 'border-stone-300 bg-stone-100 text-stone-800'}
                ${isSEN ? 'text-base' : 'text-sm'}`}
            >
              <BilingualLabel zh="關閉" en="Close" size={isSEN ? 'md' : 'sm'} center />
            </button>
          )}
        </div>
      </>,
      document.body,
    )
    : null;

  return (
    <>
      <div className={`relative ${prominent ? 'shrink-0' : ''}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setOpen((v) => {
              if (!v) {
                clearSpeechError();
                requestAnimationFrame(() => updatePanelPosition());
              }
              return !v;
            });
          }}
          aria-expanded={open}
          aria-haspopup="dialog"
          title={`${taskMeta.buttonTitle} / Voice`}
          className={`flex items-center justify-center gap-1 rounded-lg border font-black transition-all duration-300
            ${prominent
              ? 'flex-row px-2 py-1 min-h-0'
              : 'gap-1.5 rounded-xl'}
            ${isNight
              ? 'bg-amber-500/20 border-amber-600/70 text-amber-100 hover:bg-amber-500/30'
              : 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200'}
            ${open ? 'ring-1 ring-amber-400/60' : ''}
            ${speechError ? 'border-rose-400' : ''}
            ${isSEN ? 'text-sm' : 'text-xs'}`}
        >
          <span className="text-sm leading-none" aria-hidden>🔊</span>
          <span className="flex flex-col leading-none text-center">
            <span className="text-[10px] font-black">語音</span>
            {!prominent && <span className="text-[9px] font-normal opacity-70 hidden sm:block">Voice</span>}
          </span>
          {!prominent && (
            <span className="opacity-60 hidden md:inline max-w-[5rem] truncate">{summary}</span>
          )}
          <span className="opacity-50 text-[10px] hidden sm:inline" aria-hidden>{open ? '▼' : '▶'}</span>
        </button>
      </div>
      {portal}
    </>
  );
}
